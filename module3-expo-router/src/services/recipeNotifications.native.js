import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createReminderManager, REMINDER_OWNER, reminderTime, nextReminderDate } from '../domain/reminders.mjs';
export const notificationsSupported=true;
const manager=createReminderManager(Notifications);
const channelId='module3-recipes';
Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false})});
async function permission() {
 if(Platform.OS==='android') await Notifications.setNotificationChannelAsync(channelId,{name:'레시피 알림',importance:Notifications.AndroidImportance.DEFAULT});
 let p=await Notifications.getPermissionsAsync();
 if(!p.granted && p.ios?.status!==Notifications.IosAuthorizationStatus.PROVISIONAL) p=await Notifications.requestPermissionsAsync();
 if(!p.granted && p.ios?.status!==Notifications.IosAuthorizationStatus.PROVISIONAL) throw new Error('알림 권한이 꺼져 있어요. 휴대폰 설정에서 허용해 주세요.');
}
export const listReminders=manager.list;
export const cancelReminder=manager.cancel;
export async function scheduleRecipeReminder({recipe=null,hour,minute,daily=false}) {
 const time=reminderTime(hour,minute);
 await permission();
 const date=daily?null:nextReminderDate(time.hour,time.minute);
 await manager.schedule({content:{
  title:daily?'오늘의 냉장고를 확인해 보세요':`${recipe.name} 요리할 시간이에요`,
  body:'남은 재료와 날짜를 확인하고 오늘의 레시피를 골라 보세요.',
  data:{owner:REMINDER_OWNER,key:daily?'daily':`recipe:${recipe.id}`,recipeId:recipe?.id || null,label:daily?`매일 ${String(time.hour).padStart(2,'0')}:${String(time.minute).padStart(2,'0')}`:date.toLocaleString()},
 },trigger:daily?{type:Notifications.SchedulableTriggerInputTypes.DAILY,...time,channelId}:{type:Notifications.SchedulableTriggerInputTypes.DATE,date,channelId}});
 return daily?'매일 레시피 알림을 예약했어요.':`${date.toLocaleString()}에 알림을 예약했어요.`;
}
export function observeReminders(onResponse) {
 const subscription=Notifications.addNotificationResponseReceivedListener(onResponse);
 Notifications.getLastNotificationResponseAsync().then(r=>{if(r)onResponse(r);}).catch(()=>{});
 return ()=>subscription.remove();
}
export const clearReminderResponse=()=>Notifications.clearLastNotificationResponseAsync();
