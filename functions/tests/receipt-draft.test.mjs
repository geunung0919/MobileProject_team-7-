import {test} from 'node:test';
import assert from 'node:assert/strict';
import {draftFromRecognition, emptyLine, reviewedPayload} from '../../UIUX/src/utils/sharedReceipt.mjs';

test('OCR prices and pack count are not promoted to paid amount or stock', () => {
  const draft = draftFromRecognition({
    candidate: {title: '마트', spent_on: '2026-01-01', amount_krw: 5000},
    receipt_document: {allow_inventory: true}, fingerprint: '1234567890abcdef',
    receipt_items: [{raw_name: '우유 1L', normalized_name: '우유', item_type: 'ingredient', quantity: 2, item_amount_krw: 3000}],
  });
  assert.equal(draft.items[0].printedAmount, 3000);
  assert.equal(reviewedPayload(draft).items[0].linePaidAmount, null);
  assert.equal(reviewedPayload(draft).items[0].inventorySelected, false);
  assert.equal(draft.receiptId, 'ocr-1234567890abcdef');
  draft.items[0].inventorySelected = true;
  assert.throws(() => reviewedPayload(draft), /실제 재고 수량/);
});

test('multiple receipts and inferred purchase date require correction', () => {
  assert.throws(() => draftFromRecognition({receipt_document_issues: ['multiple_receipts_suspected']}), /한 장/);
  const draft = draftFromRecognition({candidate: {title: '마트', spent_on: '2026-01-01', amount_krw: 1000}, warnings: ['날짜가 없어 오늘 날짜로 채웠어요.']});
  assert.throws(() => reviewedPayload(draft), /실제 구매일/);
});

test('expiry selected for the fridge cannot be earlier than purchase date', () => {
  const draft = {
    title: '마트', purchasedAt: '2026-01-01', total: '1000', receiptId: 'expiry-check',
    items: [{ ...emptyLine('rice'), name: '쌀', itemType: 'ingredient', inventorySelected: true,
      quantity: '1', unit: '팩', storageMethod: 'room', dateType: 'package', expiresAt: '2025-12-31' }],
  };
  assert.throws(() => reviewedPayload(draft), /구매일보다 빠를 수 없어요/);
});

test('냉장고 등록을 고르면 단위(개)·보관(냉장)만 미리 채우고, 수량은 사용자가 입력해야 저장된다', async () => {
  const { draftFromRecognition, inventoryDefaults } = await import('../../UIUX/src/utils/sharedReceipt.mjs');
  const draft = draftFromRecognition({ candidate: { title: '마트', amount_krw: 3000, spent_on: '2026-11-18' },
    receipt_items: [{ raw_name: '우유', normalized_name: '우유', quantity: 2, item_type: 'ingredient', item_amount_krw: 3000 }] });
  const [milk] = draft.items;
  assert.deepEqual(inventoryDefaults(milk), { unit: '개', storageMethod: 'refrigerated' });
  assert.deepEqual(inventoryDefaults({ ...milk, unit: 'ml', storageMethod: 'frozen' }), { unit: 'ml', storageMethod: 'frozen' });
  const selected = { ...milk, inventorySelected: true, ...inventoryDefaults(milk) };
  assert.throws(() => reviewedPayload({ ...draft, receiptId: 'r1', items: [selected] }), /실제 재고 수량/);
  const payload = reviewedPayload({ ...draft, receiptId: 'r1', items: [{ ...selected, quantity: '1' }] });
  assert.deepEqual([payload.items[0].quantity, payload.items[0].unit, payload.items[0].storageMethod], [1, '개', 'refrigerated']);
});

test('OCR 서버 주소는 같은 Wi-Fi(사설 IP)로 연 경우에만 자동으로 정하고, 터널 주소는 쓰지 않는다', async () => {
  const { ocrBaseForHost, isTunnelHost, isLanHost } = await import('../../api/ocrHost.mjs');
  assert.equal(ocrBaseForHost('192.168.0.15'), 'http://192.168.0.15:8000');
  assert.equal(ocrBaseForHost('10.0.0.7', '9000'), 'http://10.0.0.7:9000');
  assert.equal(ocrBaseForHost('172.20.1.2'), 'http://172.20.1.2:8000');
  assert.equal(ocrBaseForHost('localhost'), 'http://localhost:8000');
  for (const host of ['mwwt9cy-anonymous-8081.exp.direct', 'abc.ngrok-free.app', 'example.com', '8.8.8.8', '172.32.0.1', '', undefined]) {
    assert.equal(ocrBaseForHost(host), '', host);
  }
  assert.equal(isTunnelHost('mwwt9cy-anonymous-8081.exp.direct'), true);
  assert.equal(isTunnelHost('192.168.0.15'), false);
  assert.equal(isLanHost('192.168.0.15.evil.com'), false);
});
