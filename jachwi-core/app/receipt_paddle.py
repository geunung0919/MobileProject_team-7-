"""Optional PaddleOCR server engine for Korean receipts.

This module is intentionally isolated from base requirements. The app can run without
PaddleOCR; receipt_ocr.py falls back to the existing Tesseract ensemble when the
optional dependency/model is unavailable.
"""
from __future__ import annotations

import importlib.util
import os
from pathlib import Path
import tempfile
import threading


_ENGINE = None
_ENGINE_LOCK = threading.Lock()


def paddle_available() -> bool:
    return importlib.util.find_spec("paddleocr") is not None


def _truthy(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _get_engine():
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE
    if not paddle_available():
        raise RuntimeError("PaddleOCR is not installed.")

    with _ENGINE_LOCK:
        if _ENGINE is not None:
            return _ENGINE
        from paddleocr import PaddleOCR

        _ENGINE = PaddleOCR(
            lang=os.getenv("PADDLE_OCR_LANG", "korean"),
            ocr_version=os.getenv("PADDLE_OCR_VERSION", "PP-OCRv5"),
            use_doc_orientation_classify=_truthy("PADDLE_OCR_ORIENTATION", True),
            use_doc_unwarping=_truthy("PADDLE_OCR_UNWARP", True),
            use_textline_orientation=_truthy("PADDLE_OCR_TEXTLINE_ORIENTATION", True),
        )
        return _ENGINE


def _result_payload(result):
    payload = getattr(result, "json", None)
    if callable(payload):
        payload = payload()
    if isinstance(payload, dict):
        # PaddleOCR result JSON may wrap the fields under "res".
        if isinstance(payload.get("res"), dict):
            return payload["res"]
        return payload
    if isinstance(result, dict):
        return result.get("res") if isinstance(result.get("res"), dict) else result
    return {}


def recognize_paddle(image):
    """Return (text, metadata) using PaddleOCR 3.x Korean OCR pipeline."""
    engine = _get_engine()
    min_score = float(os.getenv("PADDLE_OCR_MIN_SCORE", "0.35"))

    with tempfile.TemporaryDirectory(prefix="receipt-paddle-") as directory:
        path = Path(directory) / "receipt.png"
        image.convert("RGB").save(path, format="PNG")
        results = list(engine.predict(str(path)))

    lines = []
    confidences = []
    for result in results:
        payload = _result_payload(result)
        texts = payload.get("rec_texts") or []
        scores = payload.get("rec_scores") or []
        for index, text in enumerate(texts):
            value = str(text or "").strip()
            if not value:
                continue
            try:
                score = float(scores[index]) if index < len(scores) else 1.0
            except (TypeError, ValueError):
                score = 0.0
            if score < min_score:
                continue
            lines.append(value)
            confidences.append(score)

    text = "\n".join(lines).strip()
    if len(text) < 3:
        raise RuntimeError("PaddleOCR returned insufficient receipt text.")

    avg_confidence = (
        sum(confidences) / len(confidences)
        if confidences
        else 0.0
    )
    return text, {
        "engine": "paddleocr",
        "ocr_version": os.getenv("PADDLE_OCR_VERSION", "PP-OCRv5"),
        "language": os.getenv("PADDLE_OCR_LANG", "korean"),
        "line_count": len(lines),
        "average_recognition_confidence": round(avg_confidence, 4),
    }
