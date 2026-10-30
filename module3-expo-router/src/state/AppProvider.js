import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialState } from '../data/seed';
import { mergeShopping, shoppingItem, registerPurchased } from '../domain/shopping.mjs';
import { shortages } from '../domain/inventory.mjs';
import { applyMeal, applyDiscard, undoLatest } from '../domain/transactions.mjs';
import { createPersistentStore } from './persistentStore.mjs';
const Context = createContext(null);
const KEY = 'module3.state.v1';
export const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function AppProvider({ children }) {
 const [state,setState] = useState(null);
 const [error,setError] = useState('');
 const store = useRef(null);
 useEffect(() => {
  let active = true;
  AsyncStorage.getItem(KEY).then(raw => {
   const value = raw ? JSON.parse(raw) : initialState();
   if (!Array.isArray(value.inventory) || !Array.isArray(value.meals) || !Array.isArray(value.shopping)) throw new Error('invalid');
   const migrated = { ...value, discards: value.discards || [], undo: value.undo || null, processedIds: value.processedIds || [] };
   if (!active) return;
   store.current = createPersistentStore(migrated, next => AsyncStorage.setItem(KEY,JSON.stringify(next)), next => { if(active) setState(next); });
   setState(migrated);
  }).catch(() => { if(active) setError('저장 데이터를 읽지 못했어요. 앱을 다시 실행해 주세요.'); });
  return () => { active = false; };
 },[]);
 async function update(fn) {
  try { const result = await store.current.update(fn); setError(''); return result; }
  catch(e) { setError(e.message || '저장하지 못했어요. 다시 시도해 주세요.'); throw e; }
 }
 const api = { state, error,
  saveItem: item => update(s => ({ ...s, undo:null, inventory:s.inventory.some(i=>i.id===item.id)?s.inventory.map(i=>i.id===item.id?item:i):[...s.inventory,item] })),
  deleteItem: id => update(s => ({ ...s, undo:null, inventory:s.inventory.filter(i=>i.id!==id) })),
  recordMeal: (recipe,usage,id) => update(s => applyMeal(s,recipe,usage,id)),
  discardItem: (batchId,amount,reason,id) => update(s => applyDiscard(s,batchId,amount,reason,id)),
  undoLatest: id => update(s => undoLatest(s,id)),
  addShopping: items => update(s => ({...s,shopping:mergeShopping(s.shopping,items,newId)})),
  registerShopping: (shoppingId,item) => update(s=>registerPurchased(s,shoppingId,item)),
  editShopping: (id,input) => update(s=>{
   const original=s.shopping.find(i=>i.id===id);
   if(!original || original.inventoryId) throw new Error('수정할 수 없는 품목이에요.');
   const item=shoppingItem(input);
   if(s.shopping.some(i=>i.id!==id&&!i.done&&i.name===item.name&&i.unit===item.unit)) throw new Error('같은 이름과 단위의 미구매 품목이 있어요. 해당 품목을 수정해 주세요.');
   return {...s,shopping:s.shopping.map(i=>i.id===id?{...i,...item}:i)};
  }),
  toggleShopping: id => update(s=>({...s,shopping:s.shopping.map(i=>i.id===id?{...i,done:!i.done}:i)})),
  deleteShopping: id => update(s=>({...s,shopping:s.shopping.filter(i=>i.id!==id)})),
 };
 api.addMissing = recipe => api.addShopping(shortages(store.current.get().inventory,recipe));
 if(!state) return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>{error?<Text>{error}</Text>:<ActivityIndicator/>}</View>;
 return <Context.Provider value={api}>{children}</Context.Provider>;
}
export const useApp = () => useContext(Context);
