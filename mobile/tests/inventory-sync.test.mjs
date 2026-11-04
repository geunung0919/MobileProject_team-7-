import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, fridgeActions, parseState, storageKey } from '../src/features/fridge/domain/store.mjs';
import { inventoryToServer, inventoryFromServer, sameInventory, validateRemote, createInventorySync } from '../src/features/fridge/domain/sync.mjs';
import { daysLeft, available } from '../src/features/fridge/domain/inventory.mjs';
import { inventoryDraft, inventoryRecord, validateInventoryDraft } from '../src/features/fridge/domain/inventoryFields.mjs';
const item={id:'egg',name:'달걀',quantity:4,unit:'개',storageMethod:'refrigerated',dateType:'package',expiresAt:'2099-01-01',purchasedAt:'2026-10-01',remainingCost:1200,sourceExpenseId:'purchase'};
const clone=value=>JSON.parse(JSON.stringify(value));
const response=(data,revision=1)=>({revision,snapshot:{schema_version:'1.0',source_updated_at:'2026-11-01T00:00:00Z',data:clone(data)}});
function server(){
 let remote=null,online=true,lost=false;let writes=0;
 return {get remote(){return clone(remote);},set remote(value){remote=clone(value);},set online(value){online=value;},set loseResponse(value){lost=value;},get writes(){return writes;},
  api:async(path,method='GET',body)=>{
   assert.equal(path,'me/inventory');if(!online)throw Error('offline');
   if(method==='GET'){if(!remote)throw Object.assign(Error('missing'),{status:404});return clone(remote);}
   assert.equal(method,'PUT');
   if(body.expected_revision!==(remote?.revision??0))throw Object.assign(Error('conflict'),{status:409});
   writes++;remote=response(body.data,(remote?.revision??0)+1);
   if(lost){lost=false;throw Error('response lost');}return clone(remote);
  }};
}
function disk(){const values=new Map();return{getItem:async k=>values.get(k)??null,setItem:async(k,v)=>values.set(k,v)};}
async function setup(){const storage=disk(),remote=server(),store=createStore(storage,'account');await store.load();const actions=fridgeActions(fn=>store.update(fn),()=> 'id');const sync=createInventorySync(store,remote.api);return{storage,remote,store,actions,sync};}
async function link(ctx){await ctx.actions.saveItem(item);await ctx.sync.resolve('upload',await ctx.sync.inspect());}

test('wire adapter preserves supported meaning, rejects unsupported units and incomplete batches without partial uploads',()=>{
 const data=inventoryToServer([item]);
 assert.deepEqual(data.items[0],{item_id:'egg',name:'달걀',quantity:4,unit:'piece',storage:'fridge',target_date:'2099-01-01',date_source:'label'});
 for(const unit of ['모','공기','__proto__','kg'])assert.throws(()=>inventoryToServer([{...item,unit}]),/단위/);
 assert.throws(()=>inventoryToServer([{...item,storageMethod:undefined}]),/보관/);
 assert.throws(()=>inventoryToServer([{...item,dateType:undefined}]),/날짜/);
 assert.throws(()=>inventoryToServer([item,item]),/ID/);
 assert.throws(()=>inventoryToServer([{...item,quantity:1000001}]),/수량/);
 assert.throws(()=>inventoryToServer(Array.from({length:501},(_,i)=>({...item,id:String(i)}))),/500/);
 assert.equal(inventoryToServer([{...item,unit:'팩',dateType:'unknown',expiresAt:null}]).items[0].target_date,null);
});

test('first upload is explicit; local changes then sync to new revision without refreshing unchanged server data',async()=>{
 const c=await setup();await c.actions.saveItem(item);await c.sync.sync();assert.equal(c.remote.writes,0);
 await c.sync.resolve('upload',await c.sync.inspect());assert.equal(c.remote.writes,1);
 await c.actions.saveItem({...item,quantity:3,remainingCost:900});await c.sync.sync();
 assert.equal(c.remote.remote.revision,2);assert.equal(c.remote.remote.snapshot.data.items[0].quantity,3);
 await c.sync.sync();assert.equal(c.remote.writes,2);assert.equal(c.store.getState().inventorySync.sourceUpdatedAt,'2026-11-01T00:00:00Z');
});

test('two devices: unchanged local takes remote; local metadata is kept only when it still means the same thing',async()=>{
 const c=await setup();await link(c);
 const second=createStore(c.storage,storageKey('https://test','device-2'));await second.load();
 const syncB=createInventorySync(second,c.remote.api);await syncB.resolve('download',await syncB.inspect());
 const actionsB=fridgeActions(fn=>second.update(fn),()=> 'id');
 await actionsB.saveItem({...second.getState().inventory[0],quantity:2});await syncB.sync();
 await c.sync.sync();
 assert.equal(c.store.getState().inventory[0].quantity,2);assert.equal(c.store.getState().inventory[0].remainingCost,null);
 assert.equal(c.store.getState().inventory[0].purchasedAt,item.purchasedAt);
 assert.equal(c.store.getState().inventory[0].sourceExpenseId,item.sourceExpenseId);
 assert.equal(second.getState().inventory[0].purchasedAt,undefined);
});

test('both sides change: stop, preserve local, require a fresh explicit choice and revision',async()=>{
 const c=await setup();await link(c);
 await c.actions.saveItem({...item,quantity:3});
 c.remote.remote=response(inventoryToServer([{...item,quantity:2}]),2);
 await assert.rejects(c.sync.sync(),e=>e.status===409);
 assert.equal(c.store.getState().inventory[0].quantity,3);assert.equal(c.remote.remote.snapshot.data.items[0].quantity,2);
 const oldPreview=await c.sync.inspect();c.remote.remote=response(inventoryToServer([{...item,quantity:1}]),3);
 await assert.rejects(c.sync.resolve('upload',oldPreview),e=>e.status===409);
 await c.sync.resolve('upload',await c.sync.inspect());
 assert.equal(c.remote.remote.revision,4);assert.equal(c.remote.remote.snapshot.data.items[0].quantity,3);
});

test('local edit after preview cannot be silently overwritten by a download',async()=>{
 const c=await setup();await link(c);const preview=await c.sync.inspect();await c.actions.saveItem({...item,quantity:3});
 await assert.rejects(c.sync.resolve('download',preview),e=>e.status===409);
 assert.equal(c.store.getState().inventory[0].quantity,3);
});

test('offline writes stay local; lost PUT response recovers by GET without duplicate write',async()=>{
 const c=await setup();await link(c);await c.actions.saveItem({...item,quantity:3});c.remote.online=false;
 await assert.rejects(c.sync.sync(),/offline/);assert.equal(c.store.getState().inventory[0].quantity,3);
 c.remote.online=true;c.remote.loseResponse=true;await assert.rejects(c.sync.sync(),/lost/);
 assert.equal(c.store.getState().inventorySync.revision,1);assert.equal(c.remote.writes,2);
 await c.sync.sync();assert.equal(c.remote.writes,2);assert.equal(c.store.getState().inventorySync.revision,2);
});

test('disk failure after a successful PUT does not publish sync success and can recover',async()=>{
 const c=await setup();await link(c);await c.actions.saveItem({...item,quantity:3});
 const original=c.storage.setItem;c.storage.setItem=async()=>{throw Error('full');};
 await assert.rejects(c.sync.sync(),/full/);assert.equal(c.store.getState().inventorySync.revision,1);
 c.storage.setItem=original;await c.sync.sync();assert.equal(c.store.getState().inventorySync.revision,2);assert.equal(c.remote.writes,2);
 const reopened=createStore(c.storage,'account');await reopened.load();assert.equal(reopened.getState().inventorySync.revision,2);
});

test('local mutation during network operation is queued and eventually uploaded without losing the edit',async()=>{
 const c=await setup();await link(c);await c.actions.saveItem({...item,quantity:3});
 let release;const gate=new Promise(resolve=>{release=resolve;});let entered;
 const started=new Promise(resolve=>{entered=resolve;});
 const delayed=createInventorySync(c.store,async(...args)=>{if(args[1]==='PUT'){entered();await gate;}return c.remote.api(...args);});
 const pending=delayed.sync();await started;
 const mutation=c.actions.saveItem({...item,quantity:2});release();await Promise.all([pending,mutation]);await c.sync.sync();
 assert.equal(c.remote.remote.snapshot.data.items[0].quantity,2);assert.equal(c.store.getState().inventory[0].quantity,2);
});

test('explicit empty inventory is distinct from missing, download invalidates old undo and paused sync never writes',async()=>{
 const c=await setup();assert.equal((await c.sync.inspect()).remote,null);
 await c.sync.resolve('upload',await c.sync.inspect());assert.equal(c.remote.remote.snapshot.data.items.length,0);
 await c.actions.saveItem(item);await c.sync.sync();
 await c.actions.discardItem('egg',1,'','discard');assert.ok(c.store.getState().undo);
 await c.sync.resolve('download',await c.sync.inspect());assert.equal(c.store.getState().undo,null);
 await c.sync.pause();const before=c.remote.writes;await c.actions.deleteItem('egg');await c.sync.sync();assert.equal(c.remote.writes,before);
});

test('unknown server date is not invented, survives disk reload, and is excluded from dated cooking availability',()=>{
 const data=inventoryToServer([{...item,dateType:'unknown',expiresAt:null}]);
 const restored=inventoryFromServer(data);assert.equal(restored[0].expiresAt,null);
 assert.equal(Number.isNaN(daysLeft(null)),true);assert.equal(available(restored,item),0);
 assert.equal(inventoryDraft(restored[0]).expiresAt,'');
 const draft={...inventoryDraft(restored[0]),purchasedAt:'2026-10-01'};
 assert.equal(validateInventoryDraft(draft,'2026-11-01'),'');assert.equal(inventoryRecord(draft,'egg').expiresAt,null);
 const raw={version:1,inventory:restored,shopping:[],meals:[],importedExpenseIds:[]};assert.equal(parseState(JSON.stringify(raw)).inventory[0].expiresAt,null);
});

test('server validation rejects malformed responses and canonical equality ignores ordering only',()=>{
 const data=inventoryToServer([item]);assert.equal(sameInventory(data,{items:[{...data.items[0]}]}),true);
 assert.throws(()=>validateRemote(response({items:[{...data.items[0],unit:'모'}]})),/형식/);
 assert.throws(()=>validateRemote({revision:1,snapshot:{data,source_updated_at:'invalid'}}),/형식/);
 assert.equal(sameInventory(data,{items:[{...data.items[0],quantity:1}]}),false);
});
