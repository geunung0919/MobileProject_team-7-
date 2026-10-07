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
