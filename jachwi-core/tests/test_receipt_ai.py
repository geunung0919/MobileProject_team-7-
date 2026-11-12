from app.receipt_ai import apply_ai_receipt_items


def _result(item):
    return {
        "candidate": {
            "title": "테스트마트",
            "amount_krw": 3000,
            "spent_on": "2026-11-11",
            "category": "other",
        },
        "receipt_document": {
            "document_type": "purchase_receipt",
            "allow_inventory": True,
        },
        "receipt_items": [item],
        "warnings": [],
        "confidence": 0.9,
        "needs_review": False,
    }


def test_ai_fallback_high_confidence_ingredient_can_be_auto_selected():
    result = _result({
        "raw_name": "행복한콩 국산콩 찌개용",
        "normalized_name": "행복한콩 국산콩 찌개용",
        "item_type": "unknown",
        "is_ingredient": False,
        "ingredient_confidence": 0.35,
        "match_method": "unknown",
        "quantity": 1,
        "unit": "개",
        "item_amount_krw": 3000,
        "row_consistent": True,
        "product_code": None,
        "suggested_for_inventory": False,
    })

    def classifier(items):
        assert items[0]["raw_name"] == "행복한콩 국산콩 찌개용"
        return [{
            "index": 0,
            "normalized_name": "두부",
            "item_type": "ingredient",
            "is_ingredient": True,
            "confidence": 0.96,
        }]

    updated = apply_ai_receipt_items(result, classifier=classifier)
    item = updated["receipt_items"][0]
    assert item["normalized_name"] == "두부"
    assert item["match_method"] == "ai"
    assert item["is_ingredient"] is True
    assert item["suggested_for_inventory"] is True
    assert updated["candidate"]["category"] == "groceries"
    assert updated["ai_fallback"]["status"] == "applied"
    assert updated["ai_fallback"]["auto_selected_count"] == 1


def test_ai_fallback_medium_confidence_is_review_only():
    result = _result({
        "raw_name": "우리집찌개재료",
        "normalized_name": "우리집찌개재료",
        "item_type": "unknown",
        "is_ingredient": False,
        "ingredient_confidence": 0.35,
        "match_method": "unknown",
        "quantity": 1,
        "unit": "개",
        "item_amount_krw": 3000,
        "row_consistent": True,
        "product_code": None,
        "suggested_for_inventory": False,
    })

    updated = apply_ai_receipt_items(
        result,
        classifier=lambda items: [{
            "index": 0,
            "normalized_name": "두부",
            "item_type": "ingredient",
            "is_ingredient": True,
            "confidence": 0.81,
        }],
    )
    item = updated["receipt_items"][0]
    assert item["is_ingredient"] is True
    assert item["suggested_for_inventory"] is False


def test_ai_fallback_can_reject_prepared_food():
    result = _result({
        "raw_name": "오늘한끼 제육도시락",
        "normalized_name": "오늘한끼 제육도시락",
        "item_type": "unknown",
        "is_ingredient": False,
        "ingredient_confidence": 0.35,
        "match_method": "unknown",
        "quantity": 1,
        "unit": "개",
        "item_amount_krw": 6500,
        "row_consistent": True,
        "product_code": None,
        "suggested_for_inventory": False,
    })

    updated = apply_ai_receipt_items(
        result,
        classifier=lambda items: [{
            "index": 0,
            "normalized_name": "제육도시락",
            "item_type": "food",
            "is_ingredient": False,
            "confidence": 0.98,
        }],
    )
    item = updated["receipt_items"][0]
    assert item["item_type"] == "food"
    assert item["is_ingredient"] is False
    assert item["suggested_for_inventory"] is False


def test_ai_failure_never_breaks_existing_result():
    original = _result({
        "raw_name": "알수없는상품",
        "normalized_name": "알수없는상품",
        "item_type": "unknown",
        "is_ingredient": False,
        "ingredient_confidence": 0.35,
        "match_method": "unknown",
        "quantity": 1,
        "unit": "개",
        "item_amount_krw": 1000,
        "row_consistent": True,
        "product_code": None,
        "suggested_for_inventory": False,
    })

    def fail(items):
        raise TimeoutError("provider timeout")

    updated = apply_ai_receipt_items(original, classifier=fail)
    assert updated["receipt_items"][0]["normalized_name"] == "알수없는상품"
    assert updated["receipt_items"][0]["match_method"] == "unknown"
    assert updated["ai_fallback"]["status"] == "failed"


def test_ai_never_runs_inventory_classification_for_food_service_document():
    result = _result({
        "raw_name": "오리주물럭",
        "normalized_name": "오리주물럭",
        "item_type": "unknown",
        "is_ingredient": False,
        "ingredient_confidence": 0.35,
        "match_method": "unknown",
        "quantity": 1,
        "unit": "개",
        "item_amount_krw": 16000,
        "row_consistent": True,
        "product_code": None,
        "suggested_for_inventory": False,
    })
    result["receipt_document"] = {
        "document_type": "food_service",
        "allow_inventory": False,
    }

    called = False
    def classifier(items):
        nonlocal called
        called = True
        return []

    updated = apply_ai_receipt_items(result, classifier=classifier)
    assert called is False
    assert updated["receipt_items"][0]["suggested_for_inventory"] is False
