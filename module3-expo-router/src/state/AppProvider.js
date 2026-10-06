import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {Text,View,ActivityIndicator} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {initialState} from '../data/seed';
import {consume,shortages} from '../domain/inventory.mjs';
const Context=createContext(null);const KEY='module3.state.v1';
export const newId=()=>`${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function AppProvider({children}){
 const [state,setState]=useState(null);const [error,setError]=useState('');const current=useRef(null);const queue=useRef(Promise.resolve());
 useEffect(()=>{AsyncStorage.getItem(KEY).then(raw=>{const value=raw?JSON.parse(raw):initialState();if(!Array.isArray(value.inventory)||!Array.isArray(value.meals)||!Array.isArray(value.shopping))throw new Error('invalid');current.current=value;setState(value);}).catch(()=>setError('저장 데이터를 읽지 못했어요. 앱을 다시 실행해 주세요.'));},[]);
 function update(fn){const next=fn(current.current);current.current=next;setState(next);queue.current=queue.current.then(()=>AsyncStorage.setItem(KEY,JSON.stringify(next))).catch(()=>setError('기기에 저장하지 못했어요. 저장 공간을 확인해 주세요.'));}
 const api={state,error,
 saveItem:item=>update(s=>({...s,inventory:s.inventory.some(i=>i.id===item.id)?s.inventory.map(i=>i.id===item.id?item:i):[...s.inventory,item]})),
 deleteItem:id=>update(s=>({...s,inventory:s.inventory.filter(i=>i.id!==id)})),
 recordMeal:recipe=>update(s=>({...s,inventory:consume(s.inventory,recipe),meals:[{id:newId(),recipeId:recipe.id,name:recipe.name,createdAt:new Date().toISOString()},...s.meals]})),
 addShopping:items=>update(s=>{const shopping=s.shopping.map(i=>({...i}));for(const item of items){const found=shopping.find(i=>i.name===item.name&&i.unit===item.unit&&!i.done);if(found)found.quantity=Math.max(found.quantity,item.quantity);else shopping.push({...item,id:newId(),done:false});}return {...s,shopping};}),
 addMissing:recipe=>api.addShopping(shortages(current.current.inventory,recipe)),
 toggleShopping:id=>update(s=>({...s,shopping:s.shopping.map(i=>i.id===id?{...i,done:!i.done}:i)})),
 deleteShopping:id=>update(s=>({...s,shopping:s.shopping.filter(i=>i.id!==id)}))};
 if(!state)return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>{error?<Text>{error}</Text>:<ActivityIndicator/>}</View>;
 return <Context.Provider value={api}>{children}</Context.Provider>;
}
export const useApp=()=>useContext(Context);
