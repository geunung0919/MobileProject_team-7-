// 실행: cd functions && node --test tests/core-account.test.js
// Firestore 대신 메모리 가짜 DB 로 1번 모듈(회원) 규칙만 확인.
const {test} = require("node:test");
const assert = require("node:assert/strict");
const {getProfile, saveProfile} = require("../modules/core/profile");
const {cleanupUserData} = require("../modules/core/accountCleanup");
const {normalizeNickname} = require("../modules/core/nickname");

const fakeDb = () => {
  const docs = new Map();
  const snap = (path) => ({
    exists: docs.has(path),
    id: path.split("/").pop(),
    data: () => docs.get(path),
    ref: {path, delete: async () => docs.delete(path)},
  });
  const merged = (path, data, opt) =>
    opt && opt.merge ? {...(docs.get(path) || {}), ...data} : data;
  const topLevel = (name, field, value) => [...docs.keys()].filter((p) =>
    p.startsWith(`${name}/`) && p.split("/").length === 2 &&
    docs.get(p)[field] === value);
  const ref = (path) => ({
    path,
    get: async () => snap(path),
    set: async (data, opt) => docs.set(path, merged(path, data, opt)),
    delete: async () => docs.delete(path),
  });
  const collection = (name) => ({
    doc: (id) => ref(`${name}/${id}`),
    where: (field, op, value) => ({
      get: async () => ({docs: topLevel(name, field, value).map(snap)}),
    }),
  });
  return {
    docs,
    collection,
    runTransaction: async (fn) => {
      const writes = [];
      await fn({
        get: async (r) => snap(r.path),
        set: (r, data, opt) => writes.push(() => r.set(data, opt)),
        delete: (r) => writes.push(() => r.delete()),
      });
      for (const w of writes) await w();
    },
    recursiveDelete: async (r) => {
      for (const p of [...docs.keys()]) {
        if (p === r.path || p.startsWith(`${r.path}/`)) docs.delete(p);
      }
    },
  };
};

test("닉네임 규칙: 앱과 같은 2~12자, 한글·영문·숫자", () => {
  assert.equal(normalizeNickname(" 자취생 ").nickname, "자취생");
  const bads = ["", "가", "가".repeat(13), "자취 생", "자취생!", null];
  for (const bad of bads) {
    assert.equal(normalizeNickname(bad).nickname, null, String(bad));
  }
});

test("닉네임 저장: member·선점 문서, 바꾸면 예전 선점 삭제", async () => {
  const db = fakeDb();
  db.docs.set("users/u1",
      {account: {login_id: "hyun"}, profile: {living_months: 1}});
  const p = await saveProfile("u1", null, "자취생", db);
  assert.equal(p.nickname, "자취생");
  assert.equal(p.profile.living_months, 1, "기존 생활 정보 유지");
  assert.deepEqual(db.docs.get("nicknames/자취생"), {uid: "u1"});
  await saveProfile("u1", null, "Mate", db);
  assert.ok(!db.docs.has("nicknames/자취생"));
  assert.deepEqual(db.docs.get("nicknames/mate"), {uid: "u1"});
});

test("닉네임: 규칙 위반 invalid, 남이 쓰면 taken(대소문자 무시)", async () => {
  const db = fakeDb();
  await saveProfile("u1", null, "Mate", db);
  await assert.rejects(saveProfile("u2", null, "자취 생", db),
      {code: "nickname/invalid"});
  await assert.rejects(saveProfile("u2", null, "MATE", db),
      {code: "nickname/taken"});
  assert.equal(await getProfile("u2", db), null);
});

test("탈퇴 정리: users/{uid}·하위 데이터·본인 닉네임만 삭제", async () => {
  const db = fakeDb();
  await saveProfile("u1", null, "자취생", db);
  await saveProfile("u2", null, "옆사람", db);
  db.docs.set("users/u1/transactions/t1", {amount: 5000});
  db.docs.set("users/u1/receipts/r1/items/i1", {name: "두부"});
  db.docs.set("users/u1/fridgeItems/f1", {name: "우유"});
  const result = await cleanupUserData("u1", db);
  assert.equal(result.nicknamesDeleted, 1);
  assert.deepEqual([...db.docs.keys()].sort(),
      ["nicknames/옆사람", "users/u2"]);
  await cleanupUserData("u1", db); // 다시 실행해도 안전
});
