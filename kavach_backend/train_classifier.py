"""
train_classifier.py
-------------------
Trains an EfficientNet-B0 classifier on unified_dataset/ and saves:
    kavach_backend/ml_models/model.pt
    kavach_backend/ml_models/labels.json
    kavach_backend/ml_models/training_report.json

Usage:
    python train_classifier.py \
        --dataset_dir unified_dataset \
        --output_dir  kavach_backend/ml_models \
        --epochs 15

Requirements:
    pip install torch torchvision pillow tqdm
"""

import argparse
import json
import pathlib
import time
from typing import Dict, List, Tuple

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
from tqdm import tqdm


# ---------------------------------------------------------------------------
# Transforms
# ---------------------------------------------------------------------------


def build_transforms() -> Dict[str, transforms.Compose]:
    mean = [0.485, 0.456, 0.406]
    std = [0.229, 0.224, 0.225]
    return {
        "train": transforms.Compose(
            [
                transforms.Resize((256, 256)),
                transforms.RandomCrop(224),
                transforms.RandomHorizontalFlip(),
                transforms.RandomVerticalFlip(p=0.2),
                transforms.RandomRotation(20),
                transforms.ColorJitter(
                    brightness=0.3,
                    contrast=0.3,
                    saturation=0.2,
                    hue=0.05,
                ),
                transforms.RandomGrayscale(p=0.05),
                transforms.ToTensor(),
                transforms.Normalize(mean, std),
            ]
        ),
        "valid": transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean, std),
            ]
        ),
        "test": transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean, std),
            ]
        ),
    }


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------


def build_model(num_classes: int) -> nn.Module:
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
    # Unfreeze last 2 blocks + classifier for fine-tuning
    for name, param in model.named_parameters():
        if "features.7" in name or "features.8" in name or "classifier" in name:
            param.requires_grad = True
        else:
            param.requires_grad = False
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.4, inplace=True),
        nn.Linear(in_features, num_classes),
    )
    return model


# ---------------------------------------------------------------------------
# Train / Eval loops
# ---------------------------------------------------------------------------


def train_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
    scaler: torch.cuda.amp.GradScaler,
) -> Tuple[float, float]:
    model.train()
    total_loss = correct = total = 0
    for imgs, labels in tqdm(loader, desc="  train", leave=False):
        imgs, labels = imgs.to(device), labels.to(device)
        optimizer.zero_grad()
        with torch.cuda.amp.autocast(enabled=device.type == "cuda"):
            outputs = model(imgs)
            loss = criterion(outputs, labels)
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
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
    for imgs, labels in tqdm(loader, desc="  valid", leave=False):
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
    parser = argparse.ArgumentParser(description="Train EfficientNet-B0 classifier.")
    parser.add_argument("--dataset_dir", type=str, default="unified_dataset")
    parser.add_argument("--output_dir", type=str, default="kavach_backend/ml_models")
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()

    dataset_dir = pathlib.Path(args.dataset_dir).resolve()
    output_dir = pathlib.Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device        : {device}")
    print(f"Dataset dir   : {dataset_dir}")
    print(f"Output dir    : {output_dir}")

    tf = build_transforms()

    # Datasets
    train_ds = datasets.ImageFolder(dataset_dir / "train", tf["train"])
    valid_ds = datasets.ImageFolder(dataset_dir / "valid", tf["valid"])
    test_ds = datasets.ImageFolder(dataset_dir / "test", tf["test"])

    labels: List[str] = train_ds.classes
    num_classes = len(labels)
    print(f"Classes       : {num_classes}  ->  {labels}\n")

    # Save labels immediately so endpoint can load them even before training ends
    labels_path = output_dir / "labels.json"
    json.dump(labels, labels_path.open("w"), indent=2)
    print(f"Labels saved  -> {labels_path}")

    # DataLoaders
    pin = device.type == "cuda"
    train_dl = DataLoader(
        train_ds,
        batch_size=args.batch_size,
        shuffle=True,
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
    test_dl = DataLoader(
        test_ds,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.workers,
        pin_memory=pin,
    )

    model = build_model(num_classes).to(device)

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_p = sum(p.numel() for p in model.parameters())
    print(f"Trainable params: {trainable:,} / {total_p:,}\n")

    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad],
        lr=args.lr,
        weight_decay=1e-4,
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=args.epochs,
        eta_min=1e-6,
    )
    scaler = torch.cuda.amp.GradScaler(enabled=device.type == "cuda")

    best_val_acc = 0.0
    history = []

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        print(f"Epoch {epoch}/{args.epochs}")

        tr_loss, tr_acc = train_epoch(model, train_dl, criterion, optimizer, device, scaler)
        vl_loss, vl_acc = eval_epoch(model, valid_dl, criterion, device)
        scheduler.step()

        elapsed = time.time() - t0
        lr_now = optimizer.param_groups[0]["lr"]
        print(
            f"  train loss={tr_loss:.4f}  acc={tr_acc*100:.2f}%  |  "
            f"valid loss={vl_loss:.4f}  acc={vl_acc*100:.2f}%  |  "
            f"lr={lr_now:.2e}  ({elapsed:.0f}s)"
        )

        history.append(
            {
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
            print(f"  New best ({best_val_acc*100:.2f}%) - model saved.")

    # Final test evaluation
    print("\nRunning test set evaluation on best model...")
    model.load_state_dict(torch.load(output_dir / "model.pt", map_location=device))
    test_loss, test_acc = eval_epoch(model, test_dl, criterion, device)
    print(f"Test loss={test_loss:.4f}  acc={test_acc*100:.2f}%")

    # Save training report
    report = {
        "num_classes": num_classes,
        "classes": labels,
        "best_valid_acc": round(best_val_acc, 5),
        "test_acc": round(test_acc, 5),
        "epochs_trained": args.epochs,
        "history": history,
    }
    report_path = output_dir / "training_report.json"
    json.dump(report, report_path.open("w"), indent=2)
    print(f"Report saved  -> {report_path}")
    print(f"Model saved   -> {output_dir / 'model.pt'}")
    print("\nTraining complete! Next step: start your FastAPI server.")


if __name__ == "__main__":
    main()
