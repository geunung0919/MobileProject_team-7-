import { createContext, useContext, useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStore, fridgeActions } from '../domain/store.mjs';
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
  async function update(fn) {
    try { await store.update(fn); setError(''); }
    catch(e) { setError(e.message || '저장하지 못했어요. 다시 시도해 주세요.'); throw e; }
  }
  const api = { state, error, setError, ...fridgeActions(update, newId) };
  if (!state) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{error ? <Text accessibilityRole="alert">{error}</Text> : <ActivityIndicator />}</View>;
  return <Context.Provider value={api}>{children}</Context.Provider>;
}
export const useApp = () => useContext(Context);
