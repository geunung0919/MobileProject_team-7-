"""Structured receipt line extraction and conservative ingredient classification.

This module intentionally keeps OCR and item understanding separate:
OCR returns text; this parser turns plausible purchase rows into structured candidates.
Only high-confidence ingredient candidates are suggested for automatic fridge registration.
"""
from __future__ import annotations

import re
import unicodedata


_AMOUNT_AT_END = re.compile(r"(?<![-\d,])(?P<amount>\d{1,3}(?:,\d{3})+|\d{3,9})\s*원?\s*$")
_PRICE_QTY_AT_END = re.compile(
    r"(?P<unit_price>\d{1,3}(?:,\d{3})+|\d{2,9})\s+(?P<quantity>\d{1,3})\s*$"
)
_QTY_X_PRICE_AT_END = re.compile(
    r"(?P<quantity>\d{1,3})\s*[xX×*]\s*(?P<unit_price>\d{1,3}(?:,\d{3})+|\d{2,9})\s*$"
)
_LEADING_ROW_NUMBER = re.compile(r"^\s*\d{1,3}\s*[*.)-]?\s+")
_LEADING_TAX_MARK = re.compile(r"^[*#]\s*")
_LEADING_STORE_MARK = re.compile(r"^(?:P|p)\s+")
_LEADING_DECORATION = re.compile(r"^[▲△◆◇●○▶▷■□]+\s*")
_BARCODE_OR_CODE = re.compile(r"(?<![0-9A-Za-z])\*?\d{5,14}(?![0-9A-Za-z])")
_BRACKETED_PRICE = re.compile(r"[\[(]\s*\d{1,3}(?:,\d{3})+\s*[\])]")
_BARCODE_PURCHASE_ROW = re.compile(
    r"^\s*\*?(?P<code>\d{8,14})\s+"
    r"(?P<unit_price>\d{1,3}(?:,\d{3})+|\d{2,9})\s+"
    r"(?P<quantity>\d{1,3})\s+"
    r"(?P<amount>\d{1,3}(?:,\d{3})+|\d{2,9})\s*원?\s*$"
)

_SKIP_LINE = re.compile(
    r"(?:총\s*합계|합\s*계|총\s*액|결제대상금액|결제금액|승인금액|받을금액|"
    r"과세물품|면세물품|부가세|공급가액|할인|쿠폰|포인트|적립|현금|카드|거스름|잔액|"
    r"승인번호|카드번호|사업자|전화|주소|영수증|매출전표|거래번호|주문번호|일시불|구매시)",
    re.I,
)
_HEADER_LINE = re.compile(r"(?:상품명|품목명|단가\s*수량|수량\s*금액|단가|수량|금액)", re.I)

_LIVING_WORDS = (
    "세제", "주방세제", "섬유유연제", "휴지", "화장지", "키친타월", "물티슈", "샴푸", "린스",
    "트리트먼트", "치약", "칫솔", "비누", "수세미", "쓰레기봉투", "종량제", "건전지", "면도기",
    "로션", "화장품", "생리대", "마스크", "쇼핑백",
)
_PROCESSED_FOOD_WORDS = (
    "주스", "음료", "탄산", "과자", "스낵", "칩", "캔디", "초콜릿", "아이스크림", "라면",
    "컵라면", "빵", "케이크", "도시락", "김밥", "샌드위치", "햄버거", "커피", "딸기우유",
    "초코우유", "바나나우유", "요구르트", "장아찌", "말랭이", "너겟", "짬뽕", "바게트",
)

# Order matters: specific aliases should be checked before broad words.
_INGREDIENT_ALIASES = (
    ("달걀", ("무항생제특란", "무항생제대란", "특란", "대란", "왕란", "계란", "달걀")),
    ("우유", ("서울우유", "매일우유", "남양우유", "파스퇴르우유", "흰우유", "저지방우유", "무지방우유", "우유")),
    ("두부", ("국산콩두부", "순두부", "연두부", "두부")),
    ("돼지고기", ("삼겹살", "목살", "목심", "앞다리살", "뒷다리살", "돼지고기")),
    ("소고기", ("한우", "소고기", "쇠고기", "불고기용")),
    ("닭고기", ("닭가슴살", "닭안심", "닭다리", "닭고기")),
    ("양파", ("양파",)),
    ("대파", ("대파", "쪽파")),
    ("감자", ("감자",)),
    ("고구마", ("고구마",)),
    ("당근", ("당근",)),
    ("오이", ("오이",)),
    ("가지", ("가지",)),
    ("양배추", ("양배추",)),
    ("배추", ("배추",)),
    ("콩나물", ("콩나물",)),
    ("숙주", ("숙주",)),
    ("시금치", ("시금치",)),
    ("애호박", ("애호박",)),
    ("버섯", ("새송이버섯", "표고버섯", "느타리버섯", "느타리", "팽이버섯", "버섯")),
    ("토마토", ("방울토마토", "토마토")),
    ("상추", ("양촌상추", "청상추", "적상추", "상추")),
    ("깻잎", ("깻잎",)),
    ("브로콜리", ("브로콜리", "브로커리")),
    ("마늘", ("깐마늘", "통마늘", "마늘")),
    ("새우", ("칵테일새우", "생새우", "흰다리새우", "새우")),
    ("연어", ("자숙연어", "생연어", "연어")),
    ("오리고기", ("자란오리", "생오리", "오리로스", "훈제오리")),
    ("케이퍼", ("케이퍼",)),
    ("치즈", ("리코타치즈", "모짜렐라치즈", "체다치즈")),
    ("사과", ("사과",)),
    ("바나나", ("바나나",)),
    ("딸기", ("산딸기", "딸기")),
    ("귤", ("감귤", "귤")),
    ("포도", ("포도",)),
    ("쌀", ("현미", "백미", "쌀")),
    ("김치", ("배추김치", "깍두기", "김치")),
    ("간장", ("진간장", "양조간장", "국간장", "간장")),
    ("고추장", ("고추장",)),
    ("된장", ("된장",)),
    ("소금", ("천일염", "꽃소금", "소금")),
    ("설탕", ("백설탕", "황설탕", "설탕")),
    ("식용유", ("카놀라유", "포도씨유", "올리브유", "식용유")),
    ("참기름", ("참기름",)),
    ("고춧가루", ("고춧가루",)),
)

_PACKAGE_RE = re.compile(
    r"\d+(?:\.\d+)?\s*(?:kg|g|ml|l|개입|입|구|개|팩|봉|병|모)"
    r"(?:\s*[xX×*]\s*\d+)?",
    re.I,
)


def _compact(value: str) -> str:
    value = unicodedata.normalize("NFKC", value or "").lower()
    return re.sub(r"[^0-9a-z가-힣]+", "", value)


def _money(value: str) -> int | None:
    try:
        amount = int(value.replace(",", ""))
    except (AttributeError, ValueError):
        return None
    return amount if 0 < amount <= 1_000_000_000 else None


def normalize_product_name(raw_name: str) -> str:
    """Remove packaging noise only; never invent a food name here."""
    name = unicodedata.normalize("NFKC", raw_name or "")
    name = _PACKAGE_RE.sub(" ", name)
    name = re.sub(r"\s+", " ", name).strip(" -_/")
    return name[:120]


def classify_product(raw_name: str) -> dict:
    compact = _compact(raw_name)
    if not compact:
        return {
            "normalized_name": "",
            "item_type": "unknown",
            "is_ingredient": False,
            "ingredient_confidence": 0.0,
        }

    if compact == "무":
        return {
            "normalized_name": "무",
            "item_type": "ingredient",
            "is_ingredient": True,
            "ingredient_confidence": 0.98,
        }

    if any(_compact(word) in compact for word in _LIVING_WORDS):
        return {
            "normalized_name": normalize_product_name(raw_name),
            "item_type": "living",
            "is_ingredient": False,
            "ingredient_confidence": 0.98,
        }

    # Avoid false positives such as 사과주스, 감자칩, 딸기우유.
    if any(_compact(word) in compact for word in _PROCESSED_FOOD_WORDS):
        return {
            "normalized_name": normalize_product_name(raw_name),
            "item_type": "food",
            "is_ingredient": False,
            "ingredient_confidence": 0.95,
        }

    for standard_name, aliases in _INGREDIENT_ALIASES:
        for alias in aliases:
            key = _compact(alias)
            if key and key in compact:
                return {
                    "normalized_name": standard_name,
                    "item_type": "ingredient",
                    "is_ingredient": True,
                    "ingredient_confidence": 0.96 if compact == key else 0.9,
                }

    return {
        "normalized_name": normalize_product_name(raw_name),
        "item_type": "unknown",
        "is_ingredient": False,
        "ingredient_confidence": 0.35,
    }


def parse_receipt_item_line(raw_line: str) -> dict | None:
    line = unicodedata.normalize("NFKC", raw_line or "").strip()
    line = re.sub(r"\s+", " ", line)
    if len(line) < 3 or _SKIP_LINE.search(line) or _HEADER_LINE.fullmatch(line.replace(" ", "")):
        return None

    amount_match = _AMOUNT_AT_END.search(line)
    if not amount_match:
        return None
    amount = _money(amount_match.group("amount"))
    if amount is None:
        return None

    prefix = line[:amount_match.start()].strip()
    quantity = 1
    unit_price = None
    row_consistent = True

    detail_match = _PRICE_QTY_AT_END.search(prefix)
    if detail_match:
        quantity = int(detail_match.group("quantity"))
        unit_price = _money(detail_match.group("unit_price"))
        prefix = prefix[:detail_match.start()].strip()
        row_consistent = bool(unit_price and unit_price * quantity == amount)
    else:
        detail_match = _QTY_X_PRICE_AT_END.search(prefix)
        if detail_match:
            quantity = int(detail_match.group("quantity"))
            unit_price = _money(detail_match.group("unit_price"))
            prefix = prefix[:detail_match.start()].strip()
            row_consistent = bool(unit_price and unit_price * quantity == amount)

    product_code_match = _BARCODE_OR_CODE.search(prefix)
    product_code = product_code_match.group(0).lstrip("*") if product_code_match else None

    name = _LEADING_ROW_NUMBER.sub("", prefix)
    name = _LEADING_TAX_MARK.sub("", name)
    name = _LEADING_STORE_MARK.sub("", name)
    name = _LEADING_DECORATION.sub("", name)
    # Some Korean marts print a list/original price on the product-name line,
    # then barcode + actual unit price/quantity/amount on the following line.
    # Those numeric identifiers are not part of the product name.
    name = _BRACKETED_PRICE.sub(" ", name)
    name = _BARCODE_OR_CODE.sub(" ", name)
    name = re.sub(r"\s+", " ", name).strip(" -|:")
    if (len(name) < 2 and name != "무") or not re.search(r"[가-힣A-Za-z]", name):
        return None
    if _SKIP_LINE.search(name):
        return None

    classification = classify_product(name)
    return {
        "raw_name": name[:120],
        **classification,
        "quantity": max(1, quantity),
        "unit": "개",
        "item_amount_krw": amount,
        "unit_price_krw": unit_price,
        "row_consistent": row_consistent,
        "product_code": product_code,
        "suggested_for_inventory": bool(classification["is_ingredient"] and row_consistent),
    }


def parse_barcode_item_line(raw_line: str) -> dict | None:
    line = unicodedata.normalize("NFKC", raw_line or "").strip()
    line = re.sub(r"\s+", " ", line)
    match = _BARCODE_PURCHASE_ROW.fullmatch(line)
    if not match:
        return None

    amount = _money(match.group("amount"))
    unit_price = _money(match.group("unit_price"))
    quantity = int(match.group("quantity"))
    if amount is None or unit_price is None or quantity <= 0:
        return None

    return {
        "raw_name": "상품명 확인 필요",
        "normalized_name": "상품명 확인 필요",
        "item_type": "unknown",
        "is_ingredient": False,
        "ingredient_confidence": 0.0,
        "quantity": quantity,
        "unit": "개",
        "item_amount_krw": amount,
        "unit_price_krw": unit_price,
        "row_consistent": unit_price * quantity == amount,
        "product_code": match.group("code"),
        "suggested_for_inventory": False,
    }


def extract_receipt_items(raw_text: str, limit: int = 50) -> list[dict]:
    items: list[dict] = []
    seen: set[tuple] = set()
    lines = [
        re.sub(r"\s+", " ", line).strip()
        for line in unicodedata.normalize("NFKC", raw_text or "").splitlines()
        if line.strip()
    ]
    index = 0
    while index < len(lines):
        line = lines[index]
        item = parse_receipt_item_line(line)
        consumed = 1

        # Tesseract often separates the product name and price columns.
        # Rejoin one adjacent numeric row, but only when the first line contains
        # an actual product-like word. Totals and metadata are still filtered
        # by parse_receipt_item_line after joining.
        if (
            item is None
            and index + 1 < len(lines)
            and re.search(r"[가-힣A-Za-z]", line)
            and _AMOUNT_AT_END.search(lines[index + 1])
        ):
            joined = f"{line} {lines[index + 1]}"
            item = parse_receipt_item_line(joined)
            if item is not None:
                consumed = 2

        if item is None:
            item = parse_barcode_item_line(line)

        index += consumed
        if not item:
            continue
        signature = (
            _compact(item["raw_name"]),
            item["quantity"],
            item["item_amount_krw"],
        )
        if signature in seen:
            continue
        seen.add(signature)
        items.append(item)
        if len(items) >= limit:
            break
    return items
