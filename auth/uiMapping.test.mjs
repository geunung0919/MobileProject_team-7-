// 실행: node --test auth/uiMapping.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const M = await import('data:text/javascript,' + encodeURIComponent(readFileSync(new URL('./uiMapping.js', import.meta.url), 'utf8')));

test('UIUX-Edit 화면 값 → 저장 형식', () => {
  assert.deepEqual(M.toProfile({ period: '6m', goal: 'food', tools: ['microwave', 'gas'], cookDays: 2, budget: 1000000, region: ' 서울시 마포구 ' }), {
    living_months: 6, priority: 'reduce_waste', cooking_tools: ['microwave', 'stove'], cooking_days_per_week: 2,
    monthly_budget_krw: 1000000, region_name: '서울시 마포구', region_code: null,
  });
  assert.deepEqual(M.toProfile({ tools: ['none'] }), { cooking_tools: [] });
  assert.deepEqual(M.toProfile({ tools: [] }), { cooking_tools: null });
  assert.deepEqual(M.toProfile({ period: '1y', budget: '1,500,000', region: '' }), { living_months: 12, monthly_budget_krw: 1500000, region_name: null, region_code: null });
  assert.deepEqual(M.toProfile({ cookDays: 9 }), { cooking_days_per_week: 7 });
});

test('저장 형식 → 화면 값, 왕복해도 같은 값', () => {
  const ui = { period: '1m', goal: 'habit', tools: ['cooker', 'airfryer'], cookDays: 0, budget: 700000, region: '부산 해운대구' };
  assert.deepEqual(M.fromProfile(M.toProfile(ui)), ui);
  assert.deepEqual(M.fromProfile({ cooking_tools: [], living_months: 9 }).tools, ['none']);
  assert.equal(M.fromProfile({ living_months: 9 }).period, '6m');
  const fb = { period: '1m', goal: 'saving', tools: ['microwave'], cookDays: 2, budget: 500000, region: '' };
  assert.deepEqual(M.fromProfile(null, fb), fb);
});
