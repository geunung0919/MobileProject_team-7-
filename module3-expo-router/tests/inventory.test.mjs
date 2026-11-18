import {test} from 'node:test';import assert from 'node:assert/strict';import {consume,shortages,validDate,daysLeft} from '../src/domain/inventory.mjs';
const recipe={ingredients:[{name:'달걀',quantity:3,unit:'개'}]};
const inventory=[{id:'late',name:'달걀',quantity:4,unit:'개',expiresAt:'2026-10-10'},{id:'early',name:'달걀',quantity:2,unit:'개',expiresAt:'2026-10-06'},{id:'expired',name:'달걀',quantity:9,unit:'개',expiresAt:'2026-10-05'}];
test('소비기한 가까운 배치부터 차감하고 원본 보존',()=>{const result=consume(inventory,recipe,'2026-10-06');assert.equal(result.find(i=>i.id==='late').quantity,3);assert.equal(result.some(i=>i.id==='early'),false);assert.equal(result.find(i=>i.id==='expired').quantity,9);assert.equal(inventory[0].quantity,4);});
test('부족하면 전체 차감 거부',()=>assert.throws(()=>consume([],recipe,'2026-10-06')));
test('만료 재고와 다른 단위 제외',()=>assert.equal(shortages([{name:'달걀',quantity:9,unit:'g',expiresAt:'2026-10-10'},inventory[2]],recipe,'2026-10-06')[0].quantity,3));
test('실제 날짜 및 D-Day',()=>{assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2028-02-29'),true);assert.equal(daysLeft('2026-10-07','2026-10-06'),1);});
