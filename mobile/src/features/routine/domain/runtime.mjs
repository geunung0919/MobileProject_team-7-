export function validateNotificationSettings(value) {
 if(!value || !['spending_alerts','inventory_alerts','routine_reminders'].every(key=>typeof value[key]==='boolean'))throw Error('알림 설정 응답을 확인할 수 없어요.');
 return value;
}
// Mutable IO session lives outside React render values. Tickets fence late account/read responses.
export function createRoutineRuntime(api,key,store) {
 let epoch=null,state=null,preferences=null,settingsGeneration=0;
 const isLive=ticket=>epoch===ticket && !!ticket?.active;
 const requireLive=ticket=>{if(!isLive(ticket))throw Error('계정 연결이 변경됐어요. 현재 계정에서 다시 시도해 주세요.');};
 return {api,key,store,isLive,requireLive,
  getEpoch:()=>epoch,getState:()=>state,getPreferences:()=>preferences,
  start(){epoch={active:true};return epoch;},
  stop(ticket){if(ticket)ticket.active=false;},
  acceptState(ticket,next){requireLive(ticket);state=next;},
  beginRead(ticket){requireLive(ticket);return ++settingsGeneration;},
  isCurrentRead(ticket,version){return isLive(ticket)&&version===settingsGeneration;},
  acceptRead(ticket,version,value){requireLive(ticket);if(version!==settingsGeneration)return false;preferences=validateNotificationSettings(value);return true;},
  applySettings(ticket,value){requireLive(ticket);const next=validateNotificationSettings(value);settingsGeneration++;preferences=next;return preferences;},
 };
}
