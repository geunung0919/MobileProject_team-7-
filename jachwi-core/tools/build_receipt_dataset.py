#!/usr/bin/env python3
"""Build a larger local receipt catalog from official/public dataset exports.

Examples:
  # Seed only (validates/normalizes the shipped dataset)
  python tools/build_receipt_dataset.py

  # Expand canonical ingredient vocabulary directly from MFDS raw-material OpenAPI
  DATA_GO_KR_SERVICE_KEY=... python tools/build_receipt_dataset.py --fetch-mfds-ingredients

  # Merge a downloaded nutrition standard CSV/JSON
  python tools/build_receipt_dataset.py --nutrition-file ./downloads/nutrition.csv

  # Optional legacy barcode export. Treat as supplemental because the historical
  # MFDS barcode-linked dataset is not a reliable source for current products.
  python tools/build_receipt_dataset.py --barcode-file ./downloads/barcodes.json
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
SEED_PATH = DATA_DIR / "receipt_ingredient_seed.json"
OUTPUT_PATH = DATA_DIR / "receipt_ingredient_catalog.json"
MFDS_RAW_URL = (
    "https://apis.data.go.kr/1471000/"
    "FoodRwmatrInfoService01/getFoodRwmatrList01"
)


def compact(value: str) -> str:
    return re.sub(r"[^0-9a-z가-힣]+", "", str(value or "").casefold())


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def rows_from_json(data):
    """Find list-of-dict rows across common data.go.kr/MFDS response envelopes."""
    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]
    if not isinstance(data, dict):
        return []

    for key in ("items", "item", "row", "rows", "data"):
        value = data.get(key)
        if isinstance(value, list):
            return [row for row in value if isinstance(row, dict)]
        if isinstance(value, dict):
            nested = rows_from_json(value)
            if nested:
                return nested

    for value in data.values():
        nested = rows_from_json(value)
        if nested:
            return nested
    return []


def load_rows(path: Path):
    suffix = path.suffix.casefold()
    if suffix in {".json", ".js"}:
        return rows_from_json(load_json(path))
    if suffix in {".csv", ".txt"}:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            return list(csv.DictReader(handle))
    raise ValueError(f"지원하지 않는 데이터 파일 형식: {path}")


def ingredient_map(seed: dict):
    result = {}
    for row in seed.get("ingredients") or []:
        standard = str(row.get("standard_name") or "").strip()
        if not standard:
            continue
        aliases = result.setdefault(standard, set())
        aliases.add(standard)
        aliases.update(
            str(alias).strip()
            for alias in row.get("aliases") or []
            if str(alias).strip()
        )
    return result


def add_ingredient(target, standard, aliases=()):
    standard = str(standard or "").strip()
    if not standard:
        return
    bucket = target.setdefault(standard, set())
    bucket.add(standard)
    for alias in aliases:
        alias = str(alias or "").strip()
        if alias:
            bucket.add(alias)


def merge_mfds_raw_rows(target, rows):
    added = 0
    for row in rows:
        # Official response names are uppercase, but accept Korean/export variants too.
        large_class = str(
            row.get("LCLAS_NM")
            or row.get("대분류")
            or ""
        ).strip()
        middle_class = str(
            row.get("MLSFC_NM")
            or row.get("중분류")
            or ""
        ).strip()
        standard = (
            row.get("RPRSNT_RAWMTRL_NM")
            or row.get("rprsnt_rawmtrl_nm")
            or row.get("원재료명")
        )
        nickname = (
            row.get("RAWMTRL_NCKNM")
            or row.get("rawmtrl_ncknm")
            or row.get("이명")
            or ""
        )

        # Exclude additives/container material/functional-material namespaces.
        if large_class and "식품원료" not in large_class:
            continue
        if middle_class and middle_class in {
            "화학적합성품",
            "식품첨가물혼합제제",
            "살균소독제혼합제제",
        }:
            continue

        before = len(target)
        aliases = re.split(r"[,;/]|\s{2,}", str(nickname))
        add_ingredient(target, standard, aliases)
        if len(target) > before:
            added += 1
    return added


def _first(row, names):
    for name in names:
        value = row.get(name)
        if value not in (None, ""):
            return value
    return None


def merge_nutrition_rows(catalog, rows):
    """Use official nutrition exports as product-name evidence.

    원재료성식품 -> ingredient candidate.
    가공식품/음식 -> prepared food (negative evidence for fridge auto-add).
    """
    mapped = 0
    product_map = catalog.setdefault("product_name_map", {})
    ingredients = ingredient_map(catalog)

    for row in rows:
        name = _first(row, ("식품명", "FOOD_NM", "food_name", "PRDLST_NM"))
        data_type = str(
            _first(row, ("데이터구분명", "DATA_DIV_NM", "data_type", "식품분류"))
            or ""
        )
        if not name:
            continue

        key = compact(name)
        if not key:
            continue

        if "원재료" in data_type:
            # Keep the official food name as a canonical ingredient entry.
            add_ingredient(ingredients, str(name).strip())
            product_map[key] = {
                "raw_name": str(name).strip(),
                "normalized_name": str(name).strip(),
                "item_type": "ingredient",
                "source": "mfds_nutrition",
            }
            mapped += 1
        elif any(token in data_type for token in ("가공식품", "음식")):
            product_map[key] = {
                "raw_name": str(name).strip(),
                "normalized_name": str(name).strip(),
                "item_type": "food",
                "source": "mfds_nutrition",
            }
            mapped += 1

    catalog["ingredients"] = [
        {"standard_name": standard, "aliases": sorted(aliases)}
        for standard, aliases in sorted(ingredients.items())
    ]
    return mapped


def merge_legacy_barcode_rows(catalog, rows):
    """Supplement barcode lookup only; never make it the primary current-product DB."""
    barcode_map = catalog.setdefault("barcode_products", {})
    added = 0

    for row in rows:
        code = _first(row, ("BAR_CD", "BRCDNO", "바코드", "유통바코드", "바코드번호"))
        name = _first(row, ("PRDLST_NM", "PRDTNM", "제품명", "품목명"))
        food_type = str(_first(row, ("PRDLST_DCNM", "PRDLST_CD_NM", "식품유형", "유형")) or "")
        code = re.sub(r"\D", "", str(code or ""))
        if len(code) < 8 or not name:
            continue

        barcode_map[code] = {
            "raw_name": str(name).strip(),
            "normalized_name": str(name).strip(),
            # Product-level barcode data is safer as food/unknown than raw ingredient
            # unless another dataset/user confirmation establishes ingredient status.
            "item_type": "food" if food_type else "unknown",
            "source": "mfds_legacy_barcode",
            "food_type": food_type[:120],
        }
        added += 1
    return added


def fetch_mfds_ingredients(service_key: str, per_page=100):
    page = 1
    rows = []
    while True:
        query = urllib.parse.urlencode({
            "serviceKey": service_key,
            "pageNo": page,
            "numOfRows": per_page,
            "type": "json",
        })
        request = urllib.request.Request(
            f"{MFDS_RAW_URL}?{query}",
            headers={"Accept": "application/json", "User-Agent": "jachwi-receipt-dataset/1.0"},
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))

        batch = rows_from_json(payload)
        if not batch:
            break
        rows.extend(batch)

        # Find total count if present; otherwise stop on short page.
        serialized = json.dumps(payload, ensure_ascii=False)
        match = re.search(r'"totalCount"\s*:\s*"?([0-9]+)', serialized)
        total = int(match.group(1)) if match else None
        if (total is not None and len(rows) >= total) or len(batch) < per_page:
            break
        page += 1
        if page > 5000:
            raise RuntimeError("MFDS pagination safety limit exceeded.")
    return rows


def normalize_catalog(catalog, ingredient_rows):
    catalog["ingredients"] = [
        {
            "standard_name": standard,
            "aliases": sorted(set(aliases), key=lambda value: (len(value), value)),
        }
        for standard, aliases in sorted(ingredient_rows.items())
    ]
    catalog["processed_food_terms"] = sorted(set(catalog.get("processed_food_terms") or []))
    catalog["living_terms"] = sorted(set(catalog.get("living_terms") or []))
    catalog.setdefault("barcode_products", {})
    catalog.setdefault("product_name_map", {})
    return catalog


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--fetch-mfds-ingredients", action="store_true")
    parser.add_argument("--mfds-raw-file", type=Path)
    parser.add_argument("--nutrition-file", type=Path)
    parser.add_argument("--barcode-file", type=Path)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()

    catalog = load_json(SEED_PATH)
    catalog["metadata"] = {
        "generated": True,
        "builder": "tools/build_receipt_dataset.py",
        "sources": ["project_seed"],
        "warnings": [],
    }
    ingredients = ingredient_map(catalog)

    if args.fetch_mfds_ingredients:
        key = os.getenv("DATA_GO_KR_SERVICE_KEY", "").strip()
        if not key:
            raise SystemExit("DATA_GO_KR_SERVICE_KEY가 필요합니다.")
        rows = fetch_mfds_ingredients(key)
        count = merge_mfds_raw_rows(ingredients, rows)
        catalog["metadata"]["sources"].append("mfds_raw_material_openapi")
        catalog["metadata"]["mfds_raw_rows"] = len(rows)
        catalog["metadata"]["mfds_raw_added_groups"] = count

    if args.mfds_raw_file:
        rows = load_rows(args.mfds_raw_file)
        count = merge_mfds_raw_rows(ingredients, rows)
        catalog["metadata"]["sources"].append(f"mfds_raw_file:{args.mfds_raw_file.name}")
        catalog["metadata"]["mfds_raw_file_rows"] = len(rows)
        catalog["metadata"]["mfds_raw_file_added_groups"] = count

    catalog = normalize_catalog(catalog, ingredients)

    if args.nutrition_file:
        rows = load_rows(args.nutrition_file)
        count = merge_nutrition_rows(catalog, rows)
        catalog["metadata"]["sources"].append(f"nutrition:{args.nutrition_file.name}")
        catalog["metadata"]["nutrition_rows"] = len(rows)
        catalog["metadata"]["nutrition_mapped"] = count

    if args.barcode_file:
        rows = load_rows(args.barcode_file)
        count = merge_legacy_barcode_rows(catalog, rows)
        catalog["metadata"]["sources"].append(f"legacy_barcode:{args.barcode_file.name}")
        catalog["metadata"]["legacy_barcode_rows"] = len(rows)
        catalog["metadata"]["legacy_barcode_mapped"] = count
        catalog["metadata"]["warnings"].append(
            "Legacy barcode data is supplemental and may not represent current products."
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(json.dumps({
        "output": str(args.output),
        "ingredient_groups": len(catalog.get("ingredients") or []),
        "ingredient_aliases": sum(
            len(row.get("aliases") or [])
            for row in catalog.get("ingredients") or []
        ),
        "product_name_map": len(catalog.get("product_name_map") or {}),
        "barcode_products": len(catalog.get("barcode_products") or {}),
        "sources": catalog["metadata"]["sources"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
