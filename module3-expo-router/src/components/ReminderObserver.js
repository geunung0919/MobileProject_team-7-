import { useEffect, useRef } from 'react';
import { router, useRootNavigationState } from 'expo-router';
import { recipes } from '../data/seed';
import { recipeNotificationPath } from '../domain/reminders.mjs';
import { observeReminders, clearReminderResponse } from '../services/recipeNotifications';
export default function ReminderObserver(){
 const navigation=useRootNavigationState(), handled=useRef(new Set());
 useEffect(()=>{
  if(!navigation?.key)return;
  let active=true;
  const stop=observeReminders(response=>{
   if(!active)return;
   const request=response.notification.request, path=recipeNotificationPath(request.content.data,recipes);
   if(!path || handled.current.has(request.identifier))return;
   handled.current.add(request.identifier);router.push(path);
   clearReminderResponse().catch(()=>{});
  });
  return ()=>{active=false;stop();};
 },[navigation?.key]);
 return null;
}
