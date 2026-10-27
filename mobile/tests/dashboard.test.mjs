import test from 'node:test';
import assert from 'node:assert/strict';
import { moduleSummary, cardRoute } from '../src/lib/dashboard.js';

test('미수신과 확인된 빈 재고를 구분한다', () => {
  assert.match(moduleSummary({ module_status: { inventory: 'missing' }, modules: { inventory: null } }, 'inventory'), /데이터가 없/);
  assert.match(moduleSummary({ module_status: { inventory: 'available' }, modules: { inventory: { data: { items: [] } } } }, 'inventory'), /0종/);
});
test('오래된 소비 금액을 현재 요약으로 표시하지 않는다', () => {
  const view = { module_status: { spending: 'stale' }, modules: { spending: { data: { spent_krw: 999, remaining_krw: 1 } } } };
  assert.match(moduleSummary(view, 'spending'), /오래된/);
  assert.doesNotMatch(moduleSummary(view, 'spending'), /999/);
});
test('미구현 또는 외부 주소로 이동하지 않는다', () => {
  for (const target of ['/inventory/x', '/routines', 'https://example.com', null]) assert.equal(cardRoute(target), null);
  assert.equal(cardRoute('/spending'), '/spending');
});
