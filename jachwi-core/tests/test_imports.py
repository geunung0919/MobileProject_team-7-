from datetime import date
from app.fintech import parse_import_candidate
from test_core import client, A, B

ROOT = '/api/v1/me/spending'


def confirm_body(raw_text, source='notification'):
    parsed = parse_import_candidate(raw_text, source, today=date(2026, 10, 22))['candidate']
    return {
        'raw_text': raw_text,
        'source': source,
        'title': parsed['title'],
        'amount_krw': parsed['amount_krw'],
        'spent_on': parsed['spent_on'],
        'category': parsed['category'],
    }


def test_parser_handles_card_kakao_and_receipt_text():
    card = parse_import_candidate(
        '[KB국민] 12,300원 승인 김*웅 10/22 13:15 스타벅스 아산점',
        'notification',
        today=date(2026, 10, 22),
    )
    assert card['candidate'] == {
        'title': '스타벅스 아산점',
        'amount_krw': 12300,
        'spent_on': '2026-10-22',
        'category': 'food',
    }
    assert card['needs_review'] is False

    kakao = parse_import_candidate(
        '카카오페이 결제\n15,900원\n배달의민족\n2026.10.22 12:30',
        'kakao',
        today=date(2026, 10, 22),
    )
    assert kakao['candidate']['title'] == '배달의민족'
    assert kakao['candidate']['amount_krw'] == 15900
    assert kakao['candidate']['category'] == 'food'

    receipt = parse_import_candidate(
        '이마트 천안점\n영수증\n2026-10-22 18:44\n합계 34,500원\n감사합니다',
        'ocr',
        today=date(2026, 10, 22),
    )
    assert receipt['candidate']['title'] == '이마트 천안점'
    assert receipt['candidate']['amount_krw'] == 34500
    assert receipt['candidate']['category'] == 'groceries'


def test_preview_marks_missing_fields_for_review(client):
    response = client.post(ROOT + '/imports/preview', headers=A, json={
        'raw_text': '어딘가에서 결제했습니다',
        'source': 'unknown',
    })
    assert response.status_code == 200
    body = response.json()
    assert body['candidate']['amount_krw'] is None
    assert body['needs_review'] is True
    assert body['warnings']


def test_confirm_blocks_duplicate_per_user_and_delete_allows_reimport(client):
    raw = '사용처: 다이소\n결제금액 8,000원\n2026-10-22 10:30'
    body = confirm_body(raw)

    first = client.post(ROOT + '/imports/confirm', headers=A, json=body)
    assert first.status_code == 201
    entry = first.json()
    assert entry['import_source'] == 'notification'
    assert entry['import_fingerprint']

    assert client.post(ROOT + '/imports/confirm', headers=A, json=body).status_code == 409
    assert client.post(ROOT + '/imports/confirm', headers=B, json=body).status_code == 201

    edited = {
        'title': '다이소 천안점',
        'amount_krw': 8000,
        'spent_on': '2026-10-22',
        'category': 'living',
    }
    response = client.put(ROOT + '/expenses/' + entry['id'], headers=A, json=edited)
    assert response.status_code == 200
    assert response.json()['import_fingerprint'] == entry['import_fingerprint']

    assert client.delete(ROOT + '/expenses/' + entry['id'], headers=A).status_code == 200
    assert client.post(ROOT + '/imports/confirm', headers=A, json=body).status_code == 201


def test_cumulative_amount_does_not_replace_purchase_amount():
    result = parse_import_candidate(
        '이마트\n2026-10-26\n누적 이용금액 320,000원\n이번 결제 12,000원',
        'notification', today=date(2026, 10, 26),
    )
    assert result['candidate']['amount_krw'] == 12000


def test_only_cumulative_or_conflicting_amounts_require_review():
    for text in [
        '이마트\n2026-10-26\n누적 이용금액 320,000원',
        '이마트\n2026-10-26\n12,000원\n15,000원',
        '이마트\n2026-10-26\n결제금액 12,000원\n승인금액 15,000원',
    ]:
        result = parse_import_candidate(text, 'notification')
        assert result['candidate']['amount_krw'] is None
        assert result['needs_review'] is True


def test_cancellation_preview_and_confirm_do_not_create_spending(client):
    for event in ['결제 취소', '승인취소', '승인 거절', '결제 실패', '환불 완료']:
        raw = f'사용처: 이마트\n2026-10-26\n{event} 12,000원'
        result = client.post(ROOT + '/imports/preview', headers=A,
                             json={'raw_text': raw, 'source': 'notification'})
        assert result.status_code == 200
        assert result.json()['needs_review'] is True
        assert result.json()['candidate']['amount_krw'] is None
        response = client.post(ROOT + '/imports/confirm', headers=A, json={
            'raw_text': raw, 'source': 'notification', 'title': '이마트',
            'amount_krw': 12000, 'spent_on': '2026-10-26', 'category': 'groceries',
        })
        assert response.status_code == 422
    assert client.get(ROOT + '?period=2026-10', headers=A).json()['expenses'] == []
