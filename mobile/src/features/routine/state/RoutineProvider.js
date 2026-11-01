import {createRoutineRuntime,validateNotificationSettings as settings} from '../domain/runtime.mjs';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '../../../state/Session';
import { createRoutineStore } from '../domain/routines.mjs';
import { koreaDate } from '../domain/notifications.mjs';
import { requestRoutinePermission, reconcileRoutineNotifications, routineNotificationsSupported } from '../services/notifications';
const Context=createContext(null),stores=new Map();
const live=(runtime,epoch)=>runtime?.isLive(epoch);
const assertLive=(runtime,epoch)=>{if(!runtime)throw Error('먼저 서버에 연결해 주세요.');runtime.requireLive(epoch);};
export function RoutineProvider({children}) {
 const {api,routineKey}=useSession();
 const runtime=useMemo(()=>{
  if(!api || !routineKey)return null;
  if(!stores.has(routineKey))stores.set(routineKey,createRoutineStore(AsyncStorage,routineKey));
  return createRoutineRuntime(api,routineKey,stores.get(routineKey));
 },[api,routineKey]);
 const [snapshot,setSnapshot]=useState(null),[preferences,setPreferences]=useState(null),[info,setInfo]=useState(null);
 const [notificationError,setNotificationError]=useState(''),[preferenceError,setPreferenceError]=useState(''),[loadError,setLoadError]=useState('');
 const [pending,setPending]=useState(0),[today,setToday]=useState(()=>koreaDate(new Date()));
 const previousScope=useRef(null);
 const reconcile=useCallback(async current=>{
  const epoch=current?.getEpoch();if(!live(current,epoch))return;
  setPending(n=>n+1);
  try {
   const result=await reconcileRoutineNotifications({scope:current.key,state:current.getState(),
    ready:!!current.getState() && !!current.getPreferences(),enabled:current.getPreferences()?.routine_reminders===true});
   if(live(current,epoch)&&result.status!=='superseded'){setInfo({runtime:current,value:result});setNotificationError('');}
   return result;
  } catch(error){if(live(current,epoch)){setInfo({runtime:current,value:{status:'error'}});setNotificationError(error.message || '알림 예약 반영에 실패했어요. 다시 시도해 주세요.');}throw error;}
  finally{setPending(n=>n-1);}
 },[]);
 const refresh=useCallback(async current=>{
  const epoch=current?.getEpoch();assertLive(current,epoch);
  const version=current.beginRead(epoch);
  let next;
  try {next=settings(await current.api('me/notification-settings'));}
  catch(error){if(live(current,epoch)&&current.isCurrentRead(epoch,version))setPreferenceError(error.message);throw error;}
  assertLive(current,epoch);
  if(!current.acceptRead(epoch,version,next))return;
  setPreferences({runtime:current,value:next});setPreferenceError('');
  return reconcile(current);
 },[reconcile]);
 useEffect(()=>{
  let active=true,unsubscribe=()=>{},foreground=null,timer=null;
  const epoch=runtime?runtime.start():null;
  // Invalidate in-flight work on session boundaries without changing React state in render/effect setup.
  if(runtime)reconcileRoutineNotifications({scope:runtime.key,state:null,ready:false,enabled:false}).catch(()=>{});
  Promise.resolve().then(()=>{
   if(!active)return;
   setToday(koreaDate(new Date()));setLoadError('');setNotificationError('');setPreferenceError('');setInfo(null);
   if(!runtime){
    if(previousScope.current) {
     setPending(n=>n+1);
     reconcileRoutineNotifications({scope:null,ready:true,enabled:false}).catch(error=>{if(active)setNotificationError(error.message);}).finally(()=>setPending(n=>n-1));
    }
    previousScope.current=null;return;
   }
   previousScope.current=runtime.key;
   reconcile(runtime).catch(()=>{});
   unsubscribe=runtime.store.subscribe(next=>{
    if(!live(runtime,epoch))return;
    runtime.acceptState(epoch,next);setSnapshot({runtime,value:next});reconcile(runtime).catch(()=>{});
   });
   runtime.store.load().then(()=>{
    if(!live(runtime,epoch))return;
    runtime.acceptState(epoch,runtime.store.getState());setSnapshot({runtime,value:runtime.getState()});reconcile(runtime).catch(()=>{});
   }).catch(error=>{if(live(runtime,epoch))setLoadError(error.message || '루틴을 불러오지 못했어요.');});
   refresh(runtime).catch(()=>{});
   foreground=AppState.addEventListener('change',value=>{
    if(value==='active' && live(runtime,epoch)) {setToday(koreaDate(new Date()));refresh(runtime).catch(()=>{});}
   });
   timer=setInterval(()=>{
    if(AppState.currentState==='active' && live(runtime,epoch)) {
     setToday(koreaDate(new Date()));reconcile(runtime).catch(()=>{});
    }
   },60000);
  });
  return()=>{active=false;if(runtime)runtime.stop(epoch);unsubscribe();foreground?.remove();if(timer)clearInterval(timer);};
 },[runtime,reconcile,refresh]);
 const updateRoutine=useCallback(async transform=>{
  const epoch=runtime?.getEpoch();assertLive(runtime,epoch);
  setToday(koreaDate(new Date()));
  await runtime.store.update(transform);assertLive(runtime,epoch);
  // The routine is already durable: notification failure must not masquerade as a failed save.
  await reconcile(runtime).catch(()=>{});
 },[runtime,reconcile]);
 const applyNotificationSettings=useCallback(async value=>{
  const epoch=runtime?.getEpoch();assertLive(runtime,epoch);
  const next=runtime.applySettings(epoch,value);setPreferenceError('');
  setPreferences({runtime,value:next});
  return reconcile(runtime);
 },[runtime,reconcile]);
 const enableRoutineReminders=useCallback(async enabled=>{
  const epoch=runtime?.getEpoch();assertLive(runtime,epoch);
  if(enabled)await requestRoutinePermission();assertLive(runtime,epoch);
  const latest=settings(await runtime.api('me/notification-settings'));assertLive(runtime,epoch);
  const saved=settings(await runtime.api('me/notification-settings','PUT',{...latest,routine_reminders:enabled}));assertLive(runtime,epoch);
  return applyNotificationSettings(saved);
 },[runtime,applyNotificationSettings]);
 const refreshRoutineNotifications=useCallback(()=>refresh(runtime),[runtime,refresh]);
 const retryRoutineLoad=useCallback(async()=>{
  const epoch=runtime?.getEpoch();assertLive(runtime,epoch);
  const next=await runtime.store.load();assertLive(runtime,epoch);
  runtime.acceptState(epoch,runtime.store.getState() || next);setSnapshot({runtime,value:runtime.getState()});setLoadError('');
  await refresh(runtime);
 },[runtime,refresh]);
 return <Context.Provider value={{
  routineState:snapshot?.runtime===runtime?snapshot.value:null,
  notificationPreferences:preferences?.runtime===runtime?preferences.value:null,
  notificationInfo:info?.runtime===runtime?info.value:null,
  notificationError:[preferenceError,notificationError].filter(Boolean).join('\n'),notificationBusy:pending>0,loadError,today,routineScope:routineKey,
  updateRoutine,applyNotificationSettings,enableRoutineReminders,refreshRoutineNotifications,retryRoutineLoad,
  routineNotificationsSupported,requestRoutinePermission,
 }}>{children}</Context.Provider>;
}
export const useRoutines=()=>useContext(Context);
