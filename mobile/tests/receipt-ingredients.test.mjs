import test from 'node:test';
import assert from 'node:assert/strict';
import { receiptIngredients } from '../src/features/fridge/domain/receiptIngredients.mjs';
import { emptyState, importExpense, parseState } from '../src/features/fridge/domain/store.mjs';

test('mixed receipt only registers supported ingredients with consistent quantity', () => {
  const items = receiptIngredients('01 국산콩 두부 300g 1,800 2 3,600\n02 세제 5,000 1 5,000\n03 우유 1,500 2 1,500\n04 사과 주스 3,000 1 3,000\n합계 14,600');
  assert.deepEqual(items.map(({name, quantity}) => [name, quantity]), [['국산콩 두부 300g', 2]]);
  const state = importExpense(emptyState(), {id: 'receipt', import_source: 'ocr', category: 'living'}, items);
  assert.equal(parseState(JSON.stringify(state)).inventory[0].dateType, 'unknown');
});

test('totals and unrecognized rows do not create inventory', () => {
  assert.deepEqual(receiptIngredients('결제대상금액 73,550\n01 쇼핑백 500 1 500\n02 사과 3,000'), []);
});
