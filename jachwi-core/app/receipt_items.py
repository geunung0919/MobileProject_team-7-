"""Structured receipt line extraction and conservative ingredient classification.

This module intentionally keeps OCR and item understanding separate:
OCR returns text; this parser turns plausible purchase rows into structured candidates.
Only high-confidence ingredient candidates are suggested for automatic fridge registration.
"""
from __future__ import annotations

import re
import unicodedata
from difflib import SequenceMatcher

from .receipt_dataset import load_receipt_dataset, lookup_dataset_barcode, lookup_dataset_product_name


_AMOUNT_AT_END = re.compile(r"(?<![-\d,])(?P<amount>\d{1,3}(?:,\d{3})+|\d{3,9})\s*원?\s*$")
_PRICE_QTY_AT_END = re.compile(
    r"(?P<unit_price>\d{1,3}(?:,\d{3})+|\d{2,9})\s+(?P<quantity>\d{1,3})\s*$"
)
_QTY_X_PRICE_AT_END = re.compile(
    r"(?P<quantity>\d{1,3})\s*[xX×*]\s*(?P<unit_price>\d{1,3}(?:,\d{3})+|\d{2,9})\s*$"
)
_QTY_PRICE_AT_END = re.compile(
    r"(?P<quantity>\d{1,3})\s+(?P<unit_price>\d{1,3}(?:,\d{3})+|\d{2,9})\s*$"
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

_MULTI_DOCUMENT_HINTS = re.compile(r"(?:CASH\s*RECEIPT|영수증\s*상세|영수증|매출전표)", re.I)
_PAYMENT_DETAIL_HINTS = re.compile(
    r"(?:승인\s*일시|승인\s*번호|거래유형|가맹점명|공급가액|봉사료|카드번호)",
    re.I,
)
_FOOD_SERVICE_HINTS = re.compile(
    r"(?:배달\s*주문표|주문번호|주방용|메뉴\s+수량\s+금액|"
    r"커피빈|HOLLYS|할리스|카페|COFFEE|레스토랑|식당)",
    re.I,
)


def classify_receipt_document(raw_text: str) -> dict:
    text = unicodedata.normalize("NFKC", raw_text or "")
    compact_lines = [line.strip() for line in text.splitlines() if line.strip()]

    # Collages/screenshots with several receipts should never be treated as one purchase.
    english_cash_receipts = len(re.findall(r"CASH\s*RECEIPT", text, re.I))
    korean_receipt_headers = len(re.findall(r"\[?영\s*수\s*증\]?", text))
    if english_cash_receipts >= 2 or korean_receipt_headers >= 3:
        return {
            "document_type": "multiple_receipts",
            "allow_inventory": False,
            "confidence": 0.98,
        }

    payment_hits = sum(bool(_PAYMENT_DETAIL_HINTS.search(line)) for line in compact_lines)
    if payment_hits >= 3:
        return {
            "document_type": "payment_detail",
            "allow_inventory": False,
            "confidence": 0.96,
        }

    food_hits = sum(bool(_FOOD_SERVICE_HINTS.search(line)) for line in compact_lines)
    if food_hits >= 2 or re.search(
        r"배달\s*주문표|주방용|커피빈|HOLLYS|할리스",
        text,
        re.I,
    ):
        return {
            "document_type": "food_service",
            "allow_inventory": False,
            "confidence": 0.94,
        }

    return {
        "document_type": "purchase_receipt",
        "allow_inventory": True,
        "confidence": 0.65,
    }

_LIVING_WORDS = (
    "세제", "주방세제", "섬유유연제", "휴지", "화장지", "키친타월", "물티슈", "샴푸", "린스",
    "트리트먼트", "치약", "칫솔", "비누", "수세미", "쓰레기봉투", "종량제", "건전지", "면도기",
    "로션", "화장품", "생리대", "마스크", "쇼핑백",
)
_PROCESSED_FOOD_WORDS = (
    "주스", "음료", "탄산", "과자", "스낵", "칩", "캔디", "초콜릿", "아이스크림", "라면",
    "컵라면", "빵", "케이크", "도시락", "김밥", "샌드위치", "햄버거", "커피", "딸기우유",
    "초코우유", "바나나우유", "요구르트", "장아찌", "말랭이", "너겟", "짬뽕", "바게트",
    "아메리카노", "라떼", "토르트", "피자", "콜라", "쥬스", "즙",
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
    ("파프리카", ("파프리카",)),
    ("고추", ("청양고추", "풋고추", "홍고추", "고추")),
    ("부추", ("부추",)),
    ("미나리", ("미나리",)),
    ("양상추", ("양상추",)),
    ("샐러리", ("셀러리", "샐러리")),
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
    ("치즈", ("리코타치즈", "모짜렐라치즈", "체다치즈", "슬라이스치즈")),
    ("버터", ("무염버터", "가염버터", "버터")),
    ("생크림", ("휘핑크림", "생크림")),
    ("마요네즈", ("마요네즈",)),
    ("케첩", ("토마토케첩", "케찹", "케첩")),
    ("참치", ("후레시참치", "참치캔", "참치")),
    ("햄", ("스팸", "런천미트", "슬라이스햄", "햄")),
    ("소시지", ("비엔나소시지", "후랑크소시지", "소세지", "소시지")),
    ("베이컨", ("베이컨",)),
    ("오징어", ("오징어",)),
    ("고등어", ("고등어",)),
    ("갈치", ("갈치",)),
    ("조개", ("바지락", "모시조개", "조개")),
    ("홍합", ("홍합",)),
    ("낙지", ("낙지",)),
    ("사과", ("사과",)),
    ("바나나", ("바나나",)),
    ("딸기", ("산딸기", "딸기")),
    ("귤", ("감귤", "귤")),
    ("포도", ("포도",)),
    ("배", ("배",)),
    ("복숭아", ("복숭아",)),
    ("수박", ("수박",)),
    ("참외", ("참외",)),
    ("키위", ("골드키위", "그린키위", "키위")),
    ("레몬", ("레몬",)),
    ("쌀", ("현미", "백미", "쌀")),
    ("밀가루", ("중력분", "강력분", "박력분", "밀가루")),
    ("전분", ("감자전분", "옥수수전분", "전분")),
    ("빵가루", ("빵가루",)),
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

_RECEIPT_DATASET = load_receipt_dataset()
_DATASET_LIVING_WORDS = tuple(_RECEIPT_DATASET.get("living_terms") or [])
_DATASET_PROCESSED_FOOD_WORDS = tuple(_RECEIPT_DATASET.get("processed_food_terms") or [])
_DATASET_INGREDIENT_ALIASES = tuple(
    (
        row["standard_name"],
        tuple(row.get("aliases") or []),
    )
    for row in (_RECEIPT_DATASET.get("ingredients") or [])
    if row.get("standard_name")
)

_ALL_LIVING_WORDS = tuple(dict.fromkeys([*_LIVING_WORDS, *_DATASET_LIVING_WORDS]))
_ALL_PROCESSED_FOOD_WORDS = tuple(
    dict.fromkeys([*_PROCESSED_FOOD_WORDS, *_DATASET_PROCESSED_FOOD_WORDS])
)
_ALL_INGREDIENT_ALIASES = tuple([
    *_INGREDIENT_ALIASES,
    *_DATASET_INGREDIENT_ALIASES,
])


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


def _best_fuzzy_ingredient(compact_name: str):
    """Return (standard_name, alias, score) for OCR-damaged ingredient words."""
    candidate = re.sub(r'\d+', '', compact_name)
    if len(candidate) < 3:
        return None

    best = None
    for standard_name, aliases in _ALL_INGREDIENT_ALIASES:
        for alias in aliases:
            key = re.sub(r'\d+', '', _compact(alias))
            # Two-syllable Korean words are too short for safe fuzzy auto classification.
            if len(key) < 3:
                continue

            min_window = max(2, len(key) - 1)
            max_window = min(len(candidate), len(key) + 1)
            if min_window > max_window:
                continue

            score = 0.0
            for size in range(min_window, max_window + 1):
                for start in range(0, len(candidate) - size + 1):
                    window = candidate[start:start + size]
                    score = max(score, SequenceMatcher(None, key, window).ratio())

            # One OCR substitution in a short Korean ingredient name can lower
            # SequenceMatcher sharply. Low-confidence fuzzy matches are surfaced for
            # review but are not auto-selected unless confidence reaches 0.82.
            threshold = 0.66 if len(key) == 3 else 0.74 if len(key) == 4 else 0.76
            if score < threshold:
                continue
            if best is None or score > best[2]:
                best = (standard_name, alias, score)

    return best


def classify_product(raw_name: str) -> dict:
    compact = _compact(raw_name)
    if not compact:
        return {
            "normalized_name": "",
            "item_type": "unknown",
            "is_ingredient": False,
            "ingredient_confidence": 0.0,
            "match_method": "none",
        }

    if compact == "무":
        return {
            "normalized_name": "무",
            "item_type": "ingredient",
            "is_ingredient": True,
            "ingredient_confidence": 0.98,
            "match_method": "exact",
        }

    if any(_compact(word) in compact for word in _ALL_LIVING_WORDS):
        return {
            "normalized_name": normalize_product_name(raw_name),
            "item_type": "living",
            "is_ingredient": False,
            "ingredient_confidence": 0.98,
            "match_method": "rule",
        }

    # Apply explicit prepared-food rules before ingredient matching so names such as
    # 감자칩, 딸기우유 or 오리주물럭 do not leak into raw-ingredient inventory.
    if any(_compact(word) in compact for word in _ALL_PROCESSED_FOOD_WORDS):
        return {
            "normalized_name": normalize_product_name(raw_name),
            "item_type": "food",
            "is_ingredient": False,
            "ingredient_confidence": 0.95,
            "match_method": "rule",
        }

    dataset_product = lookup_dataset_product_name(raw_name)
    if dataset_product:
        item_type = dataset_product.get("item_type", "unknown")
        is_ingredient = item_type == "ingredient"
        return {
            "normalized_name": (
                dataset_product.get("normalized_name")
                or normalize_product_name(raw_name)
            ),
            "item_type": item_type,
            "is_ingredient": is_ingredient,
            "ingredient_confidence": 0.96 if is_ingredient else 0.95,
            "match_method": "dataset",
        }

    for standard_name, aliases in _ALL_INGREDIENT_ALIASES:
        for alias in aliases:
            key = _compact(alias)
            if key and key in compact:
                return {
                    "normalized_name": standard_name,
                    "item_type": "ingredient",
                    "is_ingredient": True,
                    "ingredient_confidence": 0.98 if compact == key else 0.93,
                    "match_method": "exact",
                }

    fuzzy = _best_fuzzy_ingredient(compact)
    if fuzzy:
        standard_name, alias, score = fuzzy
        return {
            "normalized_name": standard_name,
            "item_type": "ingredient",
            "is_ingredient": True,
            # Fuzzy OCR recovery is useful, but should remain reviewable.
            "ingredient_confidence": round(min(0.88, score), 2),
            "match_method": "fuzzy",
            "matched_alias": alias,
        }

    return {
        "normalized_name": normalize_product_name(raw_name),
        "item_type": "unknown",
        "is_ingredient": False,
        "ingredient_confidence": 0.35,
        "match_method": "unknown",
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
        else:
            detail_match = _QTY_PRICE_AT_END.search(prefix)
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
        "suggested_for_inventory": bool(
            classification["is_ingredient"]
            and row_consistent
            and classification["ingredient_confidence"] >= 0.82
        ),
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

    product_code = match.group("code")
    dataset_product = lookup_dataset_barcode(product_code)
    if dataset_product:
        item_type = dataset_product.get("item_type", "unknown")
        is_ingredient = item_type == "ingredient"
        confidence = 0.97 if is_ingredient else 0.95
        return {
            "raw_name": dataset_product.get("raw_name") or dataset_product.get("normalized_name") or "상품명 확인 필요",
            "normalized_name": dataset_product.get("normalized_name") or dataset_product.get("raw_name") or "상품명 확인 필요",
            "item_type": item_type,
            "is_ingredient": is_ingredient,
            "ingredient_confidence": confidence,
            "match_method": "dataset",
            "quantity": quantity,
            "unit": dataset_product.get("unit") or "개",
            "item_amount_krw": amount,
            "unit_price_krw": unit_price,
            "row_consistent": unit_price * quantity == amount,
            "product_code": product_code,
            "suggested_for_inventory": bool(
                is_ingredient and confidence >= 0.92 and unit_price * quantity == amount
            ),
        }

    return {
        "raw_name": "상품명 확인 필요",
        "normalized_name": "상품명 확인 필요",
        "item_type": "unknown",
        "is_ingredient": False,
        "ingredient_confidence": 0.0,
        "match_method": "unknown",
        "quantity": quantity,
        "unit": "개",
        "item_amount_krw": amount,
        "unit_price_krw": unit_price,
        "row_consistent": unit_price * quantity == amount,
        "product_code": product_code,
        "suggested_for_inventory": False,
    }


def extract_receipt_items(raw_text: str, limit: int = 50) -> list[dict]:
    document = classify_receipt_document(raw_text)
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
        if not document["allow_inventory"]:
            item = {**item, "suggested_for_inventory": False}
        items.append(item)
        if len(items) >= limit:
            break
    return items
