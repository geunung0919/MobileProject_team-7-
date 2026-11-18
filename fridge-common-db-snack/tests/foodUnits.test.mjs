import test from 'node:test';import assert from 'node:assert/strict';
import {foodUnit,normalizeFoodDraft} from '../module3/domain/foodUnits.mjs';
import {inventoryRecord,inventoryDraft} from '../module3/domain/inventoryFields.mjs';
import {available} from '../module3/domain/inventory.mjs';
test('밥은 공기, 계란은 달걀 개를 제안하고 모르는 식품은 추측하지 않는다',()=>{assert.deepEqual(foodUnit(' 쌀밥 '),{name:'밥',unit:'공기'});assert.deepEqual(foodUnit('계란'),{name:'달걀',unit:'개'});assert.equal(foodUnit('즉석밥 큰팩'),null);});
test('정확한 무게/부피 변환만 하며 금액은 유지한다',()=>{assert.deepEqual(normalizeFoodDraft({name:'김치',quantity:'0.5',unit:'kg',remainingCost:'3000'}),{name:'김치',quantity:'500',unit:'g',remainingCost:'3000',ingredientId:'kimchi'});assert.equal(normalizeFoodDraft({name:'올리브유',quantity:'0.2',unit:'L'}).quantity,'200');assert.equal(normalizeFoodDraft({name:'밥',quantity:'1',unit:'개'}).unit,'개');assert.equal(normalizeFoodDraft({name:'토마토소스',quantity:'1',unit:'병'}).unit,'병');});
test('저장 경계에서 표준화된 재료는 레시피 재고와 일치한다',()=>{const r=inventoryRecord({...inventoryDraft(),name:'쌀밥',quantity:'1',unit:'공기',dateType:'reference',storageMethod:'refrigerated'},'rice');assert.equal(available([r],{name:'밥',unit:'공기'}),1);});
