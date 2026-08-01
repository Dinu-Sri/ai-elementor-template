#!/usr/bin/env python3
import argparse
from pathlib import Path

from PIL import Image


def crop_to_ratio(image, target_ratio):
    width, height = image.size
    current_ratio = width / height
    if current_ratio > target_ratio:
        crop_width = round(height * target_ratio)
        left = (width - crop_width) // 2
        return image.crop((left, 0, left + crop_width, height))
    crop_height = round(width / target_ratio)
    top = (height - crop_height) // 2
    return image.crop((0, top, width, top + crop_height))


def main():
    parser = argparse.ArgumentParser(description="Prepare an AI-assisted SEO image as an exact-ratio WebP.")
    parser.add_argument("source")
    parser.add_argument("destination")
    parser.add_argument("--ratio", choices=("16:9", "4:3"), required=True)
    args = parser.parse_args()

    target_size = (1600, 900) if args.ratio == "16:9" else (1200, 900)
    target_ratio = target_size[0] / target_size[1]
    destination = Path(args.destination)
    destination.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(args.source) as image:
        prepared = crop_to_ratio(image.convert("RGB"), target_ratio)
        prepared.thumbnail(target_size, Image.Resampling.LANCZOS)
        if destination.suffix.lower() == ".png":
            prepared.save(destination, "PNG", optimize=True)
        else:
            prepared.save(destination, "WEBP", quality=88, method=4)

    with Image.open(destination) as result:
        print(f"{destination}\t{result.width}x{result.height}")


if __name__ == "__main__":
    main()
