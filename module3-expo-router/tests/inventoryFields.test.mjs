import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inventoryDraft, validateInventoryDraft, inventoryRecord } from '../src/domain/inventoryFields.mjs';
import { consume } from '../src/domain/inventory.mjs';
const today = '2026-10-08';
const draft = { name: ' 달걀 ', quantity: '3', unit: '개', purchasedAt: '2026-10-01', expiresAt: '2026-10-10', storageMethod: 'refrigerated', dateType: 'package' };
test('등록/수정 후 저장한 추가 항목과 기타 메타데이터 보존', () => {
  const saved = inventoryRecord(draft, 'egg', { custom: 'keep' });
  const reloaded = JSON.parse(JSON.stringify(saved));
  assert.equal(reloaded.name, '달걀');
  assert.equal(reloaded.quantity, 3);
  assert.equal(reloaded.custom, 'keep');
  assert.equal(inventoryDraft(reloaded).purchasedAt, draft.purchasedAt);
  assert.equal(inventoryDraft(reloaded).storageMethod, draft.storageMethod);
  assert.equal(inventoryDraft(reloaded).dateType, draft.dateType);
});
test('구매일 누락, 실제로 없는 날짜, 미래 구매일 거부', () => {
  for (const purchasedAt of ['', '2026-02-30', '2026-10-09'])
    assert.notEqual(validateInventoryDraft({ ...draft, purchasedAt }, today), '');
});
test('선택값 누락 및 지원하지 않는 선택값 거부', () => {
  for (const key of ['storageMethod', 'dateType'])
    for (const value of ['', 'unknown'])
      assert.notEqual(validateInventoryDraft({ ...draft, [key]: value }, today), '');
});
test('모든 보관 방법과 두 날짜 유형 저장 가능', () => {
  for (const storageMethod of ['refrigerated', 'frozen', 'room'])
    for (const dateType of ['package', 'reference'])
      assert.equal(validateInventoryDraft({ ...draft, storageMethod, dateType }, today), '');
});
test('오래된 재고는 없는 필드를 추측하지 않고 오늘 날짜도 주입하지 않음', () => {
  const old = { id: 'old', name: '밥', quantity: 1, unit: '공기', expiresAt: '2026-09-30' };
  const result = inventoryDraft(old, today);
  assert.equal(result.purchasedAt, '');
  assert.equal(result.storageMethod, '');
  assert.equal(result.dateType, '');
  assert.equal(result.expiresAt, old.expiresAt);
  assert.equal(inventoryDraft(undefined, today).purchasedAt, today);
});
test('기한 지난 재고 입력 허용, 날짜 유형 변경 시 기존 날짜 보존', () => {
  assert.equal(validateInventoryDraft({ ...draft, expiresAt: '2026-09-30', dateType: 'reference' }, today), '');
});
test('식사 차감 뒤에도 구매일/보관 방법/날짜 유형 보존', () => {
  const item = inventoryRecord(draft, 'egg');
  const result = consume([item], { ingredients: [{ name: '달걀', quantity: 1, unit: '개' }] }, today);
  assert.equal(result[0].quantity, 2);
  for (const key of ['purchasedAt', 'storageMethod', 'dateType']) assert.equal(result[0][key], draft[key]);
});
