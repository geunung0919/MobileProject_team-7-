import test from 'node:test';
import assert from 'node:assert/strict';
import {fromTeamItem,toTeamItem} from '../integration/inventoryBridge.mjs';
import {resolveTarget} from '../integration/routes.mjs';
import {saveInventory,useInventory,monthlyWaste} from '../module3/domain/nonAi.mjs';
import {applyDiscard,undoLatest} from '../module3/domain/transactions.mjs';
test('team purchase -> shared inventory -> partial use -> undo keeps home quantities and costs',()=>{
 const item=fromTeamItem({name:'달걀',quantity:6,unit:'개',purchaseDate:'2026-11-06',expiry:'2026-11-10',date_source:'reference',remainingCost:3000},'egg');
 let state=saveInventory({inventory:[],processedIds:[],meals:[],discards:[],shopping:[]},item,'create');
 state=useInventory(state,'egg',2,'use');assert.equal(toTeamItem(state.inventory[0]).quantity,'4개');assert.equal(state.inventory[0].remainingCost,2000);
 state=undoLatest(state,'use');assert.equal(toTeamItem(state.inventory[0]).quantity,'6개');assert.equal(state.inventory[0].remainingCost,3000);
 state=applyDiscard(state,'egg',3,'상태 확인','discard');assert.equal(state.inventory[0].remainingCost,1500);assert.equal(state.discards[0].cost,1500);
});
test('navigation bridge covers nested use/discard, shopping registration and recipe conditions',()=>{
 assert.equal(resolveTarget('/inventory/use/egg').params.id,'egg');
 assert.equal(resolveTarget('/inventory/discard/egg').params.id,'egg');
 assert.equal(resolveTarget('/recipe/conditions').params.id,undefined);
 assert.equal(resolveTarget({pathname:'/inventory/new',params:{shoppingId:'s1'}}).params.shoppingId,'s1');
 assert.deepEqual(resolveTarget('/(tabs)/inventory'),{name:'Tabs',params:{screen:'Fridge'}});
});
test('bridge does not invent storage method or expiry and distinguishes zero cost',()=>{
 const i=fromTeamItem({name:'우유',quantity:1,remainingCost:0},'milk');assert.equal(i.expiresAt,'');assert.equal(i.storageMethod,'');assert.equal(i.remainingCost,0);assert.equal(toTeamItem(i).expiry,null);
});
