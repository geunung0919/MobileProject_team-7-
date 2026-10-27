import test from 'node:test';
import assert from 'node:assert/strict';
import { onboardingBody, answerLabel } from '../src/lib/onboarding.js';
const fields = [
  { name: 'months', label: '기간', widget: 'integer', option_labels: {} },
  { name: 'tools', widget: 'multi_select', option_labels: { microwave: '전자레인지' }, empty_label: '도구 없음' },
  { name: 'inventory', widget: 'single_select', skip_value: 'not_entered', option_labels: {} },
];
const form = { steps: [{ fields }] };
test('단계별 입력 전송 시 0, 없음, 미입력을 구분한다', () => {
  assert.deepEqual(onboardingBody(form, { months: '0', tools: [] }), { months: 0, tools: [], inventory: 'not_entered' });
  assert.deepEqual(onboardingBody(form, {}), { months: null, tools: null, inventory: 'not_entered' });
});
test('숫자로 자동 변환되는 공백, 지수, 소수 입력을 거부한다', () => {
  for (const months of [' ', '1e2', '2.5', '-1']) assert.throws(() => onboardingBody(form, { months }));
});
test('확인 화면은 미입력과 도구 없음을 다른 문구로 표시한다', () => {
  assert.equal(answerLabel(fields[1], null), '나중에 입력');
  assert.equal(answerLabel(fields[1], []), '도구 없음');
  assert.equal(answerLabel(fields[1], ['microwave']), '전자레인지');
});

import { readFileSync } from 'node:fs';
import { stepErrors } from '../src/lib/onboarding.js';
const schema = JSON.parse(readFileSync(new URL('../../jachwi-core/schemas/Onboarding.json', import.meta.url), 'utf8'));
const validationForm = {
  input_schema: schema,
  steps: [{ fields: [
    { name: 'living_months', widget: 'integer' },
    { name: 'cooking_days_per_week', widget: 'integer' },
    { name: 'monthly_budget_krw', widget: 'integer' },
    { name: 'region_code', widget: 'region_search' },
  ] }],
};
test('실제 서버 스키마의 상한을 넘는 입력은 해당 항목에 오류를 반환한다', () => {
  const errors = stepErrors(validationForm, { living_months: '1201', cooking_days_per_week: '8', monthly_budget_krw: '1000000001' }, 0);
  assert.deepEqual(Object.keys(errors), ['living_months', 'cooking_days_per_week', 'monthly_budget_krw']);
});
test('서버 경계값과 선택 항목 건너뛰기를 허용한다', () => {
  assert.deepEqual(stepErrors(validationForm, { living_months: 1200, cooking_days_per_week: 7, monthly_budget_krw: 0, region_code: '1111010100' }, 0), {});
  assert.deepEqual(stepErrors(validationForm, { living_months: '', region_code: null }, 0), {});
});
test('전각 숫자와 잘못된 지역 코드, 소수를 거부한다', () => {
  for (const region_code of ['서울', '123', '１２３４５６７８９０']) assert.ok(stepErrors(validationForm, { region_code }, 0).region_code);
  assert.ok(stepErrors(validationForm, { cooking_days_per_week: '2.5' }, 0).cooking_days_per_week);
});
test('다른 단계의 오류 때문에 현재 단계 이동을 막지 않는다', () => {
  const form = { ...validationForm, steps: [{ fields: [{ name: 'living_months', widget: 'integer' }] }] };
  assert.deepEqual(stepErrors(form, { living_months: 1, cooking_days_per_week: 9 }, 0), {});
});

import { formErrors, serverFieldErrors, firstErrorStep, onboardingActionTarget } from '../src/lib/onboarding.js';
const choicesForm = { steps: [
  { fields: [{ name: 'priority', widget: 'single_select', option_labels: { save_money: '절약' } }] },
  { fields: [{ name: 'cooking_tools', widget: 'multi_select', option_labels: { microwave: '전자레인지' } }] },
] };
test('확인 단계는 이전 단계의 잘못된 선택과 중복 도구도 검증한다', () => {
  const errors = formErrors(choicesForm, { priority: 'old-value', cooking_tools: ['microwave', 'microwave'] });
  assert.deepEqual(Object.keys(errors), ['priority', 'cooking_tools']);
  assert.equal(firstErrorStep(choicesForm, errors), 0);
  assert.deepEqual(formErrors(choicesForm, { priority: null, cooking_tools: [] }), {});
  assert.ok(formErrors(choicesForm, { cooking_tools: 'microwave' }).cooking_tools);
});
test('서버의 배열 항목 오류를 입력칸에 연결하며 폼 밖 오류는 무시한다', () => {
  const errors = serverFieldErrors(choicesForm, { details: [
    { field: 'body.cooking_tools.0', message: '지원하지 않는 도구입니다.' },
    { field: 'body.cooking_tools.1', message: '다른 오류' },
    { field: 'body.user_id', message: '금지' },
  ] });
  assert.deepEqual(errors, { cooking_tools: '지원하지 않는 도구입니다.' });
  assert.equal(firstErrorStep(choicesForm, errors), 1);
  assert.equal(firstErrorStep(choicesForm, serverFieldErrors(choicesForm, new Error('연결 실패'))), -1);
});
test('재고 후속 행동은 실제 화면으로 매핑하고 미구현/외부 경로는 차단한다', () => {
  assert.equal(onboardingActionTarget({ target: '/inventory' }), '/fridge/inventory');
  assert.equal(onboardingActionTarget({ target: '/spending' }), '/spending');
  assert.equal(onboardingActionTarget({ target: '/routines' }), null);
  assert.equal(onboardingActionTarget({ target: 'https://example.com' }), null);
  assert.equal(onboardingActionTarget({ target: '__proto__' }), null);
});
