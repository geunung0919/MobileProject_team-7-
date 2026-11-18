import test from 'node:test';
import assert from 'node:assert/strict';
import {searchRecipes} from '../src/domain/recipeSearch.mjs';
import {mergeShopping,purchaseUrl,registerPurchased,shoppingItem} from '../src/domain/shopping.mjs';
import {nextReminderDate,reminderTime,recipeNotificationPath,createReminderManager,REMINDER_OWNER} from '../src/domain/reminders.mjs';
const recipes=[{id:'egg',name:'달걀 덮밥',minutes:10,ingredients:[{name:'달걀',quantity:2,unit:'개'}]},{id:'tofu',name:'두부 김치',minutes:15,ingredients:[{name:'두부',quantity:1,unit:'모'}]}];
test('empty inventory still allows catalog search, aliases and combined filters',()=>{
 assert.equal(searchRecipes(recipes,[],{}).length,2);
 assert.deepEqual(searchRecipes(recipes,[],{query:'계란 덮밥',maxMinutes:10}).map(r=>r.id),['egg']);
 assert.equal(searchRecipes(recipes,[],{readyOnly:true}).length,0);
 assert.equal(searchRecipes(recipes,[],{query:'두부',maxMinutes:10}).length,0);
 assert.equal(searchRecipes(recipes,[],{query:'없는 음식'}).length,0);
});
test('ready filter excludes expired and mismatched-unit inventory',()=>{
 const stocks=[{name:'달걀',quantity:10,unit:'개',expiresAt:'2000-01-01'},{name:'달걀',quantity:10,unit:'g',expiresAt:'2099-01-01'}];
 assert.equal(searchRecipes(recipes,stocks,{readyOnly:true}).length,0);
 stocks.push({name:'달걀',quantity:2,unit:'개',expiresAt:'2099-01-01'});
 assert.deepEqual(searchRecipes(recipes,stocks,{readyOnly:true}).map(r=>r.id),['egg']);
});
test('shopping repeated shortage adds max, purchased items remain independent',()=>{
 const old=[{id:'1',name:'두부',unit:'모',quantity:1,done:false}];
 const next=mergeShopping(old,[{name:'두부',unit:'모',quantity:2},{name:'두부',unit:'모',quantity:1}],()=> 'new');
 assert.equal(next.length,1);assert.equal(next[0].quantity,2);assert.equal(old[0].quantity,1);
 assert.equal(mergeShopping([{...old[0],done:true}],[{name:'두부',unit:'모',quantity:1}],()=> 'new').length,2);
 assert.throws(()=>shoppingItem({name:'두부',unit:'모',quantity:-1}));
 assert.throws(()=>shoppingItem({name:'두부',unit:'모',quantity:Infinity}));
});
test('purchase URL encodes user text without changing destination',()=>{
 const url=new URL(purchaseUrl('두부 & 계란 #1'));assert.equal(url.hostname,'www.coupang.com');assert.equal(url.searchParams.get('q'),'두부 & 계란 #1');
});
test('purchase-to-inventory links atomically and prevents duplicate registration',()=>{
 const state={inventory:[],shopping:[{id:'s',name:'두부',quantity:1,unit:'모',done:true}],undo:{id:'old'}};
 const next=registerPurchased(state,'s',{id:'batch',name:'두부'});
 assert.equal(next.inventory.length,1);assert.equal(next.shopping[0].inventoryId,'batch');assert.equal(next.undo,null);
 assert.equal(state.inventory.length,0);
 assert.throws(()=>registerPurchased(next,'s',{id:'other'}));
 assert.throws(()=>registerPurchased(state,'missing',{id:'other'}));
});
test('reminder time validates and rolls past time to next day',()=>{
 assert.throws(()=>reminderTime('',0));assert.throws(()=>reminderTime(24,0));assert.throws(()=>reminderTime(12,60));assert.throws(()=>reminderTime(1.5,0));
 const now=new Date(2026,9,30,19,0);const next=nextReminderDate(18,30,now);
 assert.equal(next.getDate(),31);assert.equal(next.getHours(),18);
 assert.equal(nextReminderDate(20,0,now).getDate(),30);
});
test('notification route only accepts owned, known recipe identifiers',()=>{
 assert.equal(recipeNotificationPath({owner:'other',recipeId:'egg'},recipes),null);
 assert.equal(recipeNotificationPath({owner:REMINDER_OWNER,recipeId:'egg'},recipes),'/recipe/egg');
 assert.equal(recipeNotificationPath({owner:REMINDER_OWNER,recipeId:'https://bad'},recipes),'/(tabs)/recipe');
});
test('replacing reminder leaves unrelated notifications and rollback handles cancellation error',async()=>{
 let rows=[{identifier:'old',content:{data:{owner:REMINDER_OWNER,key:'daily'}}},{identifier:'unrelated',content:{data:{owner:'other'}}}];
 let fail=false;
 const api={getAllScheduledNotificationsAsync:async()=>rows,scheduleNotificationAsync:async req=>{rows.push({...req,identifier:'new'});return 'new';},cancelScheduledNotificationAsync:async id=>{if(fail&&id==='old')throw Error('cancel failed');rows=rows.filter(r=>r.identifier!==id);}};
 const request={content:{data:{owner:REMINDER_OWNER,key:'daily'}}};const manager=createReminderManager(api);
 fail=true;await assert.rejects(manager.schedule(request));assert.deepEqual(rows.map(r=>r.identifier),['old','unrelated']);
 fail=false;await manager.schedule(request);assert.deepEqual(rows.map(r=>r.identifier),['unrelated','new']);
 await manager.cancel('unrelated');assert.equal(rows.length,2);
 await manager.cancel('new');assert.equal(rows.length,1);
});
