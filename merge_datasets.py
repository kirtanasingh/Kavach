"""
merge_datasets.py
-----------------
Merges cattle, PoultryDisease, and Pig Skin Disease datasets into a single
unified_dataset/ with train/ valid/ test/ splits and prefixed class names.

Usage:
    python merge_datasets.py --base_dir "C:/Users/Kirtana Singh/Downloads"

Requirements:
    pip install pillow
"""

import argparse
import csv
import pathlib
import random
import re
import shutil
from collections import defaultdict
from typing import DefaultDict, Dict, List, Tuple


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DATASETS: Dict[str, List[str]] = {
    "pig": [
        "datasets_upload/pig/Pig Skin Disease Single Label v4.v24i.folder",
    ],
    "poultry": [
        "datasets_upload/poultry/Chicken Data.v35i.folder",
        "datasets_upload/poultry/PoultryDisease/poultry_diseases",
    ],
    "cattle": [
        "datasets_upload/cattle/cattle diseases.v2i.folder",
        "datasets_upload/cattle/cow/Cows datasets",
        "datasets_upload/cattle/cattle",
    ],
}

SPLIT_RATIOS: Tuple[float, float, float] = (0.70, 0.20, 0.10)  # train/valid/test
SPLITS: List[str] = ["train", "valid", "test"]
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}
RANDOM_SEED = 42
MIN_IMAGES_PER_CLASS = 20


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def is_image(path: pathlib.Path) -> bool:
    return path.suffix.lower() in IMAGE_EXTENSIONS


def collect_images(folder: pathlib.Path) -> List[pathlib.Path]:
    """Return all image files directly inside folder (non-recursive)."""
    return [f for f in folder.iterdir() if f.is_file() and is_image(f)]


def normalize_class_name(name: str) -> str:
    """Create stable class names safe for directory paths."""
    return re.sub(r"[^a-z0-9]+", "_", name.strip().lower()).strip("_")


def find_existing_subdir(parent: pathlib.Path, names: List[str]) -> pathlib.Path | None:
    for name in names:
        candidate = parent / name
        if candidate.is_dir():
            return candidate
    return None


def has_split_structure(dataset_dir: pathlib.Path) -> bool:
    """Return True if at least 'train' sub-folder exists with image-bearing class dirs."""
    train = find_existing_subdir(dataset_dir, ["train", "Train"])
    if train is None:
        return False
    if not train.is_dir():
        return False
    class_dirs = [d for d in train.iterdir() if d.is_dir()]
    return len(class_dirs) > 0


def has_csv_label_structure(dataset_dir: pathlib.Path) -> bool:
    csv_path = dataset_dir / "train_data.csv"
    train_dir = find_existing_subdir(dataset_dir, ["Train", "train"])
    return csv_path.is_file() and train_dir is not None


def split_files(
    files: List[pathlib.Path],
    ratios: Tuple[float, float, float],
    seed: int = RANDOM_SEED,
) -> Dict[str, List[pathlib.Path]]:
    """Randomly shuffle and split a list of file paths into train/valid/test."""
    rng = random.Random(seed)
    files = list(files)
    rng.shuffle(files)
    n = len(files)
    n_train = int(n * ratios[0])
    n_valid = int(n * ratios[1])
    return {
        "train": files[:n_train],
        "valid": files[n_train : n_train + n_valid],
        "test": files[n_train + n_valid :],
    }


def copy_file(src: pathlib.Path, dst: pathlib.Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


# ---------------------------------------------------------------------------
# Per-dataset ingestion
# ---------------------------------------------------------------------------


def ingest_with_existing_splits(
    dataset_dir: pathlib.Path,
    prefix: str,
    out_dir: pathlib.Path,
) -> Dict[str, int]:
    """Dataset already has train/ valid/ test/ sub-folders."""
    counts: Dict[str, int] = {s: 0 for s in SPLITS}
    split_aliases = {
        "train": ["train", "Train"],
        "valid": ["valid", "Valid", "val", "Val", "validation", "Validation"],
        "test": ["test", "Test"],
    }

    for split in SPLITS:
        split_dir = find_existing_subdir(dataset_dir, split_aliases[split])
        if split_dir is None:
            print(f"    [WARN] '{split}' folder missing in {dataset_dir.name}, skipping.")
            continue
        for class_dir in sorted(split_dir.iterdir()):
            if not class_dir.is_dir():
                continue
            normalized = normalize_class_name(class_dir.name)
            if normalized in {"unlabeled", "unlabelled"}:
                continue
            class_name = f"{prefix}_{normalized}"
            imgs = collect_images(class_dir)
            if len(imgs) < MIN_IMAGES_PER_CLASS:
                print(
                    f"    [WARN] Skipping class '{class_dir.name}' in split '{split}' "
                    f"(only {len(imgs)} images)."
                )
                continue
            dst_dir = out_dir / split / class_name
            dst_dir.mkdir(parents=True, exist_ok=True)
            for img in imgs:
                copy_file(img, dst_dir / img.name)
                counts[split] += 1
    return counts


def ingest_csv_labeled_dataset(
    dataset_dir: pathlib.Path,
    prefix: str,
    out_dir: pathlib.Path,
) -> Dict[str, int]:
    """Dataset has one image folder + CSV with filename,label columns."""
    counts: Dict[str, int] = {s: 0 for s in SPLITS}
    csv_path = dataset_dir / "train_data.csv"
    image_root = find_existing_subdir(dataset_dir, ["Train", "train"])
    if image_root is None:
        print(f"    [WARN] Missing image folder (Train/train) in {dataset_dir}, skipping.")
        return counts

    grouped: DefaultDict[str, List[pathlib.Path]] = defaultdict(list)
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        required = {"images", "label"}
        if not required.issubset(set(reader.fieldnames or [])):
            print(f"    [WARN] CSV format in {csv_path.name} must include 'images' and 'label'.")
            return counts

        for row in reader:
            img_name = (row.get("images") or "").strip()
            label = (row.get("label") or "").strip()
            if not img_name or not label:
                continue
            img_path = image_root / img_name
            if img_path.is_file() and is_image(img_path):
                grouped[label].append(img_path)

    if not grouped:
        print(f"    [WARN] No valid image rows found in {csv_path}, skipping.")
        return counts

    for label, files in sorted(grouped.items(), key=lambda x: x[0].lower()):
        split_map = split_files(files, SPLIT_RATIOS)
        class_name = f"{prefix}_{normalize_class_name(label)}"
        for split, split_files_list in split_map.items():
            dst_dir = out_dir / split / class_name
            dst_dir.mkdir(parents=True, exist_ok=True)
            for img in split_files_list:
                copy_file(img, dst_dir / img.name)
                counts[split] += 1

    return counts


def ingest_flat_classes(
    dataset_dir: pathlib.Path,
    prefix: str,
    out_dir: pathlib.Path,
) -> Dict[str, int]:
    """Dataset has class folders directly (no splits). Auto-split."""
    counts: Dict[str, int] = {s: 0 for s in SPLITS}
    class_dirs = sorted([d for d in dataset_dir.iterdir() if d.is_dir()])
    if not class_dirs:
        print(f"    [WARN] No class sub-folders found in {dataset_dir}, skipping.")
        return counts
    for class_dir in class_dirs:
        normalized = normalize_class_name(class_dir.name)
        if normalized in {"unlabeled", "unlabelled"}:
            continue
        imgs = collect_images(class_dir)
        if not imgs:
            print(f"    [WARN] No images in class folder '{class_dir.name}', skipping.")
            continue
        if len(imgs) < MIN_IMAGES_PER_CLASS:
            print(
                f"    [WARN] Skipping class folder '{class_dir.name}' "
                f"(only {len(imgs)} images)."
            )
            continue
        class_name = f"{prefix}_{normalized}"
        split_map = split_files(imgs, SPLIT_RATIOS)
        for split, files in split_map.items():
            dst_dir = out_dir / split / class_name
            dst_dir.mkdir(parents=True, exist_ok=True)
            for img in files:
                copy_file(img, dst_dir / img.name)
                counts[split] += 1
    return counts


def ingest_dataset(
    dataset_dir: pathlib.Path,
    prefix: str,
    out_dir: pathlib.Path,
) -> bool:
    """Auto-detect structure and delegate to the right ingestion function."""
    if not dataset_dir.exists():
        return False

    print(f"  Ingesting '{dataset_dir.name}' -> prefix='{prefix}' ...")

    if has_split_structure(dataset_dir):
        print("    Detected: pre-split (train/valid/test) structure")
        counts = ingest_with_existing_splits(dataset_dir, prefix, out_dir)
    elif has_csv_label_structure(dataset_dir):
        print("    Detected: CSV-labeled flat image structure (train_data.csv + Train)")
        counts = ingest_csv_labeled_dataset(dataset_dir, prefix, out_dir)
    else:
        print(
            "    Detected: flat class-folder structure -> auto-splitting "
            f"{int(SPLIT_RATIOS[0] * 100)}/{int(SPLIT_RATIOS[1] * 100)}/{int(SPLIT_RATIOS[2] * 100)}"
        )
        counts = ingest_flat_classes(dataset_dir, prefix, out_dir)

    for split, n in counts.items():
        print(f"    {split:6s}: {n} images copied")

    return True


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------


def print_summary(out_dir: pathlib.Path) -> None:
    print("\n" + "=" * 60)
    print("unified_dataset/ summary")
    print("=" * 60)
    grand_total = 0
    for split in SPLITS:
        split_dir = out_dir / split
        if not split_dir.is_dir():
            continue
        class_dirs = sorted(split_dir.iterdir())
        total = 0
        print(f"\n  {split}/")
        for cd in class_dirs:
            n = len(collect_images(cd))
            total += n
            print(f"    {cd.name:<40s} {n:>5} images")
        print(f"    {'TOTAL':<40s} {total:>5} images")
        grand_total += total
    print(f"\n  Grand total: {grand_total} images across all splits")
    print("=" * 60)
    print(f"\nDone! Unified dataset at: {out_dir.resolve()}")
    print("Next step: run  python train_classifier.py")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="Merge animal disease datasets.")
    parser.add_argument(
        "--base_dir",
        type=str,
        default=".",
        help="Folder that contains all 3 dataset directories (default: current dir)",
    )
    parser.add_argument(
        "--out_dir",
        type=str,
        default="unified_dataset",
        help="Output folder name (default: unified_dataset)",
    )
    args = parser.parse_args()

    base = pathlib.Path(args.base_dir).resolve()
    out = pathlib.Path(args.out_dir).resolve()

    print(f"Base directory : {base}")
    print(f"Output directory: {out}\n")

    if out.exists():
        print(f"[INFO] '{out}' already exists. Removing and rebuilding...")
        shutil.rmtree(out)
    out.mkdir(parents=True)

    for prefix, folder_names in DATASETS.items():
        found_any = False
        for folder_name in folder_names:
            dataset_dir = base / folder_name
            if ingest_dataset(dataset_dir, prefix, out):
                found_any = True
                print()
        if not found_any:
            print(f"  [ERROR] No dataset found for prefix '{prefix}'. Checked:")
            for folder_name in folder_names:
                print(f"          - {base / folder_name}")
            print()

    print_summary(out)


if __name__ == "__main__":
    main()
