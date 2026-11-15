#!/usr/bin/env python3
"""Benchmark Korean receipt OCR engines on a labeled image set such as KORIE.

The dataset itself is intentionally not vendored into this repository. Point this tool
at a local KORIE OCR test split or another labeled crop set.

Manifest CSV example:
image,text
/path/to/0001.png,서울우유
/path/to/0002.png,"3,200"

Or use --images-dir and --labels-dir when each image has a same-stem .txt label.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
from pathlib import Path
import sys
import time
import unicodedata

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.receipt_ocr import recognize_server, recognize_tesseract
from app.receipt_paddle import paddle_available, recognize_paddle


IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", value or "")
    return " ".join(value.split())


def levenshtein(a, b):
    if len(a) < len(b):
        a, b = b, a
    previous = list(range(len(b) + 1))
    for i, left in enumerate(a, 1):
        current = [i]
        for j, right in enumerate(b, 1):
            current.append(min(
                current[-1] + 1,
                previous[j] + 1,
                previous[j - 1] + (left != right),
            ))
        previous = current
    return previous[-1]


def prepare_image(path: Path):
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        image.thumbnail((2600, 3600))
        prepared = ImageOps.grayscale(image)
    if prepared.width < 1600:
        scale = min(2.5, 1600 / max(prepared.width, 1))
        prepared = prepared.resize(
            (
                max(1, round(prepared.width * scale)),
                max(1, round(prepared.height * scale)),
            ),
            Image.Resampling.LANCZOS,
        )
    prepared = ImageOps.autocontrast(prepared, cutoff=1)
    return prepared.filter(ImageFilter.SHARPEN)


def load_manifest(path: Path, image_column: str, text_column: str):
    if path.suffix.casefold() == ".json":
        data = json.loads(path.read_text(encoding="utf-8-sig"))
        if isinstance(data, dict):
            data = data.get("items") or data.get("rows") or data.get("data") or []
        rows = data
    else:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))

    base = path.parent
    samples = []
    for row in rows:
        image_value = row.get(image_column)
        truth = row.get(text_column)
        if not image_value or truth is None:
            continue
        image_path = Path(image_value)
        if not image_path.is_absolute():
            image_path = base / image_path
        samples.append((image_path, str(truth)))
    return samples


def load_same_stem(images_dir: Path, labels_dir: Path):
    samples = []
    for image_path in sorted(images_dir.rglob("*")):
        if image_path.suffix.casefold() not in IMAGE_SUFFIXES:
            continue
        relative = image_path.relative_to(images_dir)
        label_path = (labels_dir / relative).with_suffix(".txt")
        if not label_path.exists():
            continue
        samples.append((
            image_path,
            label_path.read_text(encoding="utf-8-sig").strip(),
        ))
    return samples


def run_engine(engine: str, image):
    if engine == "paddle":
        if not paddle_available():
            raise RuntimeError(
                "PaddleOCR가 설치되어 있지 않습니다. requirements-ocr-paddle.txt를 확인하세요."
            )
        return recognize_paddle(image)
    if engine == "tesseract":
        return recognize_tesseract(image)
    if engine == "server":
        return recognize_server(image)
    raise ValueError(engine)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", choices=("paddle", "tesseract", "server"), required=True)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--image-column", default="image")
    parser.add_argument("--text-column", default="text")
    parser.add_argument("--images-dir", type=Path)
    parser.add_argument("--labels-dir", type=Path)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    if args.manifest:
        samples = load_manifest(args.manifest, args.image_column, args.text_column)
    elif args.images_dir and args.labels_dir:
        samples = load_same_stem(args.images_dir, args.labels_dir)
    else:
        raise SystemExit(
            "--manifest 또는 --images-dir + --labels-dir 중 하나가 필요합니다."
        )

    if args.limit > 0:
        samples = samples[:args.limit]
    if not samples:
        raise SystemExit("평가할 이미지/정답 쌍을 찾지 못했습니다.")

    char_edits = char_total = 0
    word_edits = word_total = 0
    failures = 0
    elapsed_total = 0.0
    rows = []

    for image_path, truth_raw in samples:
        truth = normalize_text(truth_raw)
        image = prepare_image(image_path)
        started = time.perf_counter()
        error = None
        try:
            prediction, meta = run_engine(args.engine, image)
            prediction = normalize_text(prediction)
        except Exception as exc:
            prediction = ""
            meta = {}
            error = str(exc)
            failures += 1
        finally:
            image.close()

        elapsed = time.perf_counter() - started
        elapsed_total += elapsed

        c_edits = levenshtein(list(prediction), list(truth))
        truth_words = truth.split()
        pred_words = prediction.split()
        w_edits = levenshtein(pred_words, truth_words)
        char_edits += c_edits
        char_total += len(truth)
        word_edits += w_edits
        word_total += len(truth_words)

        rows.append({
            "image": str(image_path),
            "truth": truth,
            "prediction": prediction,
            "char_edits": c_edits,
            "word_edits": w_edits,
            "seconds": round(elapsed, 4),
            "error": error,
            "meta": meta,
        })

    summary = {
        "engine": args.engine,
        "samples": len(samples),
        "failures": failures,
        "cer": round(char_edits / char_total, 6) if char_total else None,
        "wer": round(word_edits / word_total, 6) if word_total else None,
        "average_seconds": round(elapsed_total / len(samples), 4),
        "char_edits": char_edits,
        "char_total": char_total,
        "word_edits": word_edits,
        "word_total": word_total,
        "receipt_server_mode": os.getenv("RECEIPT_SERVER_OCR", "auto")
        if args.engine == "server" else None,
        "rows": rows,
    }

    rendered = json.dumps(summary, ensure_ascii=False, indent=2)
    print(rendered)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")


if __name__ == "__main__":
    main()
