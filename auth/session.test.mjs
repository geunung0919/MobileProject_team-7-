// 실행: node --test auth/session.test.mjs   (보안 저장소·최근 계정 로직을 가짜 저장소로 확인)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Expo 없이 node 로 실행하려고 순수 로직 파일을 임시 폴더에 .mjs 로 복사해 불러옵니다.
const dir = mkdtempSync(join(tmpdir(), 'auth-test-'));
for (const f of ['authRules', 'secureSessionCore', 'recentAccountCore']) {
  const src = readFileSync(new URL(`./${f}.js`, import.meta.url), 'utf8').replace(/from '\.\/(\w+)'/g, "from './$1.mjs'");
  writeFileSync(join(dir, `${f}.mjs`), src);
}
const S = await import(pathToFileURL(join(dir, 'secureSessionCore.mjs')));
const RA = await import(pathToFileURL(join(dir, 'recentAccountCore.mjs')));
const R = await import(pathToFileURL(join(dir, 'authRules.mjs')));

const fakeSecure = (limit = 2048) => {
  const m = new Map();
  return {
    m,
    getItemAsync: async (k) => (m.has(k) ? m.get(k) : null),
    setItemAsync: async (k, v) => {
      if (!/^[A-Za-z0-9._-]+$/.test(k)) throw new Error('invalid key ' + k);
      if (Buffer.byteLength(v) > limit) throw new Error('too large');
      m.set(k, v);
    },
    deleteItemAsync: async (k) => { m.delete(k); },
  };
};
const fakeAsync = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { m, getItem: async (k) => (m.has(k) ? m.get(k) : null), setItem: async (k, v) => { m.set(k, v); }, removeItem: async (k) => { m.delete(k); } };
};
const KEY = 'firebase:authUser:AIzaFAKE:[DEFAULT]';

test('AC-02 보안 저장소: 특수문자 키, 2KB 넘는 값은 나눠 저장하고 그대로 복원', async () => {
  const secure = fakeSecure();
  const store = S.createSecureSessionStorage({ secure });
  const big = JSON.stringify({ uid: 'u1', displayName: '자취생'.repeat(300), token: 'x'.repeat(3000) });
  await store.setItem(KEY, big);
  assert.equal(await store.getItem(KEY), big);
  assert.ok([...secure.m.keys()].every((k) => /^[A-Za-z0-9._-]+$/.test(k)));
  await store.setItem(KEY, 'short');                     // 더 짧은 값으로 바꾸면 남는 조각이 없어야 함
  assert.equal(await store.getItem(KEY), 'short');
  assert.equal(secure.m.size, 2);
  await store.removeItem(KEY);
  assert.equal(await store.getItem(KEY), null);
  assert.equal(secure.m.size, 0);
});

test('AC-02 예전 일반 저장소의 로그인 정보는 보안 저장소로 옮기고 지움', async () => {
  const secure = fakeSecure();
  const legacy = fakeAsync({ [KEY]: '{"uid":"u1"}' });
  const store = S.createSecureSessionStorage({ secure, legacy });
  assert.equal(await store.getItem(KEY), '{"uid":"u1"}');
  assert.equal(legacy.m.size, 0);
  assert.equal(await store.getItem(KEY), '{"uid":"u1"}');
});

test('AC-02 조각이 빠진 값은 읽지 않음 (다시 로그인)', async () => {
  const secure = fakeSecure();
  const store = S.createSecureSessionStorage({ secure });
  await store.setItem(KEY, 'a'.repeat(1500));
  secure.m.delete(S.secureKey(KEY) + '.1');
  assert.equal(await store.getItem(KEY), null);
});

test('AC-04 이메일 가리기', () => {
  assert.equal(R.maskEmail('Hyundong@Example.com'), 'hy******@ex*****.com');
  assert.equal(R.maskEmail('ab@c.kr'), 'a*@c*.kr');
  assert.equal(R.maskEmail('nope'), '');
});

test('AC-04 최근 계정: 기본은 기억 안 함, 켜야 가린 이메일만 저장, 끄면 기록 삭제', async () => {
  const storage = fakeAsync();
  const ra = RA.createRecentAccountStore(storage, () => '2026-11-17T00:00:00Z');
  assert.equal((await ra.recordLogin('hyundong@example.com')).maskedEmail, null);
  await ra.setRemember(true);
  const saved = await ra.recordLogin('hyundong@example.com');
  assert.deepEqual(saved, { remember: true, maskedEmail: 'hy******@ex*****.com', savedAt: '2026-11-17T00:00:00Z' });
  assert.ok(!storage.m.get(RA.RECENT_KEY).includes('hyundong@'), '전체 이메일은 저장하지 않음');
  assert.deepEqual(await ra.clear(), { remember: true, maskedEmail: null, savedAt: null });
  await ra.recordLogin('hyundong@example.com');
  assert.deepEqual(await ra.setRemember(false), { remember: false, maskedEmail: null, savedAt: null });
  storage.m.set(RA.RECENT_KEY, '{broken');
  assert.equal((await ra.read()).remember, false, '깨진 기록은 무시');
});
