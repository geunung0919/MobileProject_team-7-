import { validateRoutine, validRoutineDate, isScheduledOn } from './routines.mjs';
export const ROUTINE_OWNER='jachwi.routine.notifications.v1';
export const NOTIFICATION_WINDOW_DAYS=7;
export const PENDING_BUDGET=48;
export const koreaDate=now=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(now);

export function planRoutineNotifications(state,scope,now=new Date()) {
 if(!scope || !Number.isFinite(now.getTime()))throw Error('사용자와 현재 시간을 확인해 주세요.');
 const today=koreaDate(now),end=now.getTime()+NOTIFICATION_WINDOW_DAYS*86400000;
 const result=[],ids=new Set();
 for(const routine of state.routines) {
  validateRoutine(routine);
  if(ids.has(routine.id))throw Error('중복 루틴 ID를 확인해 주세요.');ids.add(routine.id);
  if(!routine.reminderTime || routine.remindersEnabled===false)continue;
  for(let offset=0;offset<=NOTIFICATION_WINDOW_DAYS;offset++) {
   const day=new Date(today+'T00:00:00Z');day.setUTCDate(day.getUTCDate()+offset);
   const date=day.toISOString().slice(0,10);
   if(!routine.days.includes(day.getUTCDay()) || routine.completedDates.includes(date))continue;
   const fireAt=Date.parse(`${date}T${routine.reminderTime}:00+09:00`);
   if(fireAt<=now.getTime() || fireAt>end)continue;
   const key=JSON.stringify([routine.id,date]);
   const signature=JSON.stringify([scope,routine.id,routine.title,fireAt]);
   result.push({key,signature,scope,routineId:routine.id,date,fireAt,title:routine.title});
  }
 }
 return result.sort((a,b)=>a.fireAt-b.fireAt || a.key.localeCompare(b.key));
}

export function routineNotificationPath(data,scope,state) {
 if(data?.owner!==ROUTINE_OWNER || !scope || data.scope!==scope || !state?.routines.some(r=>r.id===data.routineId))return null;
 return '/routine';
}

function keepPresented(data,input) {
 if(data.scope!==input.scope)return false;
 if(input.ready && !input.enabled)return false;
 if(!input.state)return true; // unknown state/preference is not an instruction to erase valid alerts
 const routine=input.state.routines.find(r=>r.id===data.routineId);
 if(!routine || !routine.reminderTime || routine.remindersEnabled===false || !validRoutineDate(data.date) ||
    !isScheduledOn(routine,data.date) || routine.completedDates.includes(data.date))return false;
 const fireAt=Date.parse(`${data.date}T${routine.reminderTime}:00+09:00`);
 return data.signature===JSON.stringify([input.scope,routine.id,routine.title,fireAt]);
}

// Adapter supplies list/cancel/schedule/allowed; all calls serialize across accounts.
// A newer request invalidates old work before each OS mutation.
export function createRoutineNotificationCoordinator(adapter,clock=()=>new Date()) {
 let queue=Promise.resolve(),generation=0;
 return {
  reconcile(input) {
   const ticket=++generation;
   const task=queue.then(async()=>{
    const created=[];
    const assertCurrent=()=>{if(ticket!==generation)throw Object.assign(Error('예약 요청이 갱신됐어요.'),{superseded:true});};
    try {
     assertCurrent();
     const pending=await adapter.list();assertCurrent();
     const owned=pending.filter(n=>n.content?.data?.owner===ROUTINE_OWNER);
     const presented=adapter.presented?await adapter.presented():[];assertCurrent();
     for(const notification of presented) {
      const request=notification.request;
      if(request?.content?.data?.owner===ROUTINE_OWNER && !keepPresented(request.content.data,input)) {
       assertCurrent();await adapter.dismiss(request.identifier);assertCurrent();
      }
     }
     const cancel=async item=>{assertCurrent();await adapter.cancel(item.identifier);assertCurrent();};
     // Clear previous accounts even while current data/preferences are loading.
     for(const item of owned.filter(n=>n.content.data.scope!==input.scope))await cancel(item);
     if(!input.scope)return {status:'signed_out',count:0};
     if(!input.ready){
      // Unknown server preference is not OFF. Keep valid current reservations, but remove obsolete local edits.
      const remaining=owned.filter(n=>n.content.data.scope===input.scope);
      const valid=input.state?planRoutineNotifications(input.state,input.scope,clock()):null;
      let count=0;
      for(const item of remaining) {
       if(valid && !valid.some(p=>p.key===item.content.data.key && p.signature===item.content.data.signature))await cancel(item);
       else count++;
      }
      return {status:'waiting',count};
     }
     const current=owned.filter(n=>n.content.data.scope===input.scope);
     if(!input.enabled) {
      for(const item of current)await cancel(item);
      return {status:'disabled',count:0};
     }
     const allowed=await adapter.allowed();assertCurrent();
     if(!allowed) {
      for(const item of current)await cancel(item);
      return {status:'permission_denied',count:0};
     }
     const now=clock(),plan=planRoutineNotifications(input.state,input.scope,now);
     const otherCount=pending.length-owned.length;
     if(plan.length+otherCount>PENDING_BUDGET) {
      // Do not leave old edited/deleted routine alarms active after a rejected plan.
      for(const item of current)await cancel(item);
      throw Error(`앞으로 7일 알림이 예약 한도(${PENDING_BUDGET}개, 다른 알림 포함)를 넘어요. 루틴 알림 요일이나 항목을 줄여 주세요.`);
     }
     const keep=new Map();
     for(const item of current) {
      const wanted=plan.find(p=>p.key===item.content.data.key && p.signature===item.content.data.signature);
      if(wanted&&!keep.has(wanted.key))keep.set(wanted.key,item);
      else await cancel(item);
     }
     for(const request of plan.filter(p=>!keep.has(p.key))) {
      assertCurrent();const id=await adapter.schedule(request);created.push(id);assertCurrent();
     }
     return {status:'scheduled',count:plan.length,until:new Date(now.getTime()+NOTIFICATION_WINDOW_DAYS*86400000).toISOString()};
    } catch(error) {
     let cleanupFailed=false;
     for(const id of created)try{await adapter.cancel(id);}catch{cleanupFailed=true;}
     if(cleanupFailed)throw Error('일부 알림 예약 정리에 실패했어요. 앱을 다시 열어 예약을 재시도해 주세요.');
     if(error.superseded)return {status:'superseded',count:0};
     throw error;
    }
   });
   queue=task.catch(()=>{});return task;
  },
 };
}
