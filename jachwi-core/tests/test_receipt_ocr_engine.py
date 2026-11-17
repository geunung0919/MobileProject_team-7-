import os

from app import receipt_ocr


def test_server_ocr_auto_prefers_paddle(monkeypatch):
    monkeypatch.setenv("RECEIPT_SERVER_OCR", "auto")
    monkeypatch.setattr(receipt_ocr, "paddle_available", lambda: True)
    monkeypatch.setattr(
        receipt_ocr,
        "recognize_paddle",
        lambda image: ("마트\n우유 3,200\n합계 3,200", {"engine": "paddleocr"}),
    )
    monkeypatch.setattr(
        receipt_ocr,
        "recognize_tesseract",
        lambda image: (_ for _ in ()).throw(AssertionError("tesseract should not run")),
    )

    text, meta = receipt_ocr.recognize_server(object())
    assert "우유" in text
    assert meta["engine"] == "paddleocr"


def test_server_ocr_auto_falls_back_to_tesseract(monkeypatch):
    monkeypatch.setenv("RECEIPT_SERVER_OCR", "auto")
    monkeypatch.setattr(receipt_ocr, "paddle_available", lambda: True)

    def fail(_image):
        raise RuntimeError("model failed")

    monkeypatch.setattr(receipt_ocr, "recognize_paddle", fail)
    monkeypatch.setattr(
        receipt_ocr,
        "recognize_tesseract",
        lambda image: (
            "마트\n두부 1,800\n합계 1,800",
            {"variant": "contrast", "psm": "6", "quality_score": 10},
        ),
    )

    text, meta = receipt_ocr.recognize_server(object())
    assert "두부" in text
    assert meta["engine"] == "tesseract-ensemble"
    assert meta["fallback_from"] == "paddleocr"


def test_server_ocr_compare_selects_higher_parser_score(monkeypatch):
    monkeypatch.setenv("RECEIPT_SERVER_OCR", "compare")
    monkeypatch.setattr(receipt_ocr, "paddle_available", lambda: True)
    monkeypatch.setattr(
        receipt_ocr,
        "recognize_paddle",
        lambda image: (
            "이마트\n우유 3,200 1 3,200\n계란 6,900 1 6,900\n합계 10,100",
            {"engine": "paddleocr"},
        ),
    )
    monkeypatch.setattr(
        receipt_ocr,
        "recognize_tesseract",
        lambda image: (
            "이마트\n합계 10,100",
            {"variant": "contrast", "psm": "6", "quality_score": 1},
        ),
    )

    text, meta = receipt_ocr.recognize_server(object())
    assert "계란" in text
    assert meta["engine"] == "paddleocr"
    assert meta["compared_with"] == "tesseract-ensemble"
