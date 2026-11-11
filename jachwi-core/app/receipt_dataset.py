"""Local receipt classification datasets.

The app ships with a compact seed so it works offline. Larger official MFDS exports can
be merged into a generated catalog with tools/build_receipt_dataset.py without changing
the runtime classifier.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DEFAULT_CATALOG = DATA_DIR / "receipt_ingredient_seed.json"
GENERATED_CATALOG = DATA_DIR / "receipt_ingredient_catalog.json"


@lru_cache(maxsize=1)
def load_receipt_dataset() -> dict:
    path = GENERATED_CATALOG if GENERATED_CATALOG.exists() else DEFAULT_CATALOG
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {
            "ingredients": [],
            "processed_food_terms": [],
            "living_terms": [],
            "barcode_products": {},
            "product_name_map": {},
            "metadata": {"loaded": False},
        }

    ingredients = []
    for row in data.get("ingredients") or []:
        standard = str(row.get("standard_name") or "").strip()
        aliases = [
            str(alias).strip()
            for alias in row.get("aliases") or []
            if str(alias).strip()
        ]
        if standard:
            ingredients.append({
                "standard_name": standard,
                "aliases": list(dict.fromkeys([standard, *aliases])),
            })

    return {
        "ingredients": ingredients,
        "processed_food_terms": [
            str(term).strip()
            for term in data.get("processed_food_terms") or []
            if str(term).strip()
        ],
        "living_terms": [
            str(term).strip()
            for term in data.get("living_terms") or []
            if str(term).strip()
        ],
        "barcode_products": {
            str(key): value
            for key, value in (data.get("barcode_products") or {}).items()
            if str(key).strip()
        },
        "product_name_map": {
            str(key): value
            for key, value in (data.get("product_name_map") or {}).items()
            if str(key).strip()
        },
        "metadata": {
            "loaded": True,
            "path": str(path),
            **(data.get("metadata") or {}),
        },
    }


def receipt_dataset_summary() -> dict:
    data = load_receipt_dataset()
    return {
        "loaded": data["metadata"].get("loaded", False),
        "ingredient_groups": len(data["ingredients"]),
        "ingredient_aliases": sum(len(row["aliases"]) for row in data["ingredients"]),
        "processed_food_terms": len(data["processed_food_terms"]),
        "living_terms": len(data["living_terms"]),
        "barcode_products": len(data["barcode_products"]),
        "product_name_map": len(data["product_name_map"]),
        "source_path": data["metadata"].get("path"),
    }
