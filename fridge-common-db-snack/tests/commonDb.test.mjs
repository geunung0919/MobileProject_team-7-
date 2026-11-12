import test from 'node:test';
import assert from 'node:assert/strict';
import {executeInventoryCommand} from '../module3/domain/inventoryCommands.mjs';
import {applyDiscard,undoLatest,planMeal} from '../module3/domain/transactions.mjs';
import {available} from '../module3/domain/inventory.mjs';
const state=()=>({inventory:[],meals:[],shopping:[],discards:[],usages:[],processedIds:[]});
const payload={reviewStatus:'confirmed',inventorySelected:true,receiptId:'r',receiptItemId:'line1',expenseId:'e',name:'우유',rawName:'우유900ML',itemType:'ingredient',quantity:1800,unit:'ml',purchasedAt:'2026-01-01',expiresAt:'2099-01-01',storageMethod:'refrigerated',dateType:'package',linePaidAmount:5000};
const receive=(s,p=payload,id='stock')=>executeInventoryCommand(s,{type:'receipt.register',requestId:id,payload:p});
test('영수증 출처와 표준 ID 저장, 재시도 및 소진 후 중복 등록 방지',()=>{
 const a=receive(state());assert.equal(a.inventory[0].ingredientId,'milk');assert.equal(a.inventory[0].sourceExpenseId,'e');
 assert.equal(receive(a,payload,'retry'),a);
 const b=applyDiscard(a,'stock',1800,'폐기','discard');assert.equal(receive(b,payload,'retry2'),b);
});
test('미확인 분류·미선택·없는 날짜·단위·금액 검증',()=>{
 for(const patch of [{reviewStatus:'needs_review'},{inventorySelected:false},{itemType:'unknown'},{expiresAt:''},{unit:null},{linePaidAmount:-1},{receiptItemId:''}])assert.throws(()=>receive(state(),{...payload,...patch}));
 assert.equal(receive(state(),{...payload,linePaidAmount:null}).inventory[0].remainingCost,null);
});
test('직접 저장도 검증하고 버전 충돌은 변경하지 않음',()=>{
 const a=receive(state());assert.throws(()=>executeInventoryCommand(a,{type:'inventory.save',requestId:'edit',payload:{item:{...a.inventory[0],name:''}}}));
 assert.throws(()=>executeInventoryCommand(a,{type:'inventory.save',requestId:'edit',payload:{item:a.inventory[0],expectedVersion:0}}));
});
test('되돌리기는 관련 없는 신규 재고 보존, 대상 변경 시 거부',()=>{
 const a=receive(state());const b=applyDiscard(a,'stock',200,'일부','d');
 const c={...b,inventory:[...b.inventory,{id:'other',name:'기타',quantity:2}]};
 const undone=undoLatest(c,'d');assert.equal(undone.inventory.find(i=>i.id==='stock').quantity,1800);assert.equal(undone.inventory.find(i=>i.id==='other').quantity,2);assert.ok(undone.inventory.find(i=>i.id==='stock').version>b.inventory[0].version);
 assert.throws(()=>undoLatest({...b,inventory:b.inventory.map(i=>({...i,quantity:1500}))},'d'));
});
test('ID 및 별칭 기반 충분량 표시와 실제 차감 일치',()=>{
 const rows=[{name:'계란',unit:'개',quantity:2}];const inventory=[{id:'a',name:'달걀',ingredientId:'egg',unit:'개',quantity:3,expiresAt:'2099-01-01',remainingCost:900}];
 assert.equal(available(inventory,rows[0]),3);const p=planMeal(inventory,rows);assert.equal(p.inventory[0].quantity,1);assert.equal(p.inventory[0].remainingCost,300);
});
test('공통 차감 요청 ID 재사용은 중복 차감하지 않음',()=>{
 const a=receive(state());const c={type:'inventory.use',requestId:'use',payload:{id:'stock',quantity:100}};
 const b=executeInventoryCommand(a,c);assert.equal(executeInventoryCommand(b,c),b);assert.equal(b.inventory[0].quantity,1700);
});
