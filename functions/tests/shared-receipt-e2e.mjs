// Run only against local Auth + Firestore emulators; calls the real Functions HTTP handler locally with the demo project.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { emptyLine, reviewedPayload, draftFromPayment } from '../../UIUX/src/utils/sharedReceipt.mjs';

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
  const expired = { ...payload, items: payload.items.map((item) => item.inventorySelected ?
    { ...item, dateType: 'package', expiresAt: '2025-12-31' } : item) };
  assert.equal((await req(path, token, expired))[0], 422);
  assert.deepEqual((await req('/finance/transactions', token))[1].items, []);
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
  const manual = reviewedPayload({
    receiptId: randomUUID(), title: '직접 입력', purchasedAt: '2026-01-01', total: '4200', items: [], source: 'manual',
  });
  const spendPath = '/finance/transactions';
  assert.equal((await req(spendPath, null, manual))[0], 401);
  const [manualStatus, savedManual] = await req(spendPath, token, manual);
  assert.equal(manualStatus, 201, JSON.stringify(savedManual));
  assert.deepEqual(await req(spendPath, token, manual), [200, { ...savedManual, replayed: true }]);
  const manualRow = (await req(spendPath, token))[1].items.find(({ id }) => id === savedManual.expenseId);
  assert.deepEqual([manualRow.source, manualRow.amount], ['manual', 4200]);
  assert.deepEqual((await req(spendPath, other))[1].items, []);

  const fridgePath = '/refrigerator/items';
  const direct = { requestId: randomUUID(), name: '쌀', quantity: 2, unit: 'kg', purchasedAt: null,
    storageMethod: 'room', dateType: 'unknown', expiresAt: null };
  assert.equal((await req(fridgePath, null, direct))[0], 401);
  assert.equal((await req(fridgePath, token, { ...direct, quantity: -1 }))[0], 422);
  const directWrites = await Promise.all([req(fridgePath, token, direct), req(fridgePath, token, direct)]);
  assert.deepEqual(directWrites.map(([status]) => status).sort(), [200, 201], JSON.stringify(directWrites));
  assert.equal(directWrites[0][1].id, directWrites[1][1].id);
  assert.equal((await req(fridgePath, token, { ...direct, name: '다른 품목' }))[0], 409);
  const inventory = (await req(fridgePath, token))[1].items;
  assert.equal(inventory.length, 2);
  const rice = inventory.find(({ id }) => id === directWrites[0][1].id);
  assert.deepEqual([rice.source, rice.quantity, rice.unit, rice.expiresAt], ['manual', 2000, 'g', null]);
  assert.deepEqual((await req(fridgePath, other))[1].items, []);
  const payment = draftFromPayment({
    candidate: { title: '마트', amount_krw: 700, spent_on: '2026-01-01', transaction_kind: 'expense' },
    fingerprint: '1234567890abcdef',
  }, 'kakao');
  const paymentPayload = reviewedPayload(payment);
  assert.equal((await req(spendPath, token, paymentPayload))[0], 201);
  assert.equal((await req(spendPath, token, paymentPayload))[0], 200);
  assert.equal((await req(spendPath, token))[1].items.find((row) => row.receiptId === payment.receiptId).source, 'kakao');
  assert.throws(() => draftFromPayment({ candidate: { transaction_kind: 'non_expense' } }, 'sms'));

  const budgetPath = '/finance/budget';
  const month = '2026-01';
  assert.equal((await req(budgetPath, token, { month, budget: -1 }))[0], 422);
  assert.equal((await req(budgetPath, token, { month, budget: 20000, useAsDefault: true }))[0], 200);
  assert.deepEqual(await req(`${budgetPath}?month=${month}`, token),
    [200, { month, budget: 20000, source: 'onboarding', spent: 9900 }]);
  assert.equal((await req(budgetPath, token, { month, budget: 12000 }))[0], 200);
  assert.deepEqual(await req(`${budgetPath}?month=${month}`, token),
    [200, { month, budget: 12000, source: 'monthly', spent: 9900 }]);
  assert.deepEqual(await req(`${budgetPath}?month=${month}`, other),
    [200, { month, budget: null, source: null, spent: 0 }]);

  const routinePath = '/routines';
  const routine = { action: 'save', id: randomUUID(), title: '스트레칭', time: '08:15', repeatDays: [] };
  assert.equal((await req(routinePath, null, routine))[0], 401);
  assert.equal((await req(routinePath, token, routine))[0], 200);
  const [, initial] = await req(routinePath, token);
  assert.equal(initial.items[0].doneToday, false);
  assert.equal((await req(routinePath, other, { action: 'complete', id: routine.id, date: initial.date, completed: true }))[0], 409);
  assert.equal((await req(routinePath, token, { action: 'complete', id: routine.id, date: '2000-01-01', completed: true }))[0], 409);
  assert.equal((await req(routinePath, token, { action: 'complete', id: routine.id, date: initial.date, completed: true }))[0], 200);
  assert.equal((await req(routinePath, token))[1].items[0].doneToday, true);
  assert.equal((await req(routinePath, token, { ...routine, title: '수정 루틴' }))[0], 200);
  assert.equal((await req(routinePath, token))[1].items[0].title, '수정 루틴');
  assert.equal((await req(routinePath, token, { action: 'archive', id: routine.id }))[0], 200);
  assert.deepEqual((await req(routinePath, token))[1].items, []);
  assert.deepEqual((await req(routinePath, other))[1].items, []);
  console.log('Auth → Functions → Firestore: receipt, manual expense, payment, stock, budgets, routines, replay and UID isolation passed.');
} finally {
  server.closeAllConnections();
  server.close();
}
