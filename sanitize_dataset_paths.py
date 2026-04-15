#!/usr/bin/env python3
"""
Sanitize dataset folder/file names to avoid Windows path-length and Git issues.

What it does:
1) Renames top-level datasets:
   - Pig Skin Disease Single Label v4.v24i.folder -> pig
   - PoultryDisease -> poultry
   - cattle -> cattle
2) Recursively shortens folder names and file names.
3) Preserves image extensions.
4) Prevents collisions with deterministic hashing + numeric suffixes.
5) Updates CSV files that use an `images` column (e.g., cattle/train_data.csv).

Usage:
  python sanitize_dataset_paths.py --base-dir "C:/Users/Kirtana Singh/Downloads/KavachPortal/datasets_upload"

Optional:
  --max-dir-len 24
  --max-file-stem-len 24
  --dry-run
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import re
import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import Dict, Iterable, Optional, Set, Tuple

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff", ".tif"}

DATASET_RENAMES: Dict[str, str] = {
    "Pig Skin Disease Single Label v4.v24i.folder": "pig",
    "PoultryDisease": "poultry",
    "cattle": "cattle",
}


def is_image(path: Path) -> bool:
    return path.suffix.lower() in IMAGE_EXTENSIONS


def normalize_token(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9._-]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("._-")
    return text or "item"


def compact_name(name: str, max_len: int) -> str:
    name = normalize_token(name)
    if len(name) <= max_len:
        return name
    digest = hashlib.sha1(name.encode("utf-8")).hexdigest()[:6]
    head_len = max(1, max_len - 7)
    return f"{name[:head_len]}_{digest}"


def unique_name(desired: str, used: Set[str]) -> str:
    if desired not in used:
        return desired
    i = 1
    while True:
        candidate = f"{desired}_{i}"
        if candidate not in used:
            return candidate
        i += 1


def safe_rename(src: Path, dst: Path, dry_run: bool) -> Path:
    if src == dst:
        return dst
    if dry_run:
        print(f"[DRY-RUN] {src} -> {dst}")
        return dst

    try:
        src.rename(dst)
        return dst
    except OSError:
        # Retry via temporary intermediate path for Windows edge cases.
        tmp = src.with_name(f"__tmp__{src.name}")
        i = 1
        while tmp.exists():
            tmp = src.with_name(f"__tmp__{src.name}_{i}")
            i += 1
        src.rename(tmp)
        tmp.rename(dst)
        return dst


def safe_write_csv(path: Path, fieldnames: Iterable[str], rows: list[dict[str, str]], dry_run: bool) -> None:
    if dry_run:
        print(f"[DRY-RUN] update CSV: {path}")
        return

    temp_path = path.with_suffix(path.suffix + ".tmp")
    with temp_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    temp_path.replace(path)


def short_file_name(path: Path, max_stem_len: int) -> str:
    stem = compact_name(path.stem, max_stem_len)
    ext = normalize_token(path.suffix.lower().lstrip("."))
    ext = f".{ext}" if ext else ""
    return f"{stem}{ext}"


def short_dir_name(path: Path, max_dir_len: int) -> str:
    return compact_name(path.name, max_dir_len)


def process_directory_recursive(
    current: Path,
    root: Path,
    max_dir_len: int,
    max_file_stem_len: int,
    dry_run: bool,
    basename_map: Dict[str, Optional[str]],
) -> None:
    # Recurse first, then rename children in current dir (post-order).
    for child_dir in sorted([p for p in current.iterdir() if p.is_dir()], key=lambda p: p.name.lower()):
        process_directory_recursive(
            current=child_dir,
            root=root,
            max_dir_len=max_dir_len,
            max_file_stem_len=max_file_stem_len,
            dry_run=dry_run,
            basename_map=basename_map,
        )

    # Rename files in current directory.
    used = {p.name for p in current.iterdir()}
    files = sorted([p for p in current.iterdir() if p.is_file()], key=lambda p: p.name.lower())
    for f in files:
        desired = short_file_name(f, max_file_stem_len)
        if desired != f.name:
            used.discard(f.name)
            desired = unique_name(desired, used)
            dst = f.with_name(desired)
            safe_rename(f, dst, dry_run=dry_run)
            used.add(desired)

            old_base = f.name
            new_base = desired
            if old_base in basename_map and basename_map[old_base] != new_base:
                basename_map[old_base] = None
            else:
                basename_map[old_base] = new_base

    # Rename immediate subdirectories in current directory.
    used = {p.name for p in current.iterdir()}
    dirs = sorted([p for p in current.iterdir() if p.is_dir()], key=lambda p: p.name.lower())
    for d in dirs:
        desired = short_dir_name(d, max_dir_len)
        if desired != d.name:
            used.discard(d.name)
            desired = unique_name(desired, used)
            dst = d.with_name(desired)
            safe_rename(d, dst, dry_run=dry_run)
            used.add(desired)


def update_csv_image_references(dataset_root: Path, basename_map: Dict[str, Optional[str]], dry_run: bool) -> None:
    csv_files = sorted(dataset_root.rglob("*.csv"))
    for csv_path in csv_files:
        try:
            with csv_path.open("r", encoding="utf-8", newline="") as f:
                reader = csv.DictReader(f)
                if not reader.fieldnames:
                    continue
                fieldnames = list(reader.fieldnames)
                if "images" not in fieldnames:
                    continue

                rows: list[dict[str, str]] = []
                changed = False
                for row in reader:
                    current_value = (row.get("images") or "").strip()
                    if not current_value:
                        rows.append(row)
                        continue

                    ref_path = Path(current_value)
                    old_base = ref_path.name
                    mapped = basename_map.get(old_base)
                    if mapped and mapped != old_base:
                        if ref_path.parent.as_posix() in {"", "."}:
                            row["images"] = mapped
                        else:
                            row["images"] = str(ref_path.parent / mapped).replace("\\", "/")
                        changed = True
                    rows.append(row)

                if changed:
                    safe_write_csv(csv_path, fieldnames, rows, dry_run=dry_run)
                    print(f"[INFO] Updated CSV image references: {csv_path}")
        except Exception as exc:
            print(f"[WARN] Could not process CSV {csv_path}: {exc}")


def resolve_dataset_roots(base_dir: Path, dry_run: bool) -> list[Path]:
    roots: list[Path] = []

    for old_name, new_name in DATASET_RENAMES.items():
        src = base_dir / old_name
        dst = base_dir / new_name

        if src.exists() and src != dst:
            if dst.exists() and dst != src:
                # Keep existing destination; process both to avoid data loss.
                print(f"[WARN] Cannot rename {src} -> {dst} because destination exists. Processing both.")
                roots.append(dst)
                roots.append(src)
            else:
                safe_rename(src, dst, dry_run=dry_run)
                roots.append(dst)
        elif dst.exists():
            roots.append(dst)
        elif src.exists():
            roots.append(src)
        else:
            print(f"[WARN] Dataset folder not found: {src} (or {dst})")

    # Deduplicate while preserving order.
    seen: Set[Path] = set()
    unique_roots: list[Path] = []
    for p in roots:
        if p not in seen and p.exists():
            seen.add(p)
            unique_roots.append(p)
    return unique_roots


def main() -> None:
    parser = argparse.ArgumentParser(description="Shorten dataset paths for Windows + Git compatibility.")
    parser.add_argument("--base-dir", type=str, default=".", help="Folder containing dataset roots.")
    parser.add_argument("--max-dir-len", type=int, default=24, help="Max directory name length.")
    parser.add_argument("--max-file-stem-len", type=int, default=24, help="Max file stem length (without extension).")
    parser.add_argument("--dry-run", action="store_true", help="Print planned renames without applying them.")
    args = parser.parse_args()

    base_dir = Path(args.base_dir).resolve()
    if not base_dir.exists() or not base_dir.is_dir():
        raise SystemExit(f"Base directory does not exist or is not a directory: {base_dir}")

    print(f"[INFO] Base directory: {base_dir}")
    dataset_roots = resolve_dataset_roots(base_dir, dry_run=args.dry_run)
    if not dataset_roots:
        raise SystemExit("No dataset folders found to process.")

    for root in dataset_roots:
        print(f"\n[INFO] Processing dataset: {root}")
        basename_map: Dict[str, Optional[str]] = {}

        try:
            process_directory_recursive(
                current=root,
                root=root,
                max_dir_len=args.max_dir_len,
                max_file_stem_len=args.max_file_stem_len,
                dry_run=args.dry_run,
                basename_map=basename_map,
            )
            update_csv_image_references(root, basename_map, dry_run=args.dry_run)
        except Exception as exc:
            print(f"[WARN] Failed processing {root}: {exc}")

    print("\n[DONE] Dataset path sanitization completed.")


if __name__ == "__main__":
    main()
