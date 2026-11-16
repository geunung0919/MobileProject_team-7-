"""Optional AI fallback for receipt items that rules/fuzzy matching cannot settle.

The fallback is disabled by default. Existing OCR, rule classification and fridge flows
must continue working when the API key is absent, the provider is unavailable, or the
model refuses/returns malformed output.
"""
from __future__ import annotations

import json
import os
from typing import Callable

import httpx


DEFAULT_ENDPOINT = "https://api.openai.com/v1/responses"
AUTO_SELECT_CONFIDENCE = 0.92
CANDIDATE_CONFIDENCE = 0.72


def _enabled() -> bool:
    return os.getenv("RECEIPT_AI_FALLBACK", "false").strip().lower() == "true"


def _max_items() -> int:
    try:
        return max(1, min(20, int(os.getenv("RECEIPT_AI_MAX_ITEMS", "12"))))
    except ValueError:
        return 12


def _candidate_items(result: dict) -> list[dict]:
    if not result.get("receipt_document", {}).get("allow_inventory", True):
        return []

    candidates = []
    for index, item in enumerate(result.get("receipt_items") or []):
        raw_name = (item.get("raw_name") or "").strip()
        if not raw_name or raw_name == "상품명 확인 필요":
            continue

        method = item.get("match_method")
        confidence = float(item.get("ingredient_confidence") or 0)
        uncertain = item.get("item_type") == "unknown" or (
            method == "fuzzy" and confidence < 0.82
        )
        if not uncertain:
            continue

        candidates.append({
            "index": index,
            "raw_name": raw_name[:120],
            "product_code": str(item.get("product_code") or "")[:20],
            "current_type": item.get("item_type") or "unknown",
            "current_normalized_name": (item.get("normalized_name") or raw_name)[:120],
            "current_confidence": round(confidence, 3),
        })
        if len(candidates) >= _max_items():
            break
    return candidates


def _response_text(data: dict) -> str | None:
    direct = data.get("output_text")
    if isinstance(direct, str) and direct.strip():
        return direct.strip()

    for output in data.get("output") or []:
        if output.get("type") != "message":
            continue
        for part in output.get("content") or []:
            if part.get("type") == "output_text" and isinstance(part.get("text"), str):
                return part["text"].strip()
    return None


def _openai_classify(items: list[dict]) -> list[dict]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("RECEIPT_AI_MODEL", "gpt-4o-mini").strip()
    endpoint = os.getenv("OPENAI_RESPONSES_URL", DEFAULT_ENDPOINT).strip() or DEFAULT_ENDPOINT
    if not api_key or not model:
        raise RuntimeError("AI fallback is enabled but provider configuration is missing.")

    schema = {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "index": {"type": "integer"},
                        "normalized_name": {"type": "string"},
                        "item_type": {
                            "type": "string",
                            "enum": ["ingredient", "food", "living", "other", "unknown"],
                        },
                        "is_ingredient": {"type": "boolean"},
                        "confidence": {"type": "number"},
                    },
                    "required": [
                        "index",
                        "normalized_name",
                        "item_type",
                        "is_ingredient",
                        "confidence",
                    ],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["items"],
        "additionalProperties": False,
    }

    system = (
        "You classify Korean retail receipt product names for refrigerator inventory. "
        "ingredient = a grocery ingredient a person may store and use for cooking, "
        "including raw produce, meat, seafood, dairy, sauces, seasonings and cooking staples. "
        "food = ready-to-eat meal, snack, dessert, beverage or restaurant/cafe menu that should "
        "not be automatically added as a cooking ingredient. living = non-food household item. "
        "If uncertain, use unknown. Normalize brand-heavy names to a short generic Korean ingredient "
        "name only when supported by the product name. Never infer a product identity from a barcode alone. "
        "Return conservative classifications; false refrigerator additions are worse than unknown."
    )

    payload = {
        "model": model,
        "input": [
            {
                "role": "system",
                "content": [{"type": "input_text", "text": system}],
            },
            {
                "role": "user",
                "content": [{
                    "type": "input_text",
                    "text": json.dumps({"items": items}, ensure_ascii=False),
                }],
            },
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "receipt_ingredient_classification",
                "strict": True,
                "schema": schema,
            }
        },
    }

    timeout = httpx.Timeout(8.0, connect=3.0)
    with httpx.Client(timeout=timeout) as client:
        response = client.post(
            endpoint,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    text = _response_text(data)
    if not text:
        raise RuntimeError("AI fallback returned no structured text.")
    parsed = json.loads(text)
    return parsed.get("items") or []


def apply_ai_receipt_items(
    result: dict,
    classifier: Callable[[list[dict]], list[dict]] | None = None,
) -> dict:
    """Classify only unresolved items and fail open to the existing pipeline."""
    candidates = _candidate_items(result)
    metadata = {
        "enabled": bool(classifier is not None or _enabled()),
        "attempted": False,
        "classified_count": 0,
        "auto_selected_count": 0,
        "status": "disabled",
    }

    if not candidates:
        metadata["status"] = "no_candidates"
        result["ai_fallback"] = metadata
        return result

    if classifier is None:
        if not _enabled():
            result["ai_fallback"] = metadata
            return result
        classifier = _openai_classify

    metadata["attempted"] = True
    metadata["status"] = "failed"
    try:
        classifications = classifier(candidates)
    except Exception:
        # AI must never break receipt preview or saving.
        result["ai_fallback"] = metadata
        return result

    by_index = {}
    valid_indexes = {candidate["index"] for candidate in candidates}
    for classified in classifications:
        try:
            index = int(classified.get("index"))
            confidence = max(0.0, min(1.0, float(classified.get("confidence", 0))))
        except (TypeError, ValueError):
            continue
        if index not in valid_indexes:
            continue

        item_type = classified.get("item_type")
        if item_type not in {"ingredient", "food", "living", "other", "unknown"}:
            continue
        normalized_name = str(classified.get("normalized_name") or "").strip()
        is_ingredient = bool(classified.get("is_ingredient"))
        if item_type != "ingredient":
            is_ingredient = False
        if not normalized_name:
            normalized_name = next(
                candidate["raw_name"] for candidate in candidates if candidate["index"] == index
            )

        by_index[index] = {
            "normalized_name": normalized_name[:120],
            "item_type": item_type,
            "is_ingredient": is_ingredient,
            "ingredient_confidence": round(confidence, 2),
            "match_method": "ai",
        }

    updated = []
    auto_selected = 0
    classified_count = 0
    allow_inventory = bool(result.get("receipt_document", {}).get("allow_inventory", True))
    for index, item in enumerate(result.get("receipt_items") or []):
        classified = by_index.get(index)
        if classified is None:
            updated.append(item)
            continue

        classified_count += 1
        confident_ingredient = (
            classified["is_ingredient"]
            and classified["ingredient_confidence"] >= CANDIDATE_CONFIDENCE
        )
        auto_select = (
            confident_ingredient
            and classified["ingredient_confidence"] >= AUTO_SELECT_CONFIDENCE
            and allow_inventory
            and item.get("row_consistent", True)
        )
        if auto_select:
            auto_selected += 1

        updated.append({
            **item,
            **classified,
            "is_ingredient": confident_ingredient,
            "suggested_for_inventory": auto_select,
        })

    result["receipt_items"] = updated
    metadata.update({
        "classified_count": classified_count,
        "auto_selected_count": auto_selected,
        "status": "applied" if classified_count else "no_valid_output",
    })
    result["ai_fallback"] = metadata

    if classified_count and result.get("candidate", {}).get("category") == "other":
        if any(item.get("is_ingredient") for item in updated):
            result["candidate"]["category"] = "groceries"
    return result
