import { useEffect, useRef } from 'react';
import { router, useRootNavigationState } from 'expo-router';
import { useSession } from '../../../state/Session';
import { recipes } from '../data/seed';
import { recipeNotificationPath } from '../domain/reminders.mjs';
import { observeReminders, clearReminderResponse, clearOtherReminders } from '../services/recipeNotifications';
export default function ReminderObserver() {
 const navigation=useRootNavigationState(), handled=useRef(new Set()), previousScope=useRef(null);
 const {storageScope}=useSession();
 useEffect(()=>{
  // A fresh process has no session yet: do not erase previously scheduled daily reminders.
  // Explicit logout or switching accounts removes schedules owned by the previous account.
  if(storageScope || previousScope.current) clearOtherReminders(storageScope).catch(()=>{});
  previousScope.current=storageScope;
  if(!navigation?.key || !storageScope)return;
  let active=true;
  const stop=observeReminders(response=>{
   if(!active)return;
   const request=response.notification.request;
   const path=recipeNotificationPath(request.content.data,recipes,storageScope);
   const eventKey=`${request.identifier}:${response.notification.date}:${response.actionIdentifier}`;
   if(!path || handled.current.has(eventKey))return;
   handled.current.add(eventKey);router.push(path);
   clearReminderResponse().catch(()=>{});
  });
  return ()=>{active=false;stop();};
 },[navigation?.key,storageScope]);
 return null;
}
