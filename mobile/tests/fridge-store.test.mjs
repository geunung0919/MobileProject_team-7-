import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, emptyState, importExpense, parseState, storageKey } from '../src/features/fridge/domain/store.mjs';
const expense = { id: 'purchase1', category: 'groceries' };
const item = { name: '달걀', quantity: 6, unit: '개', expiresAt: '2026-12-01' };
const memory = () => { const data = new Map(); return { getItem: async k => data.get(k) ?? null, setItem: async (k, v) => { data.set(k, v); } }; };

test('confirmed batch imports once, even after consumption or deletion', () => {
  const original = emptyState();
  const result = importExpense(original, expense, [item, { ...item, name: '밥', unit: '공기' }]);
  assert.equal(result.inventory.length, 2);
  assert.equal(original.inventory.length, 0);
  assert.equal(result.inventory[0].sourceExpenseId, expense.id);
  assert.throws(() => importExpense({ ...result, inventory: [] }, expense, [item]), /이미/);
  assert.throws(() => importExpense(original, { ...expense, category: 'food' }, [item]), /식재료/);
  assert.throws(() => importExpense(original, expense, [{ ...item, expiresAt: '2026-02-30' }]), /소비기한/);
  assert.throws(() => importExpense(original, expense, [{ ...item, quantity: Infinity }]), /소비기한/);
});

test('persisted data is isolated by server and authenticated user, starts empty', async () => {
  const disk = memory();
  const key = storageKey('https://server-a.test', 'user-a');
  const first = createStore(disk, key);
  await first.load();
  assert.deepEqual(first.getState(), emptyState());
  await first.update(s => importExpense(s, expense, [item]));
  const reopened = createStore(disk, key);
  assert.equal((await reopened.load()).inventory.length, 1);
  for (const otherKey of [storageKey('https://server-a.test', 'user-b'), storageKey('https://server-b.test', 'user-a')]) {
    assert.equal((await createStore(disk, otherKey).load()).inventory.length, 0);
  }
  assert.throws(() => storageKey('https://server-a.test', undefined));
});

test('concurrent duplicate imports serialize; only one succeeds', async () => {
  const store = createStore(memory(), 'test');
  const results = await Promise.allSettled([store.update(s => importExpense(s, expense, [item])), store.update(s => importExpense(s, expense, [item]))]);
  assert.deepEqual(results.map(r => r.status), ['fulfilled', 'rejected']);
  assert.equal(store.getState().inventory.length, 1);
});

test('failed writes do not change memory or mark imports done, and retry works', async () => {
  const disk = memory(); const persist = disk.setItem; let fail = true;
  disk.setItem = async (...args) => { if (fail) throw new Error('disk full'); return persist(...args); };
  const store = createStore(disk, 'test');
  await assert.rejects(store.update(s => importExpense(s, expense, [item])), /disk full/);
  assert.deepEqual(store.getState(), emptyState());
  fail = false;
  await store.update(s => importExpense(s, expense, [item]));
  assert.equal((await createStore(disk, 'test').load()).inventory.length, 1);
});

test('corrupt persisted data is not silently replaced', async () => {
  assert.throws(() => parseState('{bad'));
  assert.throws(() => parseState(JSON.stringify({ ...emptyState(), inventory: [{}] })));
  let writes = 0;
  const store = createStore({ getItem: async () => '{}', setItem: async () => { writes++; } }, 'test');
  await assert.rejects(store.update(s => importExpense(s, expense, [item])));
  assert.equal(writes, 0);
});
