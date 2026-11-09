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

test('keeps plain milk and fruit separate from similarly named drinks and snacks', () => {
  const names = [
    '서울우유 1L', '매일 우유 900 mL', '사과 1kg/박스', '산딸기 500g/박스',
    '사과주스 1L', '사과 주스 1 L', '서울우유 사과주스 1L', '딸기우유 200ml',
    '사과 음료 500ml', '사과칩 100g', '사과맛 캔디 80g', '우유맛 과자 100g',
    '서울우유 딸기 200ml', '감자칩 80g', '사과 세제 500ml',
  ];
  const text = names.map((name, i) => `${i + 1} ${name} 3,000 1 3,000`).join('\n');
  assert.deepEqual(receiptIngredients(text).map(item => item.name), names.slice(0, 4));
});

test('reads unnumbered e-receipt products and barcode continuation without importing discounts', () => {
  const text = [
    '+ 오이맛고추 (팩) 1,980 1 1,980', '2500000014567',
    '반숙계란 20구(팩) 9,480 1 9,480', '8801496106786',
    '(03) 그릴드닭가슴살 140g', '880914894309 2.900 1 2,900',
    '-행사 할인 -900', '04 닭가슴살 도시락 4,500 1 4,500',
    '05 삼립 단팥우유호빵 8,980 1 8,980',
    '06 혼합과자 18,900 1 18,900',
    '07 대파 500g', '합계 92,000',
    '8809123456 6,000 1 6,000',
  ].join('\n');
  assert.deepEqual(receiptIngredients(text).map(item => item.name), [
    '오이맛고추 (팩)', '반숙계란 20구(팩)', '그릴드닭가슴살 140g',
  ]);
});
