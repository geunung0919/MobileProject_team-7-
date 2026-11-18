// Pure command handler: no React, AsyncStorage, Firebase SDK or credentials.
// Server must authenticate the user, read current state, execute this inside
// its transaction and persist all affected records atomically.
import {inventoryRecord} from './inventoryFields.mjs';
import {saveInventory,useInventory,logChange} from './nonAi.mjs';
import {applyMeal,applyDiscard,undoLatest} from './transactions.mjs';
import {registerReceiptInventory} from './receiptInventory.mjs';
export function executeInventoryCommand(state,command,{now=new Date().toISOString()}={}) {
 const {type,requestId,payload={}}=command;
 if(typeof requestId!=='string'||!requestId.trim())throw new Error('요청 ID가 필요해요.');
 if((state.processedIds||[]).includes(requestId))return state;
 let next;
 switch(type){
 case 'inventory.save': {
  const before=state.inventory.find(i=>i.id===payload.item?.id);
  if(payload.expectedVersion!==undefined&&(before?.version||0)!==payload.expectedVersion)throw new Error('재고가 변경되었어요. 새로 조회해 주세요.');
  const item=inventoryRecord(payload.item,payload.item?.id||requestId,before||{});
  next=saveInventory(state,item,requestId,now);break;
 }
 case 'inventory.use':next=useInventory(state,payload.id,payload.quantity,requestId,now);break;
 case 'inventory.discard':next=applyDiscard(state,payload.id,payload.quantity,payload.reason||'',requestId,now);break;
 case 'meal.complete':next=applyMeal(state,payload.recipe,payload.usage,requestId,now);break;
 case 'inventory.undo':next=logChange(undoLatest(state,payload.operationId),'undo',null,{id:payload.operationId},requestId,now);break;
 case 'receipt.register':next=registerReceiptInventory(state,payload,requestId,requestId);break;
 default:throw new Error('지원하지 않는 재고 명령이에요.');
 }
 if(next===state)return state;
 return {...next,processedIds:[...new Set([...(next.processedIds||[]),requestId])]};
}
