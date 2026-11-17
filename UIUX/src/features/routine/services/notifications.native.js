import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createRoutineNotificationCoordinator, ROUTINE_OWNER } from '../domain/notifications.mjs';
export const routineNotificationsSupported=true;
const channelId='jachwi-routines';
async function channel() {
 if(Platform.OS==='android')await Notifications.setNotificationChannelAsync(channelId,{name:'생활 루틴',importance:Notifications.AndroidImportance.DEFAULT});
}
const allowed=p=>p.granted || p.ios?.status===Notifications.IosAuthorizationStatus.PROVISIONAL;
export async function requestRoutinePermission() {
 await channel();let permission=await Notifications.getPermissionsAsync();
 if(!allowed(permission))permission=await Notifications.requestPermissionsAsync();
 if(!allowed(permission))throw Error('휴대폰 설정에서 알림 권한을 허용해 주세요. 루틴 기록은 그대로 사용할 수 있어요.');
}
const coordinator=createRoutineNotificationCoordinator({
 list:()=>Notifications.getAllScheduledNotificationsAsync(),
 presented:()=>Notifications.getPresentedNotificationsAsync(),
 dismiss:id=>Notifications.dismissNotificationAsync(id),
 cancel:id=>Notifications.cancelScheduledNotificationAsync(id),
 allowed:async()=>{await channel();return allowed(await Notifications.getPermissionsAsync());},
 schedule:request=>Notifications.scheduleNotificationAsync({
  content:{title:request.title,body:'생활 루틴을 확인해 보세요.',data:{owner:ROUTINE_OWNER,scope:request.scope,routineId:request.routineId,key:request.key,signature:request.signature,date:request.date}},
  trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:new Date(request.fireAt),channelId},
 }),
});
export const reconcileRoutineNotifications=input=>coordinator.reconcile(input);
export function observeRoutineNotificationResponses(listener) {
 const subscription=Notifications.addNotificationResponseReceivedListener(listener);
 Notifications.getLastNotificationResponseAsync().then(response=>{if(response)listener(response);}).catch(()=>{});
 return ()=>subscription.remove();
}
export const clearRoutineResponse=()=>Notifications.clearLastNotificationResponseAsync();
