"""카드 승인 문자(여러 줄·한 줄)에서 사용처·금액·분류를 제대로 뽑는지."""
import pytest

from app.fintech import parse_import_candidate

CASES = [
    ('[Web발신]\n신한카드(1234)승인\n김*웅\n15,800원 일시불\n11/21 18:32\n이마트천안점\n누적245,000원',
     '이마트천안점', 15800, 'groceries'),
    ('신한카드(1234)승인\n김*웅\n15,800원 일시불\n11/21 18:32\n이마트천안점\n누적245,000원',
     '이마트천안점', 15800, 'groceries'),
    ('[Web발신]\nKB국민카드1234승인\n김*웅님\n8,500원 일시불\n11/21 12:10\n배달의민족',
     '배달의민족', 8500, 'food'),
    ('[Web발신]\n현대카드 ZERO 승인\n김*웅\n4,500원 일시불\n11/21 09:12\n스타벅스 천안두정점\n누적 120,000원',
     '스타벅스 천안두정점', 4500, 'food'),
    ('[카카오뱅크] 체크카드 승인\n김*웅님\n12,000원\n11/21 19:40\nGS25 천안두정점',
     'GS25 천안두정점', 12000, 'groceries'),
    ('[Web발신] 신한카드(1234)승인 김*웅 15,800원 일시불 11/21 18:32 이마트천안점 누적245,000원',
     '이마트천안점', 15800, 'groceries'),
    ('[Web발신]\n삼성카드 승인\n김*웅\n7,300원 일시불\n11/22 23:10\n카카오T 택시',
     '카카오T 택시', 7300, 'transport'),
]


@pytest.mark.parametrize('text,merchant,amount,category', CASES)
def test_card_sms(text, merchant, amount, category):
    result = parse_import_candidate(text, source='sms')
    candidate = result['candidate']
    assert candidate['title'] == merchant
    assert candidate['amount_krw'] == amount
    assert candidate['category'] == category
    assert result['warnings'] == []


def test_cancel_sms_is_not_new_expense():
    result = parse_import_candidate(
        '[Web발신]\n신한카드(1234)승인취소\n김*웅\n15,800원\n11/21 18:40\n이마트천안점', source='sms')
    assert result['candidate']['amount_krw'] is None
    assert result['needs_review'] is True


def test_balance_only_line_is_not_amount():
    # 누적 금액만 있으면 결제 금액으로 쓰지 않음
    result = parse_import_candidate('누적 245,000원\n이마트천안점', source='sms')
    assert result['candidate']['amount_krw'] is None
