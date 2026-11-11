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



def test_real_receipt_pattern_nonghyup_two_line_barcode_rows():
    text = (
        "001 P 굿모닝우유 900ML [2,150]\n"
        "*8801104210645 1,350 1 1,350\n"
        "002 P 양파\n"
        "*231973 3,300 1 3,300\n"
        "003 P 무\n"
        "*231913 500 1 500\n"
        "004 P 깻잎\n"
        "*231308 750 1 750\n"
        "005 P 하선정 바로먹기좋은장아찌 150g\n"
        "*8801007265889 1,380 1 1,380\n"
        "006 P 브로커리\n"
        "*232285 1,280 1 1,280\n"
        "판매총액: 8,560"
    )
    items = extract_receipt_items(text)
    assert [(item["raw_name"], item["normalized_name"]) for item in items] == [
        ("굿모닝우유 900ML", "우유"),
        ("양파", "양파"),
        ("무", "무"),
        ("깻잎", "깻잎"),
        ("하선정 바로먹기좋은장아찌 150g", "하선정 바로먹기좋은장아찌"),
        ("브로커리", "브로콜리"),
    ]
    assert [item["suggested_for_inventory"] for item in items] == [
        True, True, True, True, False, True
    ]


def test_real_receipt_pattern_emart_quantity_columns_and_discount_lines():
    text = (
        "고구마말랭이 135g 1,000 7 7,000\n"
        "현대 아이비 고어텍스 1,000 2 2,000\n"
        "2개 이상 구매시 15% -2,980\n"
        "롯데 자일리톨알파 4,780 1 4,780\n"
        "꽃델리노 신경 245g 1,880 4 7,520\n"
        "총 품목수량 14"
    )
    items = extract_receipt_items(text)
    assert len(items) == 4
    assert items[0]["quantity"] == 7
    assert items[0]["item_amount_krw"] == 7000
    assert all(item["item_amount_krw"] > 0 for item in items)


def test_real_receipt_pattern_mixed_food_and_groceries_with_coupon_rows():
    text = (
        "03* 무지개 방울토마토9 9,500 1 9,500\n"
        "05* 서울 저지방우유 1L 2,580 1 2,580\n"
        "06* ▲제주목심구이용 12,370 1 12,370\n"
        "07 CJ 고메치킨 핫스파 7,980 1 7,980\n"
        "@CJ_1만원1천원 -500\n"
        "09* 생칵테일새우(51-60 14,800 1 14,800\n"
        "11 강화올먹고자란오리 9,800 1 9,800\n"
        "12* 냉동 자숙연어 렌트 8,980 1 8,980\n"
        "13* 생밤느타리(팩) 1,990 1 1,990\n"
        "14* 논산양촌상추(봉) 1,180 1 1,180\n"
        "15* 애호박 1,380 1 1,380\n"
        "17* 토종의성깐마늘(200 2,980 1 2,980\n"
        "18* 사과 벌크 2,930 1 2,930\n"
        "19 농심닭다리너겟 130 1,980 1 1,980\n"
        "20 마리오케이퍼100g 3,180 1 3,180\n"
        "22 상하리코타치즈 200 5,280 1 5,280\n"
        "23 이마트 초코칩76g 1,080 1 1,080\n"
        "24 점보바게트 2,400 1 2,400"
    )
    items = extract_receipt_items(text)
    selected = {item["normalized_name"] for item in items if item["suggested_for_inventory"]}
    assert {"토마토", "우유", "돼지고기", "새우", "오리고기", "연어", "버섯",
            "상추", "애호박", "마늘", "사과", "케이퍼", "치즈"} <= selected
    excluded_names = {item["raw_name"] for item in items if not item["suggested_for_inventory"]}
    assert any("고메치킨" in name for name in excluded_names)
    assert any("닭다리너겟" in name for name in excluded_names)
    assert any("초코칩" in name for name in excluded_names)
    assert any("바게트" in name for name in excluded_names)


def test_barcode_only_product_is_kept_for_manual_name_review():
    items = extract_receipt_items(
        "아이스크림 250 3 750\n"
        "8801005638654 1,380 2 2,760\n"
        "8807500007063 1,150 1 1,150\n"
        "스팸 340G 2,950 1 2,950\n"
        "후레시참치120G 950 2 1,900\n"
        "가지 700 1 700\n"
        "합계 27,720"
    )
    barcode_items = [item for item in items if item.get("product_code")]
    assert [item["product_code"] for item in barcode_items] == [
        "8801005638654", "8807500007063"
    ]
    assert all(item["raw_name"] == "상품명 확인 필요" for item in barcode_items)
    assert all(item["suggested_for_inventory"] is False for item in barcode_items)
    assert any(item["raw_name"] == "아이스크림" and item["item_type"] == "food" for item in items)


def test_multiple_receipt_text_is_flagged_for_crop_review():
    result = parse_import_candidate(
        "GS25\n2011-08-30\n합계 4,000원\n"
        "HOLLYS COFFEE\n2011-08-31\nTOTAL 7,800원",
        "ocr",
        today=date(2026, 11, 11),
    )
    assert "multiple_receipts_suspected" in result["receipt_document_issues"]
    assert any("여러 영수증" in warning for warning in result["warnings"])
    assert result["needs_review"] is True

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
