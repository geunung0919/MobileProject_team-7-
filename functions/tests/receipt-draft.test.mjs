import {test} from 'node:test';
import assert from 'node:assert/strict';
import {draftFromRecognition, reviewedPayload} from '../../UIUX/src/utils/sharedReceipt.mjs';

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
