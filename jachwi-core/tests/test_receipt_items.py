from datetime import date

from app.fintech import parse_import_candidate
from app.receipt_items import classify_product, extract_receipt_items, parse_receipt_item_line
from test_core import A, client


def test_structured_receipt_rows_extract_mixed_items():
    text = (
        "이마트 천안점\n"
        "2026-11-11 18:20\n"
        "01 서울우유 나100% 1L 3,200 1 3,200\n"
        "02 무항생제 특란10입 6,900 1 6,900\n"
        "03 크리넥스 화장지 8,900 1 8,900\n"
        "04 국내산 삼겹살 12,900 1 12,900\n"
        "합계 31,900원"
    )
    items = extract_receipt_items(text)
    assert [item["normalized_name"] for item in items] == [
        "우유", "달걀", "크리넥스 화장지", "돼지고기"
    ]
    assert [item["item_type"] for item in items] == [
        "ingredient", "ingredient", "living", "ingredient"
    ]
    assert [item["suggested_for_inventory"] for item in items] == [
        True, True, False, True
    ]


def test_split_name_and_price_lines_are_rejoined_conservatively():
    items = extract_receipt_items(
        "서울우유 나100% 1L\n3,200 1 3,200\n합계\n3,200"
    )
    assert len(items) == 1
    assert items[0]["normalized_name"] == "우유"
    assert items[0]["item_amount_krw"] == 3200


def test_processed_food_does_not_false_positive_on_ingredient_word():
    for name in ["사과주스 1L", "감자칩 80g", "딸기우유 200ml", "사과 세제 500ml"]:
        result = classify_product(name)
        assert result["is_ingredient"] is False
    assert classify_product("사과 1kg")["normalized_name"] == "사과"
    assert classify_product("국산콩 두부 300g")["normalized_name"] == "두부"


def test_inconsistent_quantity_is_extracted_but_not_auto_selected():
    item = parse_receipt_item_line("03 우유 1,500 2 1,500")
    assert item is not None
    assert item["normalized_name"] == "우유"
    assert item["quantity"] == 2
    assert item["row_consistent"] is False
    assert item["suggested_for_inventory"] is False


def test_ocr_preview_exposes_items_and_uses_them_for_grocery_fallback():
    result = parse_import_candidate(
        "사용처 확인 필요\n2026-11-11\n01 국산콩 두부 1,800 1 1,800\n합계 1,800원",
        "ocr",
        today=date(2026, 11, 11),
    )
    assert result["receipt_items"][0]["normalized_name"] == "두부"
    assert result["receipt_items"][0]["is_ingredient"] is True
    assert result["candidate"]["category"] == "groceries"


def test_confirm_persists_user_reviewed_receipt_items(client):
    raw = (
        "이마트\n2026-11-11\n"
        "01 서울우유 1L 3,200 1 3,200\n"
        "02 세제 5,000 1 5,000\n"
        "합계 8,200원"
    )
    preview = client.post(
        "/api/v1/me/spending/imports/preview",
        headers=A,
        json={"raw_text": raw, "source": "ocr"},
    )
    assert preview.status_code == 200
    body = preview.json()
    receipt_items = body["receipt_items"]
    receipt_items[0]["is_ingredient"] = True
    receipt_items[0]["suggested_for_inventory"] = True
    receipt_items[1]["is_ingredient"] = False
    receipt_items[1]["suggested_for_inventory"] = False

    confirm_items = [
        {
            "raw_name": item["raw_name"],
            "normalized_name": item["normalized_name"],
            "quantity": item["quantity"],
            "unit": item["unit"],
            "item_amount_krw": item["item_amount_krw"],
            "item_type": item["item_type"],
            "is_ingredient": item["is_ingredient"],
            "ingredient_confidence": item["ingredient_confidence"],
            "suggested_for_inventory": item["suggested_for_inventory"],
        }
        for item in receipt_items
    ]
    response = client.post(
        "/api/v1/me/spending/imports/confirm",
        headers=A,
        json={
            "raw_text": raw,
            "source": "ocr",
            "title": "이마트",
            "amount_krw": 8200,
            "spent_on": "2026-11-11",
            "category": "groceries",
            "receipt_items": confirm_items,
        },
    )
    assert response.status_code == 201
    saved = response.json()
    assert saved["receipt_items"][0]["normalized_name"] == "우유"
    assert saved["receipt_items"][0]["is_ingredient"] is True
    assert saved["receipt_items"][1]["is_ingredient"] is False
