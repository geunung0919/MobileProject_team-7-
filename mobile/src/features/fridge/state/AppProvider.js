import { useSession } from '../../../state/Session';
import { createInventorySync } from '../domain/sync.mjs';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStore, fridgeActions, importExpense } from '../domain/store.mjs';
const Context = createContext(null);
const stores = new Map();
export const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
function accountFridgeStore(storageKey) {
  if (!storageKey) throw new Error('냉장고 계정을 확인해 주세요.');
  if (!stores.has(storageKey)) stores.set(storageKey, createStore(AsyncStorage, storageKey));
  return stores.get(storageKey);
}
export function registerReceiptIngredients(storageKey, expense, items) {
  return accountFridgeStore(storageKey).update(state =>
    state.importedExpenseIds.includes(expense.id) ? state : importExpense(state, expense, items));
}
export function AppProvider({ children, storageKey }) {
  const [store] = useState(() => accountFridgeStore(storageKey));
  const {api:serverApi}=useSession();
  const controller=useMemo(()=>createInventorySync(store,serverApi),[store,serverApi]);
  const [syncPending,setSyncPending]=useState(0);
  const [syncError,setSyncError]=useState('');
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
  const performSync=useCallback(async action=>{
    setSyncPending(n=>n+1);
    try { const result=await action();setSyncError('');return result; }
    catch(e){setSyncError(e.message || '서버에 연결하지 못했어요. 기기 변경은 보존했어요.');throw e;}
    finally{setSyncPending(n=>n-1);}
  },[]);
  const inspectInventorySync=useCallback(()=>performSync(()=>controller.inspect()),[controller,performSync]);
  const resolveInventorySync=useCallback((direction,preview)=>performSync(()=>controller.resolve(direction,preview)),[controller,performSync]);
  const syncInventoryNow=useCallback(()=>performSync(()=>controller.sync()),[controller,performSync]);
  const pauseInventorySync=useCallback(()=>performSync(()=>controller.pause()),[controller,performSync]);
  useEffect(()=>{
    if(!state?.inventorySync?.enabled)return;
    const timer=setTimeout(()=>{syncInventoryNow().catch(()=>{});},700);
    return ()=>clearTimeout(timer);
  },[state?.inventory,state?.inventorySync,syncInventoryNow]);
  const api = { state, error, setError, syncBusy:syncPending>0, syncError,
    inspectInventorySync,resolveInventorySync,syncInventoryNow,pauseInventorySync,
    ...fridgeActions(update, newId) };
  if (!state) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{error ? <Text accessibilityRole="alert">{error}</Text> : <ActivityIndicator />}</View>;
  return <Context.Provider value={api}>{children}</Context.Provider>;
}
export const useApp = () => useContext(Context);
