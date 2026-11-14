import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, fridgeActions, parseState, storageKey } from '../src/features/fridge/domain/store.mjs';
import { createReminderManager, recipeNotificationPath, REMINDER_OWNER } from '../src/features/fridge/domain/reminders.mjs';
const item = { name:'달걀', quantity:4, unit:'개', expiresAt:'2099-12-01', remainingCost:1200 };
const expense = {id:'expense-1',category:'groceries'};
const recipe = {id:'egg', name:'달걀 요리', ingredients:[{name:'달걀',unit:'개',quantity:1}]};
function disk() { const data = new Map(); return {getItem:async key=>data.get(key)??null,setItem:async(key,value)=>{data.set(key,value);}}; }
function actions(store) { return fridgeActions(fn=>store.update(fn),()=> 'shopping-1'); }

test('old account storage migrates without injecting sample inventory or dropping import markers', () => {
 const old={version:1,inventory:[{id:'legacy',...item}],meals:[],shopping:[],importedExpenseIds:['old-expense']};
 const next=parseState(JSON.stringify(old));
 assert.deepEqual(next.inventory,old.inventory);
 assert.deepEqual(next.importedExpenseIds,['old-expense']);
 assert.deepEqual(next.discards,[]);assert.equal(next.undo,null);
 assert.throws(()=>parseState(JSON.stringify({...next,undo:{kind:'meal',id:'x',inventory:[{}]}})));
});

test('spending import, meal, discard, persistent undo and duplicate protection share one account queue', async()=>{
 const storage=disk(),key=storageKey('https://test','a'),store=createStore(storage,key),api=actions(store);
 await api.importPurchase(expense,[item]);
 const imported=store.getState().inventory[0];
 await api.saveItem({...imported,remainingCost:1200,storageMethod:'refrigerated',dateType:'package'});
 await api.recordMeal(recipe,recipe.ingredients,'meal-1');
 assert.equal(store.getState().inventory[0].quantity,3);
 assert.equal(store.getState().inventory[0].remainingCost,900);
 assert.equal(store.getState().inventory[0].sourceExpenseId,expense.id);
 await api.discardItem(imported.id,1,'손상','discard-1');
 assert.equal(store.getState().inventory[0].remainingCost,600);
 const reopened=createStore(storage,key);await reopened.load();
 await actions(reopened).undoLatest('discard-1');
 assert.equal(reopened.getState().inventory[0].quantity,3);
 assert.equal(reopened.getState().inventory[0].remainingCost,900);
 assert.equal(reopened.getState().discards.length,0);
 assert.equal(reopened.getState().meals.length,1);
 await assert.rejects(actions(reopened).importPurchase(expense,[item]),/이미/);
 assert.equal((await createStore(storage,storageKey('https://test','b')).load()).inventory.length,0);
});

test('new spending import ends previous undo so undo cannot erase a new purchase',async()=>{
 const store=createStore(disk(),'test'),api=actions(store);
 await api.saveItem({...item,id:'egg'});
 await api.recordMeal(recipe,recipe.ingredients,'meal');
 await api.importPurchase(expense,[item]);
 await assert.rejects(api.undoLatest('meal'),/되돌릴/);
 assert.equal(store.getState().inventory.length,2);
});

test('shopping registration survives restart and cannot duplicate an inventory batch', async()=>{
 const storage=disk(),store=createStore(storage,'shopping'),api=actions(store);
 await api.addShopping([item]);
 await api.registerShopping('shopping-1',{...item,id:'purchased'});
 const reopened=createStore(storage,'shopping');await reopened.load();
 await assert.rejects(actions(reopened).registerShopping('shopping-1',{...item,id:'again'}),/이미/);
 assert.equal(reopened.getState().inventory.length,1);
});

test('failed durable write leaves meal and inventory unchanged; same transaction can retry',async()=>{
 const storage=disk(),persist=storage.setItem,store=createStore(storage,'test'),api=actions(store);
 await api.saveItem({...item,id:'egg'});
 storage.setItem=async()=>{throw Error('disk full');};
 await assert.rejects(api.recordMeal(recipe,recipe.ingredients,'meal'),/disk full/);
 assert.equal(store.getState().inventory[0].quantity,4);assert.equal(store.getState().meals.length,0);
 storage.setItem=persist;
 await api.recordMeal(recipe,recipe.ingredients,'meal');
 await api.recordMeal(recipe,recipe.ingredients,'meal');
 assert.equal(store.getState().inventory[0].quantity,3);assert.equal(store.getState().meals.length,1);
});

test('recipe reminders list/cancel/tap are scoped to authenticated account',async()=>{
 const records=['a','b'].map(scope=>({identifier:scope,content:{data:{owner:REMINDER_OWNER,scope,key:'daily',recipeId:'egg'}}}));
 const cancelled=[];
 const api={getAllScheduledNotificationsAsync:async()=>records,cancelScheduledNotificationAsync:async id=>cancelled.push(id)};
 const manager=createReminderManager(api,'a');
 assert.deepEqual((await manager.list()).map(n=>n.identifier),['a']);
 await manager.cancel('b');assert.deepEqual(cancelled,[]);
 await manager.cancel('a');assert.deepEqual(cancelled,['a']);
 assert.equal(recipeNotificationPath(records[1].content.data,[recipe],'a'),null);
 assert.equal(recipeNotificationPath(records[0].content.data,[recipe],'a'),'/fridge/recipe/egg');
});
