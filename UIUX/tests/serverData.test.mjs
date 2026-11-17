// 서버 데이터 <-> 화면 데이터 변환 테스트. 실행: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// serverData.js 는 import 가 없는 ES 모듈이라 그대로 불러올 수 있습니다.
const source = readFileSync(new URL('../src/lib/serverData.js', import.meta.url), 'utf8');
const m = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('지출: 화면 카테고리·아이콘·품목이 서버를 거쳐도 그대로', () => {
  const t = { id: 'x', title: '스타벅스', amount: 5500, date: '2026-11-17', category: '카페·간식', icon: 'coffee-outline',
    items: [{ id: 'n1', name: '라떼', unitPrice: 5500, quantity: 1, inFridge: false }] };
  const input = m.transactionToExpenseInput(t);
  assert.equal(input.category, 'food');
  const back = m.expenseToTransaction({ id: 'x', ...input, amount_krw: input.amount_krw, spent_on: input.spent_on });
  assert.deepEqual(back, t);
});

test('지출: 예전 앱(mobile/)에서 저장한 영수증 지출도 화면 형식으로', () => {
  const t = m.expenseToTransaction({ id: 'e1', title: '마트', amount_krw: 3000, spent_on: '2026-11-01', category: 'groceries',
    import_source: 'ocr', receipt_items: [{ raw_name: '우유', normalized_name: '우유', quantity: 2, item_amount_krw: 3000, is_ingredient: true }] });
  assert.equal(t.category, '식품');
  assert.equal(t.source, 'receipt');
  assert.deepEqual(t.items, [{ id: 'e1-0', name: '우유', unitPrice: 1500, quantity: 2, inFridge: true }]);
});

test('영수증: 분석 결과 -> 결과 화면 -> 저장 입력 (OCR 원문 정보 유지)', () => {
  const analysis = {
    raw_text: '이마트\n2026-11-15 18:20\n...', candidate: { title: '이마트', amount_krw: 5980, spent_on: '2026-11-15' },
    receipt_items: [
      { raw_name: '서울우유1L', normalized_name: '우유', quantity: 1, item_amount_krw: 2980, unit_price_krw: 2980, product_code: '880',
        item_type: 'ingredient', is_ingredient: true, suggested_for_inventory: true, match_method: 'dataset', ingredient_confidence: 0.9 },
      { raw_name: '봉투', normalized_name: '상품명 확인 필요', quantity: 1, item_amount_krw: 100, item_type: 'living' },
    ],
    warnings: ['흐림'],
  };
  const r = m.receiptFromAnalysis(analysis, '2026-11-17');
  assert.equal(r.time, '18:20');
  assert.deepEqual(r.items.map((i) => [i.id, i.name, i.inFridge]), [['ocr-0', '우유', true], ['ocr-1', '봉투', false]]);
  const body = m.receiptConfirmInput({ title: '이마트', amount: 5980, date: '2026-11-15', category: '식품', items: r.items }, r.ocr);
  assert.equal(body.source, 'ocr');
  assert.equal(body.meta.source, 'receipt');
  assert.equal(body.receipt_items[0].raw_name, '서울우유1L');
  assert.equal(body.receipt_items[0].product_code, '880');
  assert.equal(body.receipt_items[1].item_type, 'living');
  assert.equal(body.receipt_items[1].is_ingredient, false);
});

test('영수증: 냉장고 보관이 막힌 문서면 식재료 체크를 끔', () => {
  const r = m.receiptFromAnalysis({ raw_text: 'x', candidate: {}, receipt_document: { allow_inventory: false },
    receipt_items: [{ raw_name: '김밥', is_ingredient: true, suggested_for_inventory: true, quantity: 1 }] });
  assert.equal(r.items[0].inFridge, false);
});

test('냉장고: 서버가 모르는 단위도 화면 단위 그대로 왕복', () => {
  const items = [
    { id: 'a', name: '두부', quantity: '1모 · 300g', amount: 1, unit: '모', detail: '300g', purchaseDate: '2026-11-17', expiry: '2026-11-20', icon: 'cube-outline' },
    { id: 'b', name: '쌀', quantity: '4kg', amount: 4, unit: 'kg', purchaseDate: null, expiry: '2027-01-01', icon: 'food-variant' },
  ];
  const server = items.map(m.fridgeToServerItem);
  assert.deepEqual(server.map((s) => [s.unit, s.quantity]), [['pack', 1], ['g', 4000]]);
  assert.deepEqual(server.map((s) => m.serverItemToFridge(s)), items);
});
