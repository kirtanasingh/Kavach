from io import BytesIO
from pathlib import Path
from typing import Union

from PIL import Image, ImageStat


class ImageService:
    @staticmethod
    def preprocess_image(image_input: Union[bytes, str]) -> Union[bytes, str]:
        """
        Preprocess image bytes or image file path.
        - bytes input: returns processed bytes (compat mode)
        - path input: returns processed file path
        """
        if isinstance(image_input, bytes):
            return image_input

        source_path = Path(image_input)
        processed_path = source_path.with_name(f"{source_path.stem}_processed.jpg")

        with Image.open(source_path) as img:
            img = img.convert("RGB")
            img.save(processed_path, format="JPEG", quality=92, optimize=True)

        return str(processed_path)

    @staticmethod
    def extract_visual_features(image_bytes: bytes) -> dict:
        """
        Extract simple visual cues from an uploaded image.

        This is not a medical classifier; it provides measurable image signals
        that help the LLM produce less repetitive and more image-conditioned output.
        """
        try:
            with Image.open(BytesIO(image_bytes)) as img:
                rgb_img = img.convert("RGB")
                width, height = rgb_img.size
                stat = ImageStat.Stat(rgb_img)
                mean_r, mean_g, mean_b = stat.mean

                # Downsample for quick pixel-level feature calculations.
                sample = rgb_img.resize((224, 224))
                pixels = list(sample.getdata())
                total = max(len(pixels), 1)

                red_lesion_like = 0
                dark_spot_like = 0
                yellow_tint_like = 0
                for r, g, b in pixels:
                    if r > g * 1.18 and r > b * 1.18 and r > 80:
                        red_lesion_like += 1
                    if max(r, g, b) < 55:
                        dark_spot_like += 1
                    if r > 120 and g > 100 and b < 95:
                        yellow_tint_like += 1

                red_ratio = red_lesion_like / total
                dark_ratio = dark_spot_like / total
                yellow_ratio = yellow_tint_like / total

                brightness = (mean_r + mean_g + mean_b) / 3.0
                contrast = sum(stat.stddev) / 3.0

                return {
                    "width": width,
                    "height": height,
                    "mean_rgb": [round(mean_r, 2), round(mean_g, 2), round(mean_b, 2)],
                    "brightness": round(brightness, 2),
                    "contrast": round(contrast, 2),
                    "red_lesion_ratio": round(red_ratio, 4),
                    "dark_spot_ratio": round(dark_ratio, 4),
                    "yellow_tint_ratio": round(yellow_ratio, 4),
                }
        except Exception:
            return {
                "width": 0,
                "height": 0,
                "mean_rgb": [0.0, 0.0, 0.0],
                "brightness": 0.0,
                "contrast": 0.0,
                "red_lesion_ratio": 0.0,
                "dark_spot_ratio": 0.0,
                "yellow_tint_ratio": 0.0,
            }

image_service = ImageService()
