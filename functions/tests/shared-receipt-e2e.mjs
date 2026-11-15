// Run only against local Auth + Firestore emulators; calls the real Functions HTTP handler locally with the demo project.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { emptyLine, reviewedPayload } from '../../UIUX/src/utils/sharedReceipt.mjs';

const project = 'demo-shared-receipts';
assert.equal(process.env.GCLOUD_PROJECT, project);
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
const require = createRequire(import.meta.url);
const express = require('express');
const { api } = require('../index.js');
const app = express();
app.use(express.json());
app.use(api);
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
async function signUp() {
  const result = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `${randomUUID()}@example.test`, password: randomUUID(), returnSecureToken: true }),
  });
  assert.equal(result.status, 200);
  return (await result.json()).idToken;
}
async function req(path, token, body) {
  const response = await fetch(`${base}${path}`, {
    method: body ? 'POST' : 'GET', signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return [response.status, await response.json()];
}
try {
  const [token, other] = await Promise.all([signUp(), signUp()]);
  const payload = reviewedPayload({ receiptId: randomUUID(), title: '테스트마트', purchasedAt: '2026-01-01', total: '5000', items: [
    { ...emptyLine('milk'), name: '우유', itemType: 'ingredient', inventorySelected: true, quantity: '2', unit: '팩', storageMethod: 'refrigerated', paid: '3000' },
    { ...emptyLine('juice'), name: '사과주스', itemType: 'other', paid: '2000' },
  ] });
  const path = '/finance/receipts/confirm';
  assert.equal((await req(path, null, payload))[0], 401);
  assert.equal((await req(path, token, { ...payload, items: payload.items.map((item) => ({ ...item, inventorySelected: true })) }))[0], 422);
  const results = await Promise.all([req(path, token, payload), req(path, token, payload)]);
  assert.deepEqual(results.map(([status]) => status).sort(), [200, 201], JSON.stringify(results));
  assert.equal(results[0][1].expenseId, results[1][1].expenseId);
  assert.equal((await req(path, token, { ...payload, amount: 6000 }))[0], 409);
  const [expenses, items, otherItems] = await Promise.all([req('/finance/transactions', token), req('/refrigerator/items', token), req('/refrigerator/items', other)]);
  for (const [status] of [expenses, items, otherItems]) assert.equal(status, 200);
  assert.equal(expenses[1].items.length, 1);
  assert.equal(expenses[1].items[0].amount, 5000);
  assert.equal(items[1].items.length, 1);
  assert.equal(items[1].items[0].name, '우유');
  assert.equal(items[1].items[0].sourceExpenseId, expenses[1].items[0].id);
  assert.equal(otherItems[1].items.length, 0);
  console.log('Auth → Functions → Firestore: authenticated save, replay, validation and UID isolation passed.');
} finally {
  server.closeAllConnections();
  server.close();
}
