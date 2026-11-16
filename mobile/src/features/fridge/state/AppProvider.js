import {executeInventoryCommand} from '../domain/inventoryCommands.mjs';
import {inventoryRecord} from '../domain/inventoryFields.mjs';
import { mergeShopping, registerPurchased, replaceRecipeShopping, removeShoppingRecipe, editShoppingItem } from '../domain/shopping.mjs';
import { shortages } from '../domain/inventory.mjs';
import {conditions,alertSettings,saveInventory,logChange} from '../domain/nonAi.mjs';
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
    try { const result=await store.update(fn); setError(''); return result; }
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
    ...fridgeActions(update, newId),
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
  if (!state) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{error ? <Text accessibilityRole="alert">{error}</Text> : <ActivityIndicator />}</View>;
  return <Context.Provider value={api}>{children}</Context.Provider>;
}
export const useApp = () => useContext(Context);
