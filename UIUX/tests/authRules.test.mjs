// 실행: node --test UIUX/tests  (Expo 없이 규칙만 확인)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/utils/authRules.js', import.meta.url), 'utf8');
const R = await import('data:text/javascript,' + encodeURIComponent(src));
const today = new Date(2026, 10, 12); // 2026-11-12

test('아이디: 영문 소문자로 시작, 영문·숫자·밑줄 4~20자, 대문자는 소문자로', () => {
  assert.equal(R.normalizeLoginId(' Hyun_98 ').id, 'hyun_98');
  for (const bad of ['', 'abc', '9abc', 'ab-cd', '한글아이디', 'a'.repeat(21)]) assert.equal(R.normalizeLoginId(bad).id, '', bad);
  assert.equal(R.loginIdToEmail('hyun_98'), 'hyun_98@users.jachwimate.app');
  assert.equal(R.emailToLoginId('hyun_98@users.jachwimate.app'), 'hyun_98');
  assert.equal(R.emailToLoginId('x@gmail.com'), null);
});

test('비밀번호 강도: 길이·글자 종류로 올라가고, 흔한 단어·아이디·반복은 낮아짐', () => {
  assert.equal(R.passwordStrength('').level, 'empty');
  assert.equal(R.passwordStrength('abc').level, 'weak');
  assert.equal(R.passwordStrength('abcdefgh').level, 'weak');
  assert.equal(R.passwordStrength('abcd1234').level, 'fair');
  assert.equal(R.passwordStrength('Abcd1234!').level, 'good');
  assert.equal(R.passwordStrength('Tofu-Rice-2026-Seoul').level, 'strong');
  assert.equal(R.passwordStrength('Password123!').level, 'weak');
  assert.equal(R.passwordStrength('hyundong!2026', 'hyundong').level, 'weak');
  assert.ok(R.passwordStrength('aaab1234').score < R.passwordStrength('abcd1234').score);
});

test('가입 가능한 비밀번호: 8자 이상, 공백 없음, 강도 보통 이상', () => {
  assert.match(R.validatePassword(''), /입력/);
  assert.match(R.validatePassword('ab12'), /8자 이상/);
  assert.match(R.validatePassword('abcd 1234'), /공백/);
  assert.match(R.validatePassword('abcdefgh'), /약해요/);
  assert.equal(R.validatePassword('abcd1234'), '');
  assert.match(R.validatePassword('a'.repeat(65) + '1'), /64자/);
});

test('생년월일: 형식·없는 날짜·미래·만 14세 미만 거르기', () => {
  assert.match(R.validateBirthDate('', today), /선택/);
  assert.match(R.validateBirthDate('2001-02-30', today), /없는 날짜/);
  assert.match(R.validateBirthDate('2027-01-01', today), /미래/);
  assert.match(R.validateBirthDate('2012-11-13', today), /만 14세/); // 내일이 14번째 생일
  assert.equal(R.validateBirthDate('2012-11-12', today), '');       // 오늘이 14번째 생일
  assert.equal(R.validateBirthDate('2000-01-01', today), '');
  assert.equal(R.ageOn('2000-11-13', today), 25);
});

test('로그인 실패 문구는 아이디·비밀번호 중 무엇이 틀렸는지 구분하지 않음', () => {
  const codes = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'];
  const messages = new Set(codes.map((c) => R.authErrorMessage(c).message));
  assert.equal(messages.size, 1);
  assert.equal(R.authErrorMessage('auth/email-already-in-use').field, 'loginId');
  assert.equal(R.authErrorMessage('auth/weak-password').field, 'password');
  assert.equal(R.authErrorMessage('something-else').field, 'form');
});
