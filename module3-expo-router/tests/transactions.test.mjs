import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyMeal,applyDiscard,undoLatest,planMeal,removeFromBatch} from '../src/domain/transactions.mjs';
import {createPersistentStore} from '../src/state/persistentStore.mjs';
import {recommendRecipes} from '../src/services/recommendations.mjs';
const date='2026-10-08';
const recipe={id:'r',name:'달걀 요리',ingredients:[{name:'달걀',unit:'개',quantity:2}]};
const batch=(id,q,cost,expiresAt='2026-10-10')=>({id,name:'달걀',unit:'개',quantity:q,remainingCost:cost,expiresAt,purchasedAt:'2026-10-01',storageMethod:'refrigerated',dateType:'package'});
const initial=()=>({inventory:[batch('a',3,1000),batch('b',5,2000,'2026-10-12')],meals:[],shopping:[],discards:[],processedIds:[],undo:null});
const use=q=>[{name:'달걀',unit:'개',quantity:q}];
test('실제 사용량을 빠른 기한부터 차감하고 메타데이터 보존',()=>{
 const s=initial();const r=applyMeal(s,recipe,use('4'),'m','now',date);
 assert.equal(r.inventory.length,1);assert.equal(r.inventory[0].quantity,4);assert.equal(r.inventory[0].remainingCost,1600);assert.equal(r.inventory[0].storageMethod,'refrigerated');assert.equal(r.meals[0].usage[0].quantity,4);assert.equal(s.inventory[0].quantity,3);
});
test('중복 재료 행도 합산하며 부족하면 전체 실패',()=>{
 const s=initial();assert.throws(()=>planMeal(s.inventory,[...use(5),...use(4)],date));assert.deepEqual(s,initial());
});
test('빈값 음수 NaN Infinity 모두 0 초과 정밀도 차감 거부',()=>{
 for(const q of ['',-1,'NaN','Infinity','0','0.0000001']) assert.throws(()=>planMeal(initial().inventory,use(q),date));
});
test('만료된 재료와 다른 단위 차감 제외',()=>{
 assert.throws(()=>planMeal([batch('x',9,100,'2026-10-07'),{...batch('g',9,100),unit:'g'}],use(1),date));
});
test('같은 transaction id 재시도는 재차감하지 않음',()=>{
 const a=applyMeal(initial(),recipe,use(1),'m','now',date);
 assert.equal(applyMeal(a,recipe,use(1),'m','now',date),a);
});
test('되돌리기는 소진된 배치까지 수량·금액·기록 복구',()=>{
 const s=initial();const a=applyMeal(s,recipe,use(4),'m','now',date);const b=undoLatest(a,'m');
 assert.deepEqual(b.inventory,s.inventory);assert.equal(b.meals.length,0);assert.equal(b.undo,null);assert.throws(()=>undoLatest(b,'m'));
 assert.equal(applyMeal(b,recipe,use(1),'m','now',date),b);
});
test('다음 재고 변경 후 오래된 되돌리기 거부',()=>{
 const a=applyMeal(initial(),recipe,use(1),'m','now',date);const b=applyDiscard(a,'a',1,'','d');
 assert.throws(()=>undoLatest(b,'m'));assert.throws(()=>undoLatest({...a,undo:null},'m'));
});
test('1/3씩 반복 폐기해도 금액 합계 1000원 보존',()=>{
 let s=initial();for(let n=0;n<3;n++)s=applyDiscard(s,'a',1,'일부 폐기','d'+n);
 assert.equal(s.discards.reduce((v,d)=>v+d.cost,0),1000);assert.equal(s.inventory.some(i=>i.id==='a'),false);
});
test('전체 폐기/재시도/되돌리기',()=>{
 const s=initial(),a=applyDiscard(s,'a',3,'기한 경과','d');
 assert.equal(a.discards[0].cost,1000);assert.equal(applyDiscard(a,'a',3,'','d'),a);
 assert.deepEqual(undoLatest(a,'d').inventory,s.inventory);assert.equal(undoLatest(a,'d').discards.length,0);
});
test('폐기는 만료 재고도 허용하고 초과 수량은 거부',()=>{
 const s={...initial(),inventory:[batch('expired',2,500,'2026-01-01')]};
 assert.equal(applyDiscard(s,'expired',1,'','d').inventory[0].quantity,1);
 assert.throws(()=>applyDiscard(s,'expired',3,'','x'));
});
test('금액 미입력과 0원 구분',()=>{
 assert.equal(removeFromBatch(batch('a',3,undefined),1).cost,null);
 assert.equal(removeFromBatch(batch('a',3,0),1).cost,0);
});
test('소수 사용량과 금액 계산',()=>{
 const r=removeFromBatch(batch('a',0.3,300),0.1);assert.equal(r.item.quantity,0.2);assert.equal(r.item.remainingCost,200);
});
test('저장 실패 시 차감 상태 publish하지 않으며 재시도 가능',async()=>{
 let fail=true;let published=0;const s=initial();const store=createPersistentStore(s,async()=>{if(fail)throw Error('disk full');},()=>published++);
 const action=v=>applyMeal(v,recipe,use(1),'m','now',date);
 await assert.rejects(store.update(action));assert.equal(store.get(),s);assert.equal(published,0);
 fail=false;await store.update(action);assert.equal(store.get().inventory[0].quantity,2);assert.equal(published,1);
});
test('동시에 같은 요청 두 개 저장해도 단일 차감',async()=>{
 let writes=0;const store=createPersistentStore(initial(),async()=>{writes++;},()=>{});
 const action=v=>applyMeal(v,recipe,use(1),'m','now',date);
 await Promise.all([store.update(action),store.update(action)]);
 assert.equal(writes,1);assert.equal(store.get().meals.length,1);
});
test('재시작 후 저장된 undo로 복구',()=>{
 const s=applyDiscard(initial(),'a',1,'','d');const reloaded=JSON.parse(JSON.stringify(s));assert.deepEqual(undoLatest(reloaded,'d').inventory,initial().inventory);
});
test('임시 추천 모드, 빈 재고 및 교체 가능한 provider',async()=>{
 assert.deepEqual(await recommendRecipes({inventory:[],recipes:[recipe]}),{mode:'mock',items:[]});
 const result=await recommendRecipes({inventory:initial().inventory,recipes:[recipe]});assert.equal(result.mode,'mock');assert.equal(result.items[0].id,'r');assert.ok(result.items[0].explanation);
 await assert.rejects(recommendRecipes({inventory:initial().inventory,recipes:[recipe]},async()=>{throw Error('offline');}));
});
