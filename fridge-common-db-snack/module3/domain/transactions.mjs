import {exactIngredient} from './ingredientCatalog.mjs';
import { dayKey, daysLeft } from './inventory.mjs';
export const roundQuantity = n => Math.round(n * 1e6) / 1e6;
export function quantity(value, allowZero = false) {
 const text = String(value).trim();
 if (!/^\d+(\.\d{1,6})?$/.test(text)) throw new Error('수량은 소수점 6자리 이내의 숫자로 입력해 주세요.');
 const n = Number(text);
 if (!Number.isFinite(n) || n > 1e9 || n < 0 || (!allowZero && n === 0)) throw new Error('수량은 0보다 크고 10억 이하여야 해요.');
 return n;
}
export function removeFromBatch(item, amount, at = new Date().toISOString()) {
 const used = quantity(amount);
 if (used > item.quantity) throw new Error(`${item.name}의 재고가 부족해요.`);
 const left = roundQuantity(item.quantity - used);
 const known = Number.isSafeInteger(item.remainingCost) && item.remainingCost >= 0;
 const cost = known ? (left === 0 ? item.remainingCost : Math.round(item.remainingCost * used / item.quantity)) : null;
 return { item: { ...item, updatedAt:at, version:(item.version||0)+1, quantity: left, remainingCost: known ? item.remainingCost - cost : null }, cost };
}
export function aggregateUsage(rows) {
 if (!Array.isArray(rows)) throw new Error('사용량을 확인해 주세요.');
 const map = new Map();
 for (const row of rows) {
  const q = quantity(row.quantity, true);
  if (!row.name?.trim() || !row.unit?.trim()) throw new Error('재료명과 단위를 확인해 주세요.');
  if (!q) continue;
  const ingredientId=row.ingredientId||exactIngredient(row.name)?.id||null;
  const key = JSON.stringify([ingredientId||row.name, row.unit]);
  const prev = map.get(key);
  map.set(key, { ingredientId, name: row.name, unit: row.unit, quantity: roundQuantity((prev?.quantity || 0) + q) });
 }
 if (!map.size) throw new Error('한 가지 이상의 재료 사용량을 입력해 주세요.');
 return [...map.values()];
}
export function planMeal(inventory, rows, today = dayKey(), at = new Date().toISOString()) {
 const usage = aggregateUsage(rows);
 const next = inventory.map(i => ({ ...i }));
 const changes = [];
 for (const row of usage) {
  let remaining = row.quantity;
  const batches = next.filter(i => i.category !== 'household' && (row.ingredientId ? (i.ingredientId||exactIngredient(i.name)?.id)===row.ingredientId : i.name===row.name) && i.unit === row.unit && daysLeft(i.expiresAt,today) >= 0)
   .sort((a,b) => a.expiresAt.localeCompare(b.expiresAt));
  for (const batch of batches) {
   if (remaining <= 0) break;
   const amount = Math.min(batch.quantity, remaining);
   if (amount <= 0) continue;
   const result = removeFromBatch(batch, amount, at);
   changes.push({ batchId: batch.id, name: batch.name, quantity: amount, unit: batch.unit, cost: result.cost });
   Object.assign(batch, result.item);
   remaining = roundQuantity(remaining - amount);
  }
  if (remaining > 0) throw new Error(`${row.name} ${remaining}${row.unit}가 부족해요. 사용량 또는 재고를 확인해 주세요.`);
 }
 return { inventory: next.filter(i => i.quantity > 0), usage, changes };
}
export function applyMeal(state, recipe, rows, id, createdAt = new Date().toISOString(), today = dayKey()) {
 if (state.meals.some(m => m.id === id) || (state.processedIds || []).includes(id)) return state;
 const plan = planMeal(state.inventory, rows, today, createdAt);
 return { ...state, inventory: plan.inventory,
  meals: [{ id, recipeId: recipe.id, name: recipe.name, createdAt, usage: plan.usage, changes: plan.changes }, ...state.meals],
  processedIds: [...(state.processedIds || []), id],
  undo: { id, kind: 'meal', label: recipe.name, inventory: state.inventory, expectedInventory: plan.inventory },
 };
}
export function applyDiscard(state, batchId, amount, reason, id, createdAt = new Date().toISOString()) {
 if ((state.processedIds || []).includes(id)) return state;
 const batch = state.inventory.find(i => i.id === batchId);
 if (!batch) throw new Error('재고를 찾을 수 없어요.');
 const q = quantity(amount);
 const result = removeFromBatch(batch,q,createdAt);
 return { ...state,
  inventory: state.inventory.map(i => i.id === batchId ? result.item : i).filter(i => i.quantity > 0),
  discards: [{ id, batchId, name: batch.name, quantity: q, unit: batch.unit, cost: result.cost, reason, createdAt }, ...(state.discards || [])],
  processedIds: [...(state.processedIds || []), id],
  undo: { id, kind: 'discard', label: batch.name, inventory: state.inventory, expectedInventory: state.inventory.map(i=>i.id===batchId?result.item:i).filter(i=>i.quantity>0) },
 };
}
export function undoLatest(state, id) {
 if (!state.undo || state.undo.id !== id) throw new Error('이 작업은 더 이상 되돌릴 수 없어요.');
 if (!state.undo.expectedInventory) throw new Error('이전 버전 작업은 안전하게 되돌릴 수 없어요.');
 const before=state.undo.inventory, after=state.undo.expectedInventory;
 const affected=[...new Set([...before,...after].map(i=>i.id))].filter(key=>JSON.stringify(before.find(i=>i.id===key))!==JSON.stringify(after.find(i=>i.id===key)));
 for(const key of affected){
  if(JSON.stringify(state.inventory.find(i=>i.id===key))!==JSON.stringify(after.find(i=>i.id===key)))throw new Error('재고가 변경되어 되돌릴 수 없어요.');
 }
 const restored=state.inventory.filter(i=>!affected.includes(i.id));
 for(const key of affected){const old=before.find(i=>i.id===key);if(old)restored.push({...old,version:Math.max(old.version||0,after.find(i=>i.id===key)?.version||0)+1,updatedAt:new Date().toISOString()});}
 return { ...state, inventory: restored, undo: null,
  meals: state.undo.kind === 'meal' ? state.meals.filter(m => m.id !== id) : state.meals,
  usages: state.undo.kind === 'use' ? (state.usages||[]).filter(u=>u.id!==id) : (state.usages||[]),
  discards: state.undo.kind === 'discard' ? state.discards.filter(d => d.id !== id) : state.discards,
 };
}
export const money = value => value == null ? '금액 미입력' : `${value.toLocaleString('ko-KR')}원`;
