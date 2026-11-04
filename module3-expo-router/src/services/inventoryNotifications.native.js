import {Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
import {inventoryAlertPlan,reconcileAlerts,INVENTORY_ALERT_OWNER} from '../domain/nonAi.mjs';
export const supported=true;
const channel='module3-inventory';let queue=Promise.resolve();
const granted=p=>p.granted||p.ios?.status===Notifications.IosAuthorizationStatus.PROVISIONAL;
export async function requestInventoryPermission(){
 if(Platform.OS==='android')await Notifications.setNotificationChannelAsync(channel,{name:'재고 날짜 알림',importance:Notifications.AndroidImportance.DEFAULT});
 const current=await Notifications.getPermissionsAsync();
 if(!granted(current)&&!granted(await Notifications.requestPermissionsAsync()))throw new Error('알림 권한을 허용해 주세요.');
}
export function syncInventoryNotifications(inventory,settings){
 const task=queue.then(async()=>{
  const allowed=granted(await Notifications.getPermissionsAsync());
  if(allowed&&settings.enabled&&Platform.OS==='android')await Notifications.setNotificationChannelAsync(channel,{name:'재고 날짜 알림',importance:Notifications.AndroidImportance.DEFAULT});
  const plan=inventoryAlertPlan(inventory,{...settings,enabled:settings.enabled&&allowed});
  const result=await reconcileAlerts({list:()=>Notifications.getAllScheduledNotificationsAsync(),cancel:id=>Notifications.cancelScheduledNotificationAsync(id),schedule:p=>Notifications.scheduleNotificationAsync({content:{title:p.title,body:p.body,data:{owner:INVENTORY_ALERT_OWNER,key:p.key,at:p.at,batchId:p.batchId}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:new Date(p.at),channelId:channel}})},plan);
  return {...result,permissionDenied:settings.enabled&&!allowed};
 });queue=task.catch(()=>{});return task;
}
export function observeInventoryNotifications(onId){
 const receive=response=>{const data=response?.notification?.request?.content?.data;if(data?.owner===INVENTORY_ALERT_OWNER){onId(data.batchId,response.notification.request.identifier);Notifications.clearLastNotificationResponseAsync().catch(()=>{});}};
 const sub=Notifications.addNotificationResponseReceivedListener(receive);
 Notifications.getLastNotificationResponseAsync().then(receive).catch(()=>{});
 return ()=>sub.remove();
}
