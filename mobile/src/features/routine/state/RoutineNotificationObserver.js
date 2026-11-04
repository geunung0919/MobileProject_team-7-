import { useEffect, useRef } from 'react';
import { router, useRootNavigationState } from 'expo-router';
import { useRoutines } from './RoutineProvider';
import { routineNotificationPath } from '../domain/notifications.mjs';
import { observeRoutineNotificationResponses, clearRoutineResponse } from '../services/notifications';
export default function RoutineNotificationObserver() {
 const navigation=useRootNavigationState(),handled=useRef(new Set());
 const {routineState,routineScope}=useRoutines();
 useEffect(()=>{
  if(!navigation?.key || !routineState || !routineScope)return;
  let active=true;
  const stop=observeRoutineNotificationResponses(response=>{
   if(!active)return;
   const request=response.notification.request;
   const path=routineNotificationPath(request.content.data,routineScope,routineState);
   const key=`${request.identifier}:${response.notification.date}:${response.actionIdentifier}`;
   if(!path || handled.current.has(key))return;
   handled.current.add(key);router.push(path);clearRoutineResponse().catch(()=>{});
  });
  return()=>{active=false;stop();};
 },[navigation?.key,routineScope,routineState]);
 return null;
}
