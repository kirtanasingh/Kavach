# KavachPortal ML Integration Guide

## 1) Where to place each file

- Place [merge_datasets.py](../merge_datasets.py) in your Downloads root:
  - `C:/Users/Kirtana Singh/Downloads/merge_datasets.py`
- Place [train_classifier.py](train_classifier.py) in backend root:
  - `C:/Users/Kirtana Singh/Downloads/KavachPortal/kavach_backend/train_classifier.py`
- Place [ml_classify.py](app/api/v1/endpoints/ml_classify.py) in:
  - `C:/Users/Kirtana Singh/Downloads/KavachPortal/kavach_backend/app/api/v1/endpoints/ml_classify.py`
- Place [analysis_service.py](app/services/analysis_service.py) in:
  - `C:/Users/Kirtana Singh/Downloads/KavachPortal/kavach_backend/app/services/analysis_service.py`

## 2) Where to upload all datasets (exact folder structure)

Create this under `C:/Users/Kirtana Singh/Downloads/KavachPortal`:

```text
C:/Users/Kirtana Singh/Downloads/KavachPortal/
  datasets_upload/
    pig/
      Pig Skin Disease Single Label v4.v24i.folder/
    poultry/
      PoultryDisease/
        poultry_diseases/
    cattle/
      cattle/
        Train/
        train_data.csv
```

Important notes:
- Your merge script supports both styles:
  - Pre-split style: `train/valid/test/<class_name>/*.jpg`
  - Flat style: `<class_name>/*.jpg`
- Keep these top-level dataset folder names exactly as above, or update `DATASETS` in [merge_datasets.py](../merge_datasets.py).

## 3) Run commands (Windows PowerShell)

### Install dependencies

```powershell
cd "C:/Users/Kirtana Singh/Downloads/KavachPortal/kavach_backend"
pip install -r requirements.txt
```

### Merge datasets into one unified dataset

```powershell
cd "C:/Users/Kirtana Singh/Downloads/KavachPortal"
python merge_datasets.py --base_dir "C:/Users/Kirtana Singh/Downloads/KavachPortal"
```

Output dataset created at:

```text
C:/Users/Kirtana Singh/Downloads/KavachPortal/unified_dataset/
  train/
  valid/
  test/
```

### Train classifier

```powershell
cd "C:/Users/Kirtana Singh/Downloads/KavachPortal/kavach_backend"
python train_classifier.py `
  --dataset_dir "C:/Users/Kirtana Singh/Downloads/KavachPortal/unified_dataset" `
  --output_dir  "C:/Users/Kirtana Singh/Downloads/KavachPortal/kavach_backend/ml_models" `
  --epochs 15
```

Expected outputs:

```text
kavach_backend/ml_models/model.pt
kavach_backend/ml_models/labels.json
kavach_backend/ml_models/training_report.json
```

### Start API server

```powershell
cd "C:/Users/Kirtana Singh/Downloads/KavachPortal/kavach_backend"
uvicorn main:app --reload --port 8000
```

### Test ML classification endpoint

```powershell
curl.exe -X POST "http://localhost:8000/api/v1/ml/classify" -F "file=@C:/path/to/test_image.jpg"
```

## 4) API endpoints added

- `POST /api/v1/ml/classify`
- `GET /api/v1/ml/labels`
- `GET /api/v1/ml/health`

Your existing endpoints still work:
- `POST /api/v1/scan/analyze`
- `POST /api/v1/detect`

## 5) Troubleshooting

- If `model.pt` missing:
  - Run training first.
- If `/api/v1/ml/classify` returns 503:
  - Check `kavach_backend/ml_models/model.pt` and `labels.json` exist.
- If CUDA memory error:
  - Lower `--batch_size` to `16` or `8`.
- If DataLoader crashes on Windows:
  - Run training with `--workers 0`.
