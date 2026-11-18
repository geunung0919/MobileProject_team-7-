import {executeInventoryCommand} from '../domain/inventoryCommands.mjs';
import {inventoryRecord} from '../domain/inventoryFields.mjs';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialState } from '../data/seed';
import { mergeShopping, registerPurchased, replaceRecipeShopping, removeShoppingRecipe, editShoppingItem } from '../domain/shopping.mjs';
import { shortages } from '../domain/inventory.mjs';
import { createPersistentStore } from './persistentStore.mjs';
import {defaultConditions,defaultAlertSettings,conditions,alertSettings,saveInventory,logChange} from '../domain/nonAi.mjs';
const Context = createContext(null);
const KEY = 'module3.ui.gyu0201.snack.v1';
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
   const migrated = { ...value, inventoryEvents:value.inventoryEvents||[],usages:value.usages||[],conditions:{...defaultConditions,...value.conditions},alertSettings:{...defaultAlertSettings,...value.alertSettings}, discards: value.discards || [], undo: value.undo || null, processedIds: value.processedIds || [] };
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
  saveItem: item => update(s=>executeInventoryCommand(s,{type:'inventory.save',requestId:newId(),payload:{item}})),
  registerReceiptItem: (input,requestId=newId()) => update(s=>executeInventoryCommand(s,{type:'receipt.register',requestId,payload:input})),
  saveConditions: input=>update(s=>({...s,conditions:conditions(input)})),
  saveAlertSettings: input=>update(s=>({...s,alertSettings:alertSettings(input)})),
  useItem:(id,amount,requestId)=>update(s=>executeInventoryCommand(s,{type:'inventory.use',requestId,payload:{id,quantity:amount}})),
  confirmHousehold:id=>update(s=>{const item=s.inventory.find(i=>i.id===id);if(!item)throw new Error('재고가 없어요.');return saveInventory(s,{...item,lastConfirmedAt:new Date().toISOString()},newId());}),
  deleteItem: id => update(s => logChange({ ...s, undo:null, inventory:s.inventory.filter(i=>i.id!==id) },'delete',s.inventory.find(i=>i.id===id),null,newId())),
  recordMeal: (recipe,usage,id) => update(s => executeInventoryCommand(s,{type:'meal.complete',requestId:id,payload:{recipe,usage}})),
  discardItem: (batchId,amount,reason,id) => update(s => executeInventoryCommand(s,{type:'inventory.discard',requestId:id,payload:{id:batchId,quantity:amount,reason}})),
  undoLatest: id => update(s => executeInventoryCommand(s,{type:'inventory.undo',requestId:newId(),payload:{operationId:id}})),
  addShopping: items => update(s => ({...s,shopping:mergeShopping(s.shopping,items,newId)})),
  registerShopping: (shoppingId,item) => update(s=>{const now=new Date().toISOString(),record={...inventoryRecord(item,item.id||newId()),createdAt:now,updatedAt:now,version:1};return logChange(registerPurchased(s,shoppingId,record),'create',null,record,newId(),now);}),
  removeShoppingRecipe: recipeId=>update(s=>({...s,shopping:removeShoppingRecipe(s.shopping,recipeId)})),
  editShopping: (id,input) => update(s=>{
   const original=s.shopping.find(i=>i.id===id);
   if(!original || original.inventoryId) throw new Error('수정할 수 없는 품목이에요.');
   const item=editShoppingItem(original,input);
   if(s.shopping.some(i=>i.id!==id&&!i.done&&i.name===item.name&&i.unit===item.unit)) throw new Error('같은 이름과 단위의 미구매 품목이 있어요. 해당 품목을 수정해 주세요.');
   return {...s,shopping:s.shopping.map(i=>i.id===id?{...i,...item}:i)};
  }),
  toggleShopping: id => update(s=>({...s,shopping:s.shopping.map(i=>i.id===id?{...i,done:!i.done}:i)})),
  deleteShopping: id => update(s=>({...s,shopping:s.shopping.filter(i=>i.id!==id)})),
 };
 api.addMissing = recipe => update(s=>({...s,shopping:replaceRecipeShopping(s.shopping,shortages(s.inventory,recipe),recipe,newId)}));
 if(!state) return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>{error?<Text>{error}</Text>:<ActivityIndicator/>}</View>;
 return <Context.Provider value={api}><View style={{flex:1}}>{error ? <Text accessibilityRole="alert" style={{padding:12,color:"#9B2929",backgroundColor:"#FFF2EE"}}>{error}</Text> : null}{children}</View></Context.Provider>;
}
export const useApp = () => useContext(Context);
