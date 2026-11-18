// 실행: node --test auth/regions.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// regions.js 는 JSON import 를 쓰므로 데이터만 넣어 같은 코드를 실행합니다.
const json = readFileSync(new URL('./data/legalDong.json', import.meta.url), 'utf8');
const src = readFileSync(new URL('./regions.js', import.meta.url), 'utf8')
  .replace("import data from './data/legalDong.json';", `const data = ${json};`);
const R = await import('data:text/javascript,' + encodeURIComponent(src));
const E = await import('data:text/javascript,' + encodeURIComponent(readFileSync(new URL('./accountEvents.js', import.meta.url), 'utf8')));

test('지역 검색: 시도·시군구·동 단어로 찾고, 같은 동 이름은 전체 이름으로 구분', () => {
  const hits = R.searchRegions('마포구 서교동');
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].label, '서울특별시 마포구 서교동');
  assert.match(hits[0].code, /^\d{10}$/);
  const same = R.searchRegions('중앙동', 50);
  assert.ok(new Set(same.map((h) => h.label)).size === same.length && same.length > 1, '동명이 여러 지역');
  assert.deepEqual(R.searchRegions(''), []);
  assert.equal(R.regionInfo(hits[0].code).label, hits[0].label);
  assert.equal(R.regionInfo('0000000000'), null);
});

test('회원 이벤트: 등록·해제, 한 곳이 실패해도 나머지는 실행', async () => {
  const calls = [];
  const off1 = E.onAccountEvent('logout', async (p) => { calls.push('a:' + p.uid); });
  const off2 = E.onAccountEvent('logout', async () => { throw new Error('x'); });
  const warn = console.warn; console.warn = () => {};
  const r = await E.emitAccountEvent('logout', { uid: 'u1' });
  console.warn = warn;
  assert.deepEqual(calls, ['a:u1']);
  assert.deepEqual(r, { total: 2, failed: 1 });
  off1(); off2();
  assert.deepEqual(await E.emitAccountEvent('logout', { uid: 'u1' }), { total: 0, failed: 0 });
  assert.throws(() => E.onAccountEvent('nope', () => {}));
});
