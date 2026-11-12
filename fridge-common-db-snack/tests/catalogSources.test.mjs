import test from 'node:test';
import assert from 'node:assert/strict';
import {exactIngredient,suggestIngredients} from '../module3/domain/ingredientCatalog.mjs';
import {normalizeFoodDraft} from '../module3/domain/foodUnits.mjs';
import {mergeShopping,replaceRecipeShopping,removeShoppingRecipe,editShoppingItem} from '../module3/domain/shopping.mjs';
let id=0;const makeId=()=>String(++id);const egg=q=>({name:'달걀',quantity:q,unit:'개'});
test('aliases normalize but partial and product names require selection',()=>{
 assert.equal(exactIngredient('계 란').name,'달걀');assert.equal(exactIngredient('계란말이'),null);
 assert(suggestIngredients('토마토').some(i=>i.name==='토마토소스'));
 assert.equal(suggestIngredients('').length,0);
 assert.equal(normalizeFoodDraft({name:'계란',unit:'팩',quantity:'2'}).unit,'팩');
 assert.equal(normalizeFoodDraft({name:'마늘',unit:'kg',quantity:'0.5'}).quantity,'500');
 assert.equal(normalizeFoodDraft({name:'계란',unit:'개',quantity:2}).ingredientId,'egg');
});
test('different recipe needs sum, same recipe refreshes, removal retains manual and other recipe',()=>{
 let rows=mergeShopping([], [egg(1)],makeId);
 rows=replaceRecipeShopping(rows,[egg(2)],{id:'a',name:'요리 A'},makeId);
 rows=replaceRecipeShopping(rows,[egg(3)],{id:'b',name:'요리 B'},makeId);
 assert.equal(rows[0].quantity,6);
 rows=replaceRecipeShopping(rows,[egg(2)],{id:'a',name:'요리 A'},makeId);assert.equal(rows[0].quantity,6);
 rows=replaceRecipeShopping(rows,[egg(1)],{id:'a',name:'요리 A'},makeId);assert.equal(rows[0].quantity,5);
 rows=removeShoppingRecipe(rows,'a');assert.equal(rows[0].quantity,4);
 rows=replaceRecipeShopping(rows,[],{id:'b',name:'요리 B'},makeId);assert.equal(rows[0].quantity,1);
});
test('legacy items retained and purchased records untouched; units stay separate',()=>{
 const legacy={...egg(4),id:'old',done:false};
 let rows=replaceRecipeShopping([legacy],[egg(2),{name:'달걀',quantity:1,unit:'팩'}],{id:'a',name:'A'},makeId);
 assert.equal(rows.length,2);assert.equal(rows[0].quantity,6);
 const bought={...rows[0],done:true};assert.deepEqual(removeShoppingRecipe([bought],'a'),[bought]);
 assert.equal(removeShoppingRecipe(rows,'a')[0].quantity,4);
});
test('linked quantity edits cannot silently lose recipe provenance',()=>{
 const row=replaceRecipeShopping([],[egg(2)],{id:'a',name:'A'},makeId)[0];
 assert.throws(()=>editShoppingItem(row,egg(3)));
 assert.equal(editShoppingItem(row,{...egg(2),estimatedUnitPrice:300}).sources[0].recipeId,'a');
 const manual=editShoppingItem({...egg(4),id:'old'},egg(2));assert.equal(manual.sources[0].quantity,2);
});
