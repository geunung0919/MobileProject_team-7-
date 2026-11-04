import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRoutine,editRoutine,toggleRoutineComplete,toggleRoutineReminder,createRoutineStore,parseRoutineState} from '../src/features/routine/domain/routines.mjs';
import {planRoutineNotifications,createRoutineNotificationCoordinator,routineNotificationPath,ROUTINE_OWNER,koreaDate,PENDING_BUDGET} from '../src/features/routine/domain/notifications.mjs';
const NOW=new Date('2026-11-01T10:00:00Z'); // Sunday 19:00 Korea
const routine=(overrides={})=>makeRoutine({id:'r1',title:'설거지',days:[0,1,2,3,4,5,6],reminderTime:'21:30',energy:'low',...overrides});
const state=(overrides={})=>({version:1,routines:[routine(overrides)]});
const input=(value=state(),scope='a',extra={})=>({scope,state:value,ready:true,enabled:true,...extra});
function fake(){let items=[],seq=0;return {
 get items(){return items;},set items(value){items=value;},permission:true,cancelled:[],scheduled:[],failScheduleAt:null,failCancel:false,
 list:async()=>[...items],
 allowed:async function(){return this.permission;},
 cancel:async function(id){if(this.failCancel)throw Error('cancel failed');this.cancelled.push(id);items=items.filter(n=>n.identifier!==id);},
 schedule:async function(p){if(this.failScheduleAt===this.scheduled.length)throw Error('schedule failed');this.scheduled.push(p);const identifier='n'+ ++seq;items.push({identifier,content:{data:{owner:ROUTINE_OWNER,...p}}});return identifier;},
};}
function manager(f,clock=()=>NOW){return createRoutineNotificationCoordinator({list:()=>f.list(),allowed:()=>f.allowed(),cancel:id=>f.cancel(id),schedule:p=>f.schedule(p)},clock);}

test('Korean calendar schedules the next 7 days, never fires retroactively and does not depend on host timezone',()=>{
 assert.equal(koreaDate(new Date('2026-11-01T15:01:00Z')),'2026-11-02');
 const plan=planRoutineNotifications(state(),'a',NOW);assert.equal(plan.length,7);
 assert.equal(plan[0].fireAt,Date.parse('2026-11-01T21:30:00+09:00'));
 assert.ok(plan.every(p=>p.fireAt>NOW.getTime() && p.fireAt<=NOW.getTime()+7*86400000));
 const weekend=planRoutineNotifications(state({days:[0,6]}),'a',NOW);assert.deepEqual(weekend.map(p=>p.date),['2026-11-01','2026-11-07']);
 const past=planRoutineNotifications(state({days:[0],reminderTime:'18:00'}),'a',NOW);assert.equal(past.length,1);assert.equal(past[0].date,'2026-11-08');
});

test('no time and per-item OFF make no reservations; malformed/duplicate routines fail before scheduling',()=>{
 assert.equal(planRoutineNotifications(state({reminderTime:''}),'a',NOW).length,0);
 assert.equal(planRoutineNotifications(toggleRoutineReminder(state(),'r1'),'a',NOW).length,0);
 assert.throws(()=>planRoutineNotifications({routines:[routine(),routine()]},'a',NOW),/중복/);
 assert.throws(()=>planRoutineNotifications({routines:[{...routine(),reminderTime:'25:99'}]},'a',NOW));
});

test('today completion removes today only; undo re-adds future today and never resurrects a passed alarm',()=>{
 const complete=toggleRoutineComplete(state(),'r1','2026-11-01');
 const planned=planRoutineNotifications(complete,'a',NOW);assert.equal(planned.length,6);assert.ok(planned.every(p=>p.date!=='2026-11-01'));
 const undone=toggleRoutineComplete(complete,'r1','2026-11-01');assert.equal(planRoutineNotifications(undone,'a',NOW).length,7);
 const later=new Date('2026-11-01T13:00:00Z');assert.ok(planRoutineNotifications(undone,'a',later).every(p=>p.date!=='2026-11-01'));
});

test('repeat reconciliation deduplicates and edit replaces old title/time while preserving completion history',async()=>{
 const f=fake(),m=manager(f);await m.reconcile(input());assert.equal(f.items.length,7);
 await m.reconcile(input());assert.equal(f.scheduled.length,7);
 const complete=toggleRoutineComplete(state(),'r1','2026-11-01');
 const edited=editRoutine(complete,'r1',{...routine(),title:'정리',reminderTime:'22:00'});
 assert.deepEqual(edited.routines[0].completedDates,['2026-11-01']);
 await m.reconcile(input(edited));assert.equal(f.items.length,6);
 assert.ok(f.items.every(n=>n.content.data.title==='정리'));
 assert.ok(f.items.every(n=>new Date(n.content.data.fireAt).toISOString().includes('13:00:00')));
});

test('completion/deletion/OFF remove owned reminders without touching recipe or unrelated alarms',async()=>{
 const f=fake(),m=manager(f);const other={identifier:'recipe',content:{data:{owner:'module3.recipe.v1'}}};f.items=[other];
 await m.reconcile(input());await m.reconcile(input(toggleRoutineComplete(state(),'r1','2026-11-01')));assert.equal(f.items.length,7);
 await m.reconcile(input({routines:[]}));assert.deepEqual(f.items,[other]);
 await m.reconcile(input());await m.reconcile(input(state(),'a',{enabled:false}));assert.deepEqual(f.items,[other]);
});

test('permission denied removes previous owned schedules and does not request permission implicitly',async()=>{
 const f=fake(),m=manager(f);await m.reconcile(input());f.permission=false;
 const result=await m.reconcile(input());assert.equal(result.status,'permission_denied');assert.equal(f.items.length,0);
});

test('switch/logout clears previous account; loading/failed preference read keeps current valid schedule but removes deleted routines',async()=>{
 const f=fake(),m=manager(f);await m.reconcile(input());
 await m.reconcile(input(null,'a',{ready:false}));assert.equal(f.items.length,7);
 await m.reconcile(input({routines:[]},'a',{ready:false}));assert.equal(f.items.length,0);
 await m.reconcile(input());await m.reconcile(input(null,'b',{ready:false}));assert.equal(f.items.length,0);
 await m.reconcile(input(state(),'b'));assert.ok(f.items.every(n=>n.content.data.scope==='b'));
 await m.reconcile({scope:null,ready:true,enabled:false});assert.equal(f.items.length,0);
});

test('partial scheduling failure rolls back new reservations; next launch can recover and deduplicate',async()=>{
 const f=fake(),m=manager(f);f.failScheduleAt=2;
 await assert.rejects(m.reconcile(input()),/schedule failed/);assert.equal(f.items.length,0);
 f.failScheduleAt=null;await manager(f).reconcile(input());assert.equal(f.items.length,7);
 await manager(f).reconcile(input());assert.equal(f.items.length,7);
});

test('cancel failure is reported; retry removes stale schedules before creating new ones',async()=>{
 const f=fake(),m=manager(f);await m.reconcile(input());f.failCancel=true;
 await assert.rejects(m.reconcile(input(state(),'a',{enabled:false})),/cancel failed/);
 assert.equal(f.items.length,7);f.failCancel=false;await m.reconcile(input(state(),'a',{enabled:false}));assert.equal(f.items.length,0);
});

test('logout during an in-flight schedule invalidates old work and cancels its late reservation',async()=>{
 const f=fake();let release,entered;
 const gate=new Promise(resolve=>{release=resolve;}),started=new Promise(resolve=>{entered=resolve;});
 const m=createRoutineNotificationCoordinator({list:()=>f.list(),allowed:()=>f.allowed(),cancel:id=>f.cancel(id),schedule:async p=>{entered();await gate;return f.schedule(p);}},()=>NOW);
 const old=m.reconcile(input());await started;
 const logout=m.reconcile({scope:null,ready:true,enabled:false});release();
 const results=await Promise.all([old,logout]);assert.equal(results[0].status,'superseded');assert.equal(f.items.length,0);
});

test('budget rejection never silently drops some routines or cancels unrelated reservations',async()=>{
 const f=fake(),m=manager(f);await m.reconcile(input());
 const others=Array.from({length:PENDING_BUDGET},(_,i)=>({identifier:'other'+i,content:{data:{owner:'other'}}}));f.items=[...f.items,...others];
 await assert.rejects(m.reconcile(input()),/한도/);assert.deepEqual(f.items,others);
});

test('notification tap accepts current account and existing routine only',()=>{
 const data={owner:ROUTINE_OWNER,scope:'a',routineId:'r1'};
 assert.equal(routineNotificationPath(data,'a',state()),'/routine');
 assert.equal(routineNotificationPath(data,'b',state()),null);
 assert.equal(routineNotificationPath(data,'a',{routines:[]}),null);
 assert.equal(routineNotificationPath({...data,owner:'other'},'a',state()),null);
});

test('saved routine edits persist per-item OFF and preserve records; failed disk writes do not trigger listeners',async()=>{
 let raw=null,fail=false,published=0;
 const store=createRoutineStore({getItem:async()=>raw,setItem:async(k,value)=>{if(fail)throw Error('full');raw=value;}},'a');
 store.subscribe(()=>published++);
 await store.update(()=>state());await store.update(s=>toggleRoutineReminder(s,'r1'));
 await store.update(s=>editRoutine(s,'r1',{...routine(),reminderTime:'22:00'}));
 assert.equal(parseRoutineState(raw).routines[0].remindersEnabled,false);
 const before=published;fail=true;await assert.rejects(store.update(()=>({routines:[]})),/full/);
 assert.equal(published,before);assert.equal(store.getState().routines.length,1);
});

test('rollback cancellation failure is explicit and the next reconciliation repairs partial OS state',async()=>{
 const f=fake(),m=manager(f);f.failScheduleAt=2;f.failCancel=true;
 await assert.rejects(m.reconcile(input()),/일부 알림 예약 정리/);assert.equal(f.items.length,2);
 f.failScheduleAt=null;f.failCancel=false;await manager(f).reconcile(input());assert.equal(f.items.length,7);
});

test('returning after a week rebuilds only future dates and leaves no past backlog',async()=>{
 const f=fake();let now=NOW;const m=manager(f,()=>now);
 await m.reconcile(input());const old=f.items.map(n=>n.identifier);
 now=new Date(NOW.getTime()+8*86400000);const result=await m.reconcile(input());
 assert.equal(result.count,7);assert.ok(f.items.every(n=>n.content.data.fireAt>now.getTime()));
 assert.ok(old.every(id=>f.cancelled.includes(id)));
});

test('completion/OFF/logout dismiss delivered routine cards but preserve unread current and recipe cards',async()=>{
 const f=fake(),plan=planRoutineNotifications(state(),'a',NOW);
 let displayed=[{request:{identifier:'shown',content:{data:{owner:ROUTINE_OWNER,...plan[0]}}}},{request:{identifier:'recipe',content:{data:{owner:'module3.recipe.v1'}}}}];
 const m=createRoutineNotificationCoordinator({list:()=>f.list(),allowed:()=>f.allowed(),cancel:id=>f.cancel(id),schedule:p=>f.schedule(p),
  presented:async()=>displayed,dismiss:async id=>{displayed=displayed.filter(n=>n.request.identifier!==id);}},()=>new Date('2026-11-01T13:00:00Z'));
 await m.reconcile(input());assert.equal(displayed.length,2); // past delivery is still unread, not auto-dismissed by refresh
 await m.reconcile(input(toggleRoutineComplete(state(),'r1','2026-11-01')));assert.deepEqual(displayed.map(n=>n.request.identifier),['recipe']);
 displayed.push({request:{identifier:'old-account',content:{data:{owner:ROUTINE_OWNER,...plan[0]}}}});
 await m.reconcile({scope:null,ready:true,enabled:false});assert.deepEqual(displayed.map(n=>n.request.identifier),['recipe']);
});
