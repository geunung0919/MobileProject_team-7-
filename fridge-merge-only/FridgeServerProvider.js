import React, {createContext,useContext,useEffect,useRef,useState,useCallback} from 'react';
import {readItems,serverInventory,planServerWrite,writeServer} from './fridgeApi.mjs';
export const ServerContext=createContext(null);
export const useFridgeServer=()=>useContext(ServerContext);
// Mount with key={user.uid}; user is the existing Firebase-authenticated user.
export function FridgeServerProvider({user,isCurrentUser,children}) {
 const [result,D]=useState(null),[error,E]=useState(''),[loading,L]=useState(true);
 const lock=useRef(false),seq=useRef(0),alive=useRef(false);
 const refresh=useCallback(async()=>{
  const n=++seq.current;L(true);E('');
  try {const data=await readItems(user);if(alive.current&&n===seq.current&&isCurrentUser(user))D(data);}
  catch(e){if(alive.current&&n===seq.current){D(null);E(e.message);}}
  finally{if(alive.current&&n===seq.current)L(false);}
 },[user,isCurrentUser]);
 useEffect(()=>{alive.current=true;refresh();return()=>{alive.current=false;++seq.current;};},[refresh]);
 async function mutate(kind,input){
  if(lock.current||loading||error||!result||result.possiblyTruncated)throw new Error('서버 목록을 정상 조회한 뒤 다시 시도해 주세요.');
  if(!isCurrentUser(user))throw new Error('로그인이 변경됐어요.');
  lock.current=true;L(true);
  try{const latest=await readItems(user);if(latest.possiblyTruncated)throw new Error('전체 재고 확인이 필요해요.');const plan=planServerWrite(kind,input,serverInventory(latest.items));await writeServer(user,plan,fetch,isCurrentUser);return true;}
  finally{lock.current=false;if(alive.current&&isCurrentUser(user))await refresh();}
 }
 return React.createElement(ServerContext.Provider,{value:{user,result,error,loading,refresh,mutate,inventory:serverInventory(result?.items)}},children);
}
