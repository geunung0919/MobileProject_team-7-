import {inventoryRecord} from './inventoryFields.mjs';
import {saveInventory} from './nonAi.mjs';

// The receipt module must supply reviewed quantity/content units and dates.
// Purchase pack counts are never guessed into grams, ml, or pieces.
export function receiptInventoryRecord(input, id) {
 if(input.reviewStatus!=='confirmed'||input.inventorySelected!==true)throw new Error('재고 등록할 품목을 선택하고 확인해 주세요.');
 for(const key of ['receiptId','receiptItemId','expenseId'])if(typeof input[key]!=='string'||!input[key].trim())throw new Error('영수증·품목·소비 ID가 필요해요.');
 if(!['ingredient','prepared_food','household'].includes(input.itemType))throw new Error('재고로 등록 가능한 분류를 선택해 주세요.');
 return inventoryRecord({
  name:input.name,quantity:input.quantity,unit:input.unit,
  category:input.itemType==='household'?'household':'food',
  purchasedAt:input.purchasedAt,expiresAt:input.expiresAt||'',
  storageMethod:input.storageMethod,dateType:input.dateType,
  remainingCost:input.linePaidAmount??null,
  sourceReceiptId:input.receiptId,sourceReceiptItemId:input.receiptItemId,sourceExpenseId:input.expenseId,
  rawName:input.rawName||input.name,
 },id);
}
export function registerReceiptInventory(state,input,id,eventId) {
 const record=receiptInventoryRecord(input,id);
 const key=JSON.stringify([input.receiptId,input.receiptItemId]);
 // Preserve links even after stock is consumed/deleted, so retries cannot recreate it.
 const links=state.receiptInventoryLinks||{};
 if(Object.prototype.hasOwnProperty.call(links,key))return state;
 const existing=state.inventory.find(i=>i.sourceReceiptId===input.receiptId&&i.sourceReceiptItemId===input.receiptItemId);
 if(existing)return {...state,receiptInventoryLinks:{...links,[key]:existing.id}};
 const next=saveInventory(state,record,eventId);
 return {...next,receiptInventoryLinks:{...links,[key]:record.id}};
}
