// 실행: node --test auth/onboardingRules.test.mjs auth/authRules.test.mjs  (Expo 없이 규칙만 확인)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = async (file) => import('data:text/javascript,' + encodeURIComponent(readFileSync(new URL(file, import.meta.url), 'utf8')));
const O = await load('./onboardingRules.js');
const N = await load('./nickname.js');

test('자취 기간: 1개월 미만/이상, 6개월 이상, 1년 이상 = 0/1/6/12, 6개월부터 경험자', () => {
  assert.deepEqual(O.LIVING_OPTIONS.map((o) => o.value), [0, 1, 6, 12]);
  assert.equal(O.livingLabel(0), '1개월 미만');
  assert.equal(O.livingLabel(9), '6개월 이상');
  assert.equal(O.livingLabel(null), '선택 안 함');
  assert.equal(O.diagnose({ living_months: 1 }).experience, 'new');
  assert.equal(O.diagnose({ living_months: 6 }).experience, 'experienced');
  assert.equal(O.diagnose({}).experience, 'unknown');
});

test('조리 도구: 없음([])과 선택 안 함(null)을 구분', () => {
  assert.equal(O.diagnose({ cooking_tools: [] }).cooking_environment, 'no_tools');
  assert.equal(O.diagnose({ cooking_tools: null }).cooking_environment, 'unknown');
  assert.equal(O.diagnose({ cooking_tools: ['microwave'] }).cooking_environment, 'microwave_only');
  assert.equal(O.toolsLabel([]), '없음');
  assert.equal(O.toolsLabel(['microwave', 'stove']), '전자레인지, 가스레인지·인덕션');
});

test('예산 입력: 숫자만, 상한, 만원 표시', () => {
  assert.equal(O.digitsOnly('1,000,000원'), 1000000);
  assert.equal(O.digitsOnly(''), null);
  assert.equal(O.digitsOnly('99999999999'), O.BUDGET_MAX);
  assert.equal(O.manwon(1000000), '100만원');
  assert.equal(O.budgetLabel(null), '선택 안 함');
});

test('추천: 고른 목표에 맞는 기능이 맨 위', () => {
  assert.equal(O.recommendations({ priority: 'reduce_waste' })[0].key, 'fridge');
  assert.equal(O.recommendations({ priority: 'build_routine' })[0].key, 'routine');
  assert.equal(O.recommendations({ priority: 'save_money', monthly_budget_krw: 1000000 })[0].desc, '100만원 예산으로 지출을 기록해요');
});

test('닉네임: 한글·영문·숫자 2~12자, 공백·특수문자 불가, 중복 키는 소문자', () => {
  assert.equal(N.normalizeNickname(' 자취생 ').nickname, '자취생');
  assert.equal(N.normalizeNickname('가'.repeat(12)).nickname, '가'.repeat(12));
  for (const bad of ['', '가', '가'.repeat(13), '자취 생', '자취생!']) assert.equal(N.normalizeNickname(bad).nickname, null, bad);
  assert.equal(N.nicknameKey('Mate'), 'mate');
});
