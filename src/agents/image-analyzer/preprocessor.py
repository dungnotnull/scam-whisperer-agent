import sys
import json
import base64
import io
from pathlib import Path

try:
    from PIL import Image, ImageEnhance
    import numpy as np
except ImportError:
    print(json.dumps({"error": "Missing dependencies. Run: pip install Pillow numpy"}))
    sys.exit(1)


def detect_photo_of_screen(img: Image.Image) -> bool:
    arr = np.array(img.convert("L"))
    h, w = arr.shape
    edge_strength = np.abs(np.diff(arr.astype(np.int16), axis=1)).mean() + np.abs(
        np.diff(arr.astype(np.int16), axis=0)
    ).mean()
    aspect = w / h
    typical_phone_aspects = [9 / 16, 9 / 19.5, 9 / 20]
    aspect_match = any(abs(aspect - a) < 0.15 for a in typical_phone_aspects)
    is_native = aspect_match and edge_strength < 40
    return not is_native


def preprocess(image_bytes: bytes, max_width: int = 1080, max_height: int = 1920) -> bytes:
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    img.thumbnail((max_width, max_height), Image.LANCZOS)
    is_photo = detect_photo_of_screen(img)
    if is_photo:
        img = ImageEnhance.Contrast(img).enhance(1.5)
        img = ImageEnhance.Sharpness(img).enhance(1.3)
    output = io.BytesIO()
    img.save(output, format="JPEG", quality=90)
    result = output.getvalue()
    return result, is_photo, img.size


def main():
    try:
        payload = json.loads(sys.stdin.read())
        image_b64 = payload.get("image_base64", "")
        if not image_b64:
            print(json.dumps({"error": "image_base64 is required"}))
            sys.exit(1)
        raw = base64.b64decode(image_b64)
        processed, is_photo, size = preprocess(raw)
        print(
            json.dumps(
                {
                    "image_base64": base64.b64encode(processed).decode(),
                    "is_photo_of_screen": is_photo,
                    "dimensions": {"width": size[0], "height": size[1]},
                }
            )
        )
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
