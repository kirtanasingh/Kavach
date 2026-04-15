import asyncio
from pathlib import Path

from dotenv import load_dotenv

from app.services.analysis_service import _groq_explain

load_dotenv()


async def main() -> None:
    image_path = Path("test_image.jpg")
    if not image_path.exists():
        raise SystemExit("Place a test image at kavach_backend/test_image.jpg before running this script.")

    with image_path.open("rb") as f:
        img_bytes = f.read()

    fake_ml = {
        "top_prediction": {"label": "poultry_newcastle_disease", "confidence": 0.82},
        "top_3": [
            {"label": "poultry_newcastle_disease", "confidence": 0.82},
            {"label": "poultry_healthy", "confidence": 0.12},
            {"label": "poultry_fowl_pox", "confidence": 0.06},
        ],
    }

    print("Calling Groq...")
    result = await _groq_explain(img_bytes, fake_ml)
    print("Response:")
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
