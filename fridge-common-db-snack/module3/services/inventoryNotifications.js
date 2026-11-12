import {Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
import {inventoryAlertPlan,reconcileAlerts,INVENTORY_ALERT_OWNER} from '../domain/nonAi.mjs';
export const supported=Platform.OS!=='web';
if(supported)Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false})});
const channel='module3-inventory-v2';let queue=Promise.resolve();
const granted=p=>p.granted||p.ios?.status===Notifications.IosAuthorizationStatus.PROVISIONAL;
export async function requestInventoryPermission(){
 if(!supported)throw new Error('실제 알림은 휴대폰 앱에서 설정해 주세요.');
 if(Platform.OS==='android')await Notifications.setNotificationChannelAsync(channel,{name:'재고 날짜 알림',importance:Notifications.AndroidImportance.HIGH,sound:'default'});
 const current=await Notifications.getPermissionsAsync();
 if(!granted(current)&&!granted(await Notifications.requestPermissionsAsync()))throw new Error('알림 권한을 허용해 주세요.');
}
export function syncInventoryNotifications(inventory,settings){
 if(!supported)return Promise.resolve({count:0,omitted:0,unsupported:true});
 const task=queue.then(async()=>{
  const allowed=granted(await Notifications.getPermissionsAsync());
  if(allowed&&settings.enabled&&Platform.OS==='android')await Notifications.setNotificationChannelAsync(channel,{name:'재고 날짜 알림',importance:Notifications.AndroidImportance.HIGH,sound:'default'});
  const plan=inventoryAlertPlan(inventory,{...settings,enabled:settings.enabled&&allowed});
  const result=await reconcileAlerts({list:()=>Notifications.getAllScheduledNotificationsAsync(),cancel:id=>Notifications.cancelScheduledNotificationAsync(id),schedule:p=>Notifications.scheduleNotificationAsync({content:{title:p.title,body:p.body,sound:'default',data:{owner:INVENTORY_ALERT_OWNER,key:p.key,at:p.at,batchId:p.batchId}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:new Date(p.at),channelId:channel}})},plan);
  return {...result,permissionDenied:settings.enabled&&!allowed};
 });queue=task.catch(()=>{});return task;
}
export function observeInventoryNotifications(onId){
 if(!supported)return ()=>{};
 const receive=response=>{const data=response?.notification?.request?.content?.data;if((data?.owner===INVENTORY_ALERT_OWNER||data?.owner===INVENTORY_ALERT_OWNER+'-test')){onId(data.batchId,response.notification.request.identifier);Notifications.clearLastNotificationResponseAsync().catch(()=>{});}};
 const sub=Notifications.addNotificationResponseReceivedListener(receive);
 Notifications.getLastNotificationResponseAsync().then(receive).catch(()=>{});
 return ()=>sub.remove();
}

export async function scheduleInventoryTest(){
 await requestInventoryPermission();
 return Notifications.scheduleNotificationAsync({identifier:'module3-inventory-test',content:{title:'냉장고 날짜 알림 테스트',body:'실제 기기 알림이에요. 날짜 임박 재고도 같은 방식으로 알려드려요.',sound:'default',data:{owner:INVENTORY_ALERT_OWNER+'-test',test:true}},trigger:{type:Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,seconds:60,repeats:false,channelId:channel}});
}
export async function cancelInventoryTest(){if(supported)await Notifications.cancelScheduledNotificationAsync('module3-inventory-test');}
