#!/usr/bin/env python3
"""Evaluate text-level receipt parsing/classification regression cases.

This intentionally measures parser/document/ingredient behavior after OCR text exists.
It does NOT report camera OCR accuracy. Image-level OCR needs a separate photo corpus.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.receipt_items import classify_receipt_document, extract_receipt_items
DATASET = ROOT / "data" / "receipt_pipeline_eval.json"


def safe_div(numerator, denominator):
    return numerator / denominator if denominator else 0.0


def main():
    data = json.loads(DATASET.read_text(encoding="utf-8"))
    doc_correct = 0
    item_expected_total = 0
    item_extracted_total = 0
    tp = fp = fn = 0
    unknown_expected = unknown_found = 0
    case_rows = []

    for case in data["cases"]:
        document = classify_receipt_document(case["text"])
        items = extract_receipt_items(case["text"])
        doc_ok = document["document_type"] == case["document_type"]
        doc_correct += int(doc_ok)

        expected_ingredients = set(case.get("expected_ingredients") or [])
        predicted_ingredients = {
            item["normalized_name"]
            for item in items
            if item.get("is_ingredient")
        }
        tp_case = len(expected_ingredients & predicted_ingredients)
        fp_case = len(predicted_ingredients - expected_ingredients)
        fn_case = len(expected_ingredients - predicted_ingredients)
        tp += tp_case
        fp += fp_case
        fn += fn_case

        expected_count = int(case.get("expected_item_count", 0))
        item_expected_total += expected_count
        item_extracted_total += min(len(items), expected_count)

        expected_barcodes = set(case.get("expected_unknown_barcodes") or [])
        found_barcodes = {
            item.get("product_code")
            for item in items
            if item.get("raw_name") == "상품명 확인 필요"
        }
        unknown_expected += len(expected_barcodes)
        unknown_found += len(expected_barcodes & found_barcodes)

        case_rows.append({
            "id": case["id"],
            "document_ok": doc_ok,
            "expected_document": case["document_type"],
            "actual_document": document["document_type"],
            "expected_items": expected_count,
            "actual_items": len(items),
            "ingredient_tp": tp_case,
            "ingredient_fp": fp_case,
            "ingredient_fn": fn_case,
            "predicted_ingredients": sorted(predicted_ingredients),
        })

    precision = safe_div(tp, tp + fp)
    recall = safe_div(tp, tp + fn)
    f1 = safe_div(2 * precision * recall, precision + recall)

    summary = {
        "dataset_cases": len(data["cases"]),
        "document_type_accuracy": round(safe_div(doc_correct, len(data["cases"])), 4),
        "item_extraction_recall_proxy": round(safe_div(item_extracted_total, item_expected_total), 4),
        "ingredient_precision": round(precision, 4),
        "ingredient_recall": round(recall, 4),
        "ingredient_f1": round(f1, 4),
        "unknown_barcode_preservation": round(safe_div(unknown_found, unknown_expected), 4)
        if unknown_expected else None,
        "ingredient_counts": {"tp": tp, "fp": fp, "fn": fn},
        "cases": case_rows,
        "note": "Text-level regression only; does not measure image OCR accuracy.",
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
