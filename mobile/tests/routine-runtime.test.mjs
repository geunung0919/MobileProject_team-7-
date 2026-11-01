import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoutineRuntime,validateNotificationSettings} from '../src/features/routine/domain/runtime.mjs';
const settings=enabled=>({spending_alerts:true,inventory_alerts:false,routine_reminders:enabled});
test('a delayed preference GET cannot re-enable reminders after an explicit OFF',()=>{
 const runtime=createRoutineRuntime(null,'a',null),ticket=runtime.start();
 const oldRead=runtime.beginRead(ticket);runtime.applySettings(ticket,settings(false));
 assert.equal(runtime.acceptRead(ticket,oldRead,settings(true)),false);
 assert.equal(runtime.getPreferences().routine_reminders,false);
});
test('newer preference reads win; malformed data never replaces last saved settings',()=>{
 const runtime=createRoutineRuntime(null,'a',null),ticket=runtime.start();
 const old=runtime.beginRead(ticket),latest=runtime.beginRead(ticket);
 assert.equal(runtime.acceptRead(ticket,latest,settings(true)),true);
 assert.equal(runtime.acceptRead(ticket,old,settings(false)),false);
 assert.throws(()=>runtime.applySettings(ticket,{routine_reminders:false}));
 assert.deepEqual(runtime.getPreferences(),settings(true));
 assert.throws(()=>validateNotificationSettings({...settings(true),routine_reminders:1}));
});
test('late loads and preference updates are fenced out after logout or effect restart',()=>{
 const runtime=createRoutineRuntime(null,'a',null),old=runtime.start();runtime.stop(old);
 assert.throws(()=>runtime.acceptState(old,{routines:[]}));
 assert.throws(()=>runtime.applySettings(old,settings(true)));
 const current=runtime.start();assert.equal(runtime.isLive(old),false);
 runtime.acceptState(current,{routines:[]});assert.deepEqual(runtime.getState(),{routines:[]});
});
