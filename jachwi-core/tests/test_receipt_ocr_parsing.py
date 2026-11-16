from datetime import date

from app.fintech import extract_date, normalize_ocr_numeric_text, parse_import_candidate

TODAY = date(2026, 11, 16)


def test_split_thousands_and_letter_zero_are_joined():
    assert normalize_ocr_numeric_text('합계 22, 140') == '합계 22,140'
    assert normalize_ocr_numeric_text('카드 6,94C') == '카드 6,940'
    # 쉼표 뒤가 3자리가 아니면 건드리지 않는다
    assert normalize_ocr_numeric_text('수량 1, 2') == '수량 1, 2'


def test_repeated_total_fallback_when_label_is_garbled():
    text = '로컬마트\n두부 2,500\n우유 3,200\nㅎ곗 5,700\n신용카드 5,700\n일시불 5,700'
    result = parse_import_candidate(text, source='ocr', today=TODAY)
    assert result['candidate']['amount_krw'] == 5700


def test_repeated_item_price_is_not_taken_as_total():
    text = '로컬마트\n두부 2,500\n두부 2,500\n품명 수량'
    result = parse_import_candidate(text, source='ocr', today=TODAY)
    assert result['candidate']['amount_krw'] is None


def test_two_digit_year_dates():
    assert extract_date('판매일:23-11-22 19:09', today=TODAY) == (date(2023, 11, 22), False)
    assert extract_date('사업자번호:405-09-51390', today=TODAY) == (TODAY, True)
    result = parse_import_candidate('마트\n재인쇄:23-10~21 21:58\n합계 1,000', source='ocr', today=TODAY)
    assert result['candidate']['spent_on'] == '2023-10-21'
