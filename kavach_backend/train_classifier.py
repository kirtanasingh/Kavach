"""Train EfficientNet-B2 classifier for Kavach ML module.

Default outputs:
  app/ml/model.pt
  app/ml/labels.json
"""

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import torch
from torch import nn
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import datasets, models, transforms
from tqdm import tqdm


# ---------------------------------------------------------------------------
# Transforms
# ---------------------------------------------------------------------------


def build_transforms(img_size: int) -> Dict[str, transforms.Compose]:
    mean = [0.485, 0.456, 0.406]
    std = [0.229, 0.224, 0.225]
    return {
        "train": transforms.Compose(
            [
                transforms.Resize((img_size + 32, img_size + 32)),
                transforms.RandomCrop(img_size),
                transforms.RandomHorizontalFlip(),
                transforms.RandomVerticalFlip(),
                transforms.ColorJitter(
                    brightness=0.4,
                    contrast=0.4,
                    saturation=0.3,
                    hue=0.1,
                ),
                transforms.RandomRotation(30),
                transforms.RandomAffine(degrees=0, shear=10),
                transforms.ToTensor(),
                transforms.Normalize(mean, std),
            ]
        ),
        "valid": transforms.Compose(
            [
                transforms.Resize((img_size, img_size)),
                transforms.ToTensor(),
                transforms.Normalize(mean, std),
            ]
        ),
    }


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------


def build_model(num_classes: int) -> nn.Module:
    model = models.efficientnet_b2(weights=models.EfficientNet_B2_Weights.IMAGENET1K_V1)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    return model


# ---------------------------------------------------------------------------
# Train / Eval loops
# ---------------------------------------------------------------------------


def train_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: Optional[torch.optim.Optimizer],
    scheduler: Optional[torch.optim.lr_scheduler.LRScheduler],
    device: torch.device,
) -> Tuple[float, float]:
    model.train()
    total_loss = correct = total = 0
    for imgs, labels in tqdm(loader, desc="  train", leave=False):
        imgs, labels = imgs.to(device), labels.to(device)
        if optimizer is None:
            raise RuntimeError("optimizer is required for training")
        optimizer.zero_grad()
        with torch.cuda.amp.autocast(enabled=device.type == "cuda"):
            outputs = model(imgs)
            loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        if scheduler is not None:
            scheduler.step()
        total_loss += loss.item() * imgs.size(0)
        preds = outputs.argmax(1)
        correct += (preds == labels).sum().item()
        total += imgs.size(0)
    return total_loss / total, correct / total


@torch.no_grad()
def eval_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> Tuple[float, float]:
    model.eval()
    total_loss = correct = total = 0
    for imgs, labels in tqdm(loader, desc="  val", leave=False):
        imgs, labels = imgs.to(device), labels.to(device)
        with torch.cuda.amp.autocast(enabled=device.type == "cuda"):
            outputs = model(imgs)
            loss = criterion(outputs, labels)
        total_loss += loss.item() * imgs.size(0)
        preds = outputs.argmax(1)
        correct += (preds == labels).sum().item()
        total += imgs.size(0)
    return total_loss / total, correct / total


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="Train EfficientNet-B2 classifier.")
    parser.add_argument("--dataset_dir", type=str, default="../unified_dataset")
    parser.add_argument("--output_dir", type=str, default="app/ml")
    parser.add_argument("--epochs_phase1", type=int, default=10)
    parser.add_argument("--epochs_phase2", type=int, default=20)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr_head", type=float, default=1e-3)
    parser.add_argument("--lr_finetune", type=float, default=1e-4)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--img_size", type=int, default=224)
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device        : {device}")
    print(f"Dataset dir   : {dataset_dir}")
    print(f"Output dir    : {output_dir}")

    tf = build_transforms(args.img_size)

    # Datasets
    train_ds = datasets.ImageFolder(dataset_dir / "train", tf["train"])
    valid_ds = datasets.ImageFolder(dataset_dir / "valid", tf["valid"])
    labels: Dict[str, str] = {str(v): k for k, v in train_ds.class_to_idx.items()}
    num_classes = len(labels)
    print(f"Classes       : {num_classes}  ->  {list(labels.values())}\n")

    labels_path = output_dir / "labels.json"
    json.dump(labels, labels_path.open("w", encoding="utf-8"), indent=2)
    print(f"Labels saved  -> {labels_path}")

    counts = Counter(train_ds.targets)
    sample_weights = [1.0 / counts[t] for t in train_ds.targets]
    sampler = WeightedRandomSampler(sample_weights, num_samples=len(sample_weights), replacement=True)

    pin = device.type == "cuda"
    train_dl = DataLoader(
        train_ds,
        batch_size=args.batch_size,
        sampler=sampler,
        num_workers=args.workers,
        pin_memory=pin,
    )
    valid_dl = DataLoader(
        valid_ds,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.workers,
        pin_memory=pin,
    )
    model = build_model(num_classes).to(device)

    for p in model.parameters():
        p.requires_grad = False
    for p in model.classifier.parameters():
        p.requires_grad = True

    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

    head_optimizer = torch.optim.AdamW(
        model.classifier.parameters(),
        lr=args.lr_head,
        weight_decay=1e-4,
    )
    head_scheduler = torch.optim.lr_scheduler.OneCycleLR(
        head_optimizer,
        max_lr=args.lr_head,
        steps_per_epoch=len(train_dl),
        epochs=args.epochs_phase1,
    )

    best_val_acc = 0.0
    history: List[Dict[str, float | int | str]] = []

    print(f"\n=== Phase 1: Train classifier head ({args.epochs_phase1} epochs) ===")
    for epoch in range(1, args.epochs_phase1 + 1):
        tr_loss, tr_acc = train_epoch(model, train_dl, criterion, head_optimizer, head_scheduler, device)
        vl_loss, vl_acc = eval_epoch(model, valid_dl, criterion, device)
        print(
            f"Epoch {epoch:02d} | loss={tr_loss:.4f} | train={tr_acc:.3f} | val={vl_acc:.3f}"
        )
        history.append(
            {
                "phase": "head",
                "epoch": epoch,
                "train_loss": round(tr_loss, 5),
                "train_acc": round(tr_acc, 5),
                "valid_loss": round(vl_loss, 5),
                "valid_acc": round(vl_acc, 5),
            }
        )
        if vl_acc > best_val_acc:
            best_val_acc = vl_acc
            torch.save(model.state_dict(), output_dir / "model.pt")
            print(f"  Saved best model (val={vl_acc:.3f})")

    print(f"\n=== Phase 2: Fine-tune full model ({args.epochs_phase2} epochs) ===")
    for p in model.parameters():
        p.requires_grad = True

    fine_optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr_finetune, weight_decay=1e-4)
    fine_scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(fine_optimizer, T_max=args.epochs_phase2)

    for epoch in range(1, args.epochs_phase2 + 1):
        tr_loss, tr_acc = train_epoch(model, train_dl, criterion, fine_optimizer, None, device)
        vl_loss, vl_acc = eval_epoch(model, valid_dl, criterion, device)
        fine_scheduler.step()

        print(
            f"Epoch {epoch:02d} | loss={tr_loss:.4f} | train={tr_acc:.3f} | val={vl_acc:.3f}"
        )
        history.append(
            {
                "phase": "finetune",
                "epoch": epoch,
                "train_loss": round(tr_loss, 5),
                "train_acc": round(tr_acc, 5),
                "valid_loss": round(vl_loss, 5),
                "valid_acc": round(vl_acc, 5),
            }
        )
        if vl_acc > best_val_acc:
            best_val_acc = vl_acc
            torch.save(model.state_dict(), output_dir / "model.pt")
            print(f"  Saved best model (val={vl_acc:.3f})")

    report = {
        "num_classes": num_classes,
        "classes": list(labels.values()),
        "best_valid_acc": round(best_val_acc, 5),
        "epochs_phase1": args.epochs_phase1,
        "epochs_phase2": args.epochs_phase2,
        "history": history,
    }
    report_path = output_dir / "training_report.json"
    json.dump(report, report_path.open("w", encoding="utf-8"), indent=2)
    print(f"Report saved  -> {report_path}")
    print(f"Model saved   -> {output_dir / 'model.pt'}")
    print(f"\nFinal best val accuracy: {best_val_acc:.3f}")
    print("Training complete.")


if __name__ == "__main__":
    main()
