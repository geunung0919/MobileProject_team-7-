/* eslint-disable require-jsdoc, max-len */
const test = require("node:test");
const assert = require("node:assert/strict");
const {confirmReceipt, normalize} = require("../modules/finance/receipts");
const body = () => ({requestId: "request1", receiptId: "receipt1", title: "마트", amount: 5000, purchasedAt: "2026-01-01", items: [
  {receiptItemId: "milk", name: "우유", itemType: "ingredient", reviewStatus: "confirmed", inventorySelected: true,
    quantity: 2, unit: "팩", linePaidAmount: 3000, storageMethod: "refrigerated", dateType: "unknown", expiresAt: null},
  {receiptItemId: "juice", name: "사과주스", itemType: "other", reviewStatus: "confirmed", inventorySelected: false, linePaidAmount: 2000},
]});
function fakeDb() {
  const rows = new Map();
  let queue = Promise.resolve();
  return {rows, doc: (path) => ({path}), runTransaction(fn) {
    const run = queue.then(async () => {
      const writes = []; let writing = false;
      const result = await fn({get: async (ref) => {
        assert.equal(writing, false, "read before writes");
        return {exists: rows.has(ref.path), data: () => rows.get(ref.path)};
      }, create: (ref, value) => {
        writing = true; writes.push([ref.path, value]);
      }});
      for (const [path] of writes) assert.equal(rows.has(path), false);
      for (const [path, value] of writes) rows.set(path, value);
      return result;
    }); queue = run.catch(() => {}); return run;
  }};
}
test("consumption + only ingredients, original price preserved", async () => {
  const db = fakeDb(); const result = await confirmReceipt(db, "alice", body());
  assert.equal(result.inventoryIds.length, 1);
  assert.equal(db.rows.get(`users/alice/transactions/${result.expenseId}`).amount, 5000);
  const item = db.rows.get(`users/alice/fridgeItems/${result.inventoryIds[0]}`);
  assert.equal(item.remainingCost, 3000); assert.equal(item.unit, "팩"); assert.equal(item.quantity, 2);
  assert.equal(item.sourceReceiptItemId, "milk"); assert.equal(item.expiresAt, null);
});
test("concurrent retry and deletion cannot recreate stock", async () => {
  const db = fakeDb(); const [a, b] = await Promise.all([confirmReceipt(db, "a", body()), confirmReceipt(db, "a", body())]);
  assert.equal(b.replayed, true);
  db.rows.delete(`users/a/fridgeItems/${a.inventoryIds[0]}`);
  const c = await confirmReceipt(db, "a", {...body(), requestId: "retry"});
  assert.equal(c.replayed, true); assert.equal(db.rows.has(`users/a/fridgeItems/${a.inventoryIds[0]}`), false);
});
test("changed payload conflicts, UIDs are isolated", async () => {
  const db = fakeDb(); await confirmReceipt(db, "a", body());
  await assert.rejects(confirmReceipt(db, "a", {...body(), amount: 6000}), {status: 409});
  assert.equal((await confirmReceipt(db, "b", body())).replayed, false);
});
test("validation rejects unsafe or unreviewed inventory without writes", async () => {
  for (const patch of [{reviewStatus: "needs_review"}, {itemType: "other"}, {quantity: -1}, {unit: "병"},
    {linePaidAmount: -1}, {storageMethod: ""}, {dateType: "package", expiresAt: "2026-02-30"}]) {
    const db = fakeDb(); const input = body(); Object.assign(input.items[0], patch);
    await assert.rejects(confirmReceipt(db, "a", input)); assert.equal(db.rows.size, 0);
  }
  assert.throws(() => normalize({...body(), amount: 1000}));
  assert.throws(() => normalize({...body(), receiptId: "../bad"}));
});
