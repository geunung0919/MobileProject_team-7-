import test from 'node:test';
import assert from 'node:assert/strict';
import {conditions,matchesConditions,defaultConditions,defaultAlertSettings,inventoryAlertPlan,reconcileAlerts,INVENTORY_ALERT_OWNER,useInventory,saveInventory,monthlyWaste,householdForecast,stockMatches} from '../module3/domain/nonAi.mjs';
import {undoLatest,applyDiscard} from '../module3/domain/transactions.mjs';
import {shoppingItem} from '../module3/domain/shopping.mjs';
const item={id:'soap',name:'세제',category:'household',quantity:10,unit:'회',remainingCost:10000,createdAt:'2026-10-01T09:00:00Z'};
const initial=()=>({inventory:[item],meals:[],discards:[],usages:[],processedIds:[],inventoryEvents:[]});
test('실제 사용은 중복 차감하지 않으며 취소 시 기록·금액 복구',()=>{
 const first=useInventory(initial(),'soap',2,'a','2026-10-02T09:00:00Z');assert.equal(first.inventory[0].quantity,8);assert.equal(first.inventory[0].remainingCost,8000);
 assert.equal(useInventory(first,'soap',2,'a'),first);assert.throws(()=>useInventory(first,'soap',9,'b'));
 const undo=undoLatest(first,'a');assert.equal(undo.inventory[0].quantity,10);assert.equal(undo.usages.length,0);
});
test('보관 변경은 이력에 이전/이후 값과 시각을 저장',()=>{
 const next=saveInventory(initial(),{...item,storageMethod:'frozen',openedAt:'2026-10-02'},'edit','2026-10-03T09:00:00Z');
 assert.equal(next.inventoryEvents[0].before,item);assert.equal(next.inventoryEvents[0].after.storageMethod,'frozen');assert.equal(next.inventory[0].updatedAt,'2026-10-03T09:00:00Z');assert.equal(initial().inventory[0].storageMethod,undefined);
});
test('사용 기록 부족 시 수동 확인, 충분하면 추정만 제공하고 실제 잔량 유지',()=>{
 assert.equal(householdForecast(item,[]).mode,'manual');
 const usage=[{id:'a',batchId:'soap',name:'세제',unit:'회',quantity:2,at:'2026-10-02T09:00:00Z'},{id:'b',batchId:'soap',name:'세제',unit:'회',quantity:2,at:'2026-10-04T09:00:00Z'}];
 const forecast=householdForecast({...item,quantity:6},usage,new Date('2026-10-06T09:00:00Z'));assert.equal(forecast.quantity,4);
 const confirmed=householdForecast({...item,quantity:6,lastConfirmedAt:'2026-10-06T09:00:00Z'},usage,new Date('2026-10-06T09:00:00Z'));assert.equal(confirmed.quantity,6);assert.equal(item.quantity,10);
});
test('도구·제외 재료·시간·설거지·체력·예산 조건을 동시에 적용',()=>{
 const r={minutes:10,tools:['microwave'],minCleanup:true,onePan:false,ingredients:[{name:'달걀'}]};
 assert.equal(matchesConditions(r,defaultConditions),false);
 const c={...defaultConditions,tools:['microwave'],energy:'low'};assert.equal(matchesConditions(r,c),true);
 assert.equal(matchesConditions(r,{...c,excluded:'계란'}),false);assert.equal(matchesConditions(r,{...c,onePan:true}),false);
 assert.equal(matchesConditions(r,{...c,maxMinutes:5}),false);assert.equal(matchesConditions(r,{...c,budget:1000}),false);
 assert.equal(matchesConditions({...r,estimatedCost:500},{...c,budget:1000}),true);
 assert.throws(()=>conditions({...c,budget:-1}));assert.throws(()=>conditions({...c,tools:[]}));
});
test('폐기 월별 합계는 미입력 가격과 0원을 구분하고 취소를 제외',()=>{
 let s=applyDiscard(initial(),'soap',2,'test','d','2026-11-04T12:00:00Z');s.discards.push({id:'unknown',cost:null,createdAt:'2026-11-03T12:00:00Z'},{id:'old',cost:500,createdAt:'2026-10-03T12:00:00Z'});
 assert.equal(monthlyWaste(s.discards,'2026-11').total,2000);assert.equal(monthlyWaste(s.discards,'2026-11').unknown,1);
 assert.equal(monthlyWaste(undoLatest(s,'d').discards,'2026-11').total,0);assert.throws(()=>monthlyWaste([],'2026-13'));
});
test('재고 알림은 미래 D-3/D-1만, 생필품과 소진 제외',()=>{
 const inv=[{id:'egg',name:'달걀',quantity:2,expiresAt:'2026-11-10',dateType:'package'},{...item,expiresAt:'2026-11-10'},{id:'zero',quantity:0,expiresAt:'2026-11-10'}];
 const plan=inventoryAlertPlan(inv,{...defaultAlertSettings,enabled:true},new Date(2026,10,6,12));
 assert.equal(plan.length,2);assert.match(plan[0].title,/표시 소비기한/);assert.equal(new Date(plan[0].at).getHours(),9);
 assert.equal(inventoryAlertPlan(inv,{...defaultAlertSettings,enabled:true},new Date(2026,10,9,10)).length,0);
 assert.equal(inventoryAlertPlan(inv,defaultAlertSettings).length,0);
});
test('예약 동기화는 변경·삭제·중복만 취소하고 다른 소유자 알림을 보존',async()=>{
 const p={key:'key',at:'2026-11-10T00:00:00Z',title:'egg'};
 let requests=[{identifier:'foreign',content:{data:{owner:'recipe'}}},{identifier:'old',content:{title:'old',data:{owner:INVENTORY_ALERT_OWNER,key:p.key,at:p.at}}}];let n=0;
 const api={list:async()=>requests,cancel:async id=>{requests=requests.filter(x=>x.identifier!==id);},schedule:async v=>{requests.push({identifier:`new${++n}`,content:{title:v.title,data:{...v,owner:INVENTORY_ALERT_OWNER}}});}};
 await reconcileAlerts(api,[p]);assert.equal(n,1);await reconcileAlerts(api,[p]);assert.equal(n,1);assert.equal(requests.length,2);
 await reconcileAlerts(api,[]);assert.deepEqual(requests.map(x=>x.identifier),['foreign']);
});
test('예약 실패는 오류 전달, 다음 실행에서 누락 예약 복구',async()=>{
 let fail=true,count=0;const api={list:async()=>[],cancel:async()=>{},schedule:async()=>{if(fail)throw new Error('OS');count++;}};
 await assert.rejects(reconcileAlerts(api,[{key:'a'}]));fail=false;await reconcileAlerts(api,[{key:'a'}]);assert.equal(count,1);
});
test('예약 한도는 다른 기능 예약을 포함하고 미예약 건수 제공',async()=>{
 const result=await reconcileAlerts({list:async()=>Array.from({length:59},()=>({content:{data:{owner:'other'}}})),schedule:async()=>{},cancel:async()=>{}},[{key:'a'},{key:'b'}]);assert.equal(result.count,1);assert.equal(result.omitted,1);
});
test('장보기 예상 비용 검증과 보유 재고 이름 별칭 비교',()=>{
 assert.equal(shoppingItem({name:'세제',unit:'개',quantity:2,estimatedUnitPrice:''}).estimatedUnitPrice,null);
 assert.throws(()=>shoppingItem({name:'세제',unit:'개',quantity:2,estimatedUnitPrice:-1}));
 assert.equal(stockMatches([{name:'달걀',quantity:2,unit:'개'}],{name:'계란'}).length,1);
});
test('문자열 확인 주기도 날짜에 숫자로 더하며 잔량 수정은 추정 기준점을 갱신',()=>{
 assert.equal(householdForecast({...item,reviewDays:'7'},[],new Date('2026-10-01T09:00:00Z')).reviewAt,'2026-10-08');
 const usages=[{batchId:'soap',name:'세제',unit:'회',quantity:1,at:'2026-10-02T09:00:00Z'},{batchId:'soap',name:'세제',unit:'회',quantity:2,at:'2026-10-04T09:00:00Z'}];
 assert.equal(householdForecast({...item,quantity:8,updatedAt:'2026-10-06T09:00:00Z'},usages,new Date('2026-10-06T09:00:00Z')).quantity,8);
});
