import { validDate } from './inventory.mjs';

export const emptyState = () => ({ version: 1, inventory: [], meals: [], shopping: [], importedExpenseIds: [] });
export function storageKey(origin, userId) {
  if (!origin || typeof userId !== 'string' || !userId) throw new Error('사용자 확인이 필요해요.');
  return `jachwi.fridge.v1:${encodeURIComponent(origin)}:${encodeURIComponent(userId)}`;
}
export function validateItem(item) {
  if (typeof item.name !== 'string' || !item.name.trim() || item.name.length > 100 ||
      typeof item.unit !== 'string' || !item.unit.trim() || item.unit.length > 20 ||
      !Number.isFinite(item.quantity) || item.quantity <= 0 || !validDate(item.expiresAt)) {
    throw new Error('재료명, 양수 수량, 단위, 올바른 소비기한을 입력해 주세요.');
  }
}
export function parseState(raw) {
  if (raw === null) return emptyState();
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !['inventory', 'meals', 'shopping', 'importedExpenseIds'].every(k => Array.isArray(value[k]))) {
    throw new Error('저장 데이터 형식을 확인할 수 없어요.');
  }
  for (const item of value.inventory) { validateItem(item); if (typeof item.id !== 'string') throw new Error('잘못된 재고 ID'); }
  for (const item of value.shopping) {
    if (typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.unit !== 'string' ||
        !Number.isFinite(item.quantity) || item.quantity <= 0 || typeof item.done !== 'boolean') throw new Error('잘못된 장보기 데이터');
  }
  for (const meal of value.meals) {
    if (typeof meal.id !== 'string' || typeof meal.name !== 'string' || !Number.isFinite(Date.parse(meal.createdAt))) throw new Error('잘못된 식사 데이터');
  }
  if (!value.importedExpenseIds.every(id => typeof id === 'string')) throw new Error('잘못된 등록 기록');
  return value;
}
export function importExpense(state, expense, items) {
  if (!expense || typeof expense.id !== 'string' || expense.category !== 'groceries') throw new Error('식재료 지출을 다시 조회해 주세요.');
  if (state.importedExpenseIds.includes(expense.id)) throw new Error('이미 냉장고에 등록한 지출이에요. 재고 목록에서 수정해 주세요.');
  if (!Array.isArray(items) || !items.length || items.length > 30) throw new Error('재료를 1~30개 입력해 주세요.');
  items.forEach(validateItem);
  return { ...state,
    inventory: [...state.inventory, ...items.map((item, index) => ({
      id: `expense-${expense.id}-${index}`, name: item.name.trim(), quantity: item.quantity,
      unit: item.unit.trim(), expiresAt: item.expiresAt, sourceExpenseId: expense.id,
    }))],
    importedExpenseIds: [...state.importedExpenseIds, expense.id],
  };
}

// One queue per account key survives screen unmounts. Publish only durable writes.
export function createStore(storage, key) {
  let state = null;
  let queue = Promise.resolve();
  let loading;
  const listeners = new Set();
  const load = () => loading || (loading = storage.getItem(key).then(raw => {
    state = parseState(raw); return state;
  }).catch(error => { loading = null; throw error; }));
  return {
    load,
    getState: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    update(fn) {
      const operation = queue.then(async () => {
        await load();
        const next = fn(state);
        await storage.setItem(key, JSON.stringify(next));
        state = next;
        listeners.forEach(listener => listener(state));
        return state;
      });
      queue = operation.catch(() => {});
      return operation;
    },
  };
}
