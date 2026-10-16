import { createContext, useContext, useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { consume, shortages } from '../domain/inventory.mjs';
import { createStore, importExpense, validateItem } from '../domain/store.mjs';
const Context = createContext(null);
const stores = new Map();
export const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function AppProvider({ children, storageKey }) {
  const [store] = useState(() => {
    if (!stores.has(storageKey)) stores.set(storageKey, createStore(AsyncStorage, storageKey));
    return stores.get(storageKey);
  });
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const unsubscribe = store.subscribe(setState);
    store.load().then(() => { if (active) setState(store.getState()); })
      .catch(() => { if (active) setError('저장 데이터를 읽지 못했어요. 기존 데이터는 보존했어요. 연결을 종료한 뒤 다시 시도해 주세요.'); });
    return () => { active = false; unsubscribe(); };
  }, [store]);
  async function update(fn) { await store.update(fn); }
  const addShopping = (s, items) => {
    const shopping = s.shopping.map(i => ({ ...i }));
    for (const item of items) {
      const found = shopping.find(i => i.name === item.name && i.unit === item.unit && !i.done);
      if (found) found.quantity = Math.max(found.quantity, item.quantity);
      else shopping.push({ ...item, id: newId(), done: false });
    }
    return { ...s, shopping };
  };
  const api = {
    state, error, setError,
    saveItem: item => update(s => { validateItem(item); return { ...s, inventory: s.inventory.some(i => i.id === item.id) ? s.inventory.map(i => i.id === item.id ? { ...i, ...item } : i) : [...s.inventory, item] }; }),
    deleteItem: id => update(s => ({ ...s, inventory: s.inventory.filter(i => i.id !== id) })),
    importPurchase: (expense, items) => update(s => importExpense(s, expense, items)),
    recordMeal: recipe => update(s => ({ ...s, inventory: consume(s.inventory, recipe), meals: [{ id: newId(), recipeId: recipe.id, name: recipe.name, createdAt: new Date().toISOString() }, ...s.meals] })),
    addShopping: items => update(s => addShopping(s, items)),
    addMissing: recipe => update(s => addShopping(s, shortages(s.inventory, recipe))),
    toggleShopping: id => update(s => ({ ...s, shopping: s.shopping.map(i => i.id === id ? { ...i, done: !i.done } : i) })),
    deleteShopping: id => update(s => ({ ...s, shopping: s.shopping.filter(i => i.id !== id) })),
  };
  if (!state) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{error ? <Text accessibilityRole="alert">{error}</Text> : <ActivityIndicator />}</View>;
  return <Context.Provider value={api}>{children}</Context.Provider>;
}
export const useApp = () => useContext(Context);
