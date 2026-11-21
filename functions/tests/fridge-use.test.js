/* eslint-disable require-jsdoc, max-len */
const test = require("node:test");
const assert = require("node:assert/strict");
const {useFridgeItem} = require("../modules/refrigerator/manualItems");
function fakeDb(seed) {
  const rows = new Map(Object.entries(seed));
  return {rows, doc: (path) => ({path}), runTransaction: async (fn) => {
    const writes = []; let writing = false;
    const result = await fn({
      get: async (ref) => {
        assert.equal(writing, false, "read before writes");
        return {exists: rows.has(ref.path), data: () => rows.get(ref.path)};
      },
      create: (ref, v) => {
        writing = true; assert.equal(rows.has(ref.path), false); writes.push(["set", ref.path, v]);
      },
      update: (ref, v) => {
        writing = true; writes.push(["set", ref.path, {...rows.get(ref.path), ...v}]);
      },
      delete: (ref) => {
        writing = true; writes.push(["del", ref.path]);
      },
    });
    for (const [op, path, v] of writes) op === "del" ? rows.delete(path) : rows.set(path, v);
    return result;
  }};
}
const item = () => ({"users/a/fridgeItems/i1": {name: "우유", quantity: 4, unit: "개", remainingCost: 1000, version: 3}});
const req = (o) => ({action: "cook", id: "i1", requestId: "r1", version: 3, ...o});
test("partial use reduces quantity and proportional cost, logs it", async () => {
  const db = fakeDb(item());
  const r = await useFridgeItem(db, "a", req({amount: 1}));
  assert.deepEqual([r.removed, r.cost, r.deleted, r.version], [1, 250, false, 4]);
  const row = db.rows.get("users/a/fridgeItems/i1");
  assert.deepEqual([row.quantity, row.remainingCost, row.version], [3, 750, 4]);
  assert.equal(db.rows.get("users/a/fridgeLogs/r1").type, "cook");
});
test("full discard deletes item and uses all remaining cost", async () => {
  const db = fakeDb(item());
  const r = await useFridgeItem(db, "a", req({action: "discard", reason: "상함"}));
  assert.deepEqual([r.removed, r.cost, r.deleted], [4, 1000, true]);
  assert.equal(db.rows.has("users/a/fridgeItems/i1"), false);
  assert.equal(db.rows.get("users/a/fridgeLogs/r1").reason, "상함");
});
test("retry is idempotent, changed payload conflicts, stale version/over-amount rejected", async () => {
  const db = fakeDb(item());
  await useFridgeItem(db, "a", req({amount: 1}));
  const again = await useFridgeItem(db, "a", req({amount: 1}));
  assert.equal(again.replayed, true);
  assert.equal(db.rows.get("users/a/fridgeItems/i1").quantity, 3);
  await assert.rejects(useFridgeItem(db, "a", req({amount: 2})), {status: 409});
  await assert.rejects(useFridgeItem(db, "a", req({requestId: "r2"})), {status: 409}); // 버전 불일치
  await assert.rejects(useFridgeItem(db, "a", req({requestId: "r3", version: 4, amount: 9})), {status: 422});
  await assert.rejects(useFridgeItem(db, "b", req()), {status: 404});
});
