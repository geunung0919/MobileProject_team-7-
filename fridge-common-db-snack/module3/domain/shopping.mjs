export function shoppingItem(input) {
 const name=String(input.name || '').trim(), unit=String(input.unit || '').trim(), quantity=Number(input.quantity);
 if(!name || name.length>80 || !unit || unit.length>20 || !Number.isFinite(quantity) || quantity<=0 || quantity>1000000) throw new Error('재료명과 단위, 0보다 큰 수량을 확인해 주세요.');
 const estimatedUnitPrice=input.estimatedUnitPrice==null||input.estimatedUnitPrice===''?null:Number(input.estimatedUnitPrice);
 if(estimatedUnitPrice!==null&&(!Number.isSafeInteger(estimatedUnitPrice)||estimatedUnitPrice<0||!Number.isSafeInteger(Math.round(estimatedUnitPrice*quantity))))throw new Error('예상 단가는 0 이상의 정수로 입력해 주세요.');
 return {...input,name,unit,quantity,estimatedUnitPrice};
}
const round=n=>Math.round(n*1e6)/1e6;
export function shoppingSources(item){
 return Array.isArray(item.sources)?item.sources:[{key:'manual',type:'manual',name:'직접 추가 / 이전 항목',quantity:item.quantity}];
}
function withSources(item,sources){return {...item,sources,quantity:round(sources.reduce((n,s)=>n+s.quantity,0))};}
export function mergeShopping(existing, items, makeId) {
 const next=existing.map(i=>({...i}));
 for(const input of items){
  const item=shoppingItem(input);
  const contribution=input.recipeSource
   ?{key:`recipe:${input.recipeSource.id}`,type:'recipe',recipeId:input.recipeSource.id,name:input.recipeSource.name,quantity:item.quantity}
   :{key:'manual',type:'manual',name:'직접 추가',quantity:item.quantity};
  const found=next.find(i=>i.name===item.name&&i.unit===item.unit&&!i.done&&!i.inventoryId);
  if(found){
   const sources=shoppingSources(found).map(s=>({...s}));const old=sources.find(s=>s.key===contribution.key);
   if(old)Object.assign(old,{...contribution,quantity:contribution.type==='manual'?Math.max(old.quantity,contribution.quantity):contribution.quantity});
   else sources.push(contribution);
   Object.assign(found,withSources(found,sources));
  }else{const {recipeSource,...clean}=item;next.push(withSources({...clean,id:makeId(),done:false},[contribution]));}
 }
 return next;
}
export function removeShoppingRecipe(items,recipeId){
 return items.map(i=>i.done||i.inventoryId?i:withSources(i,shoppingSources(i).filter(s=>!(s.type==='recipe'&&s.recipeId===recipeId))))
 .filter(i=>i.quantity>0);
}
export function replaceRecipeShopping(items,missing,recipe,makeId){
 // Refresh one recipe against the latest inventory without touching other sources.
 return mergeShopping(removeShoppingRecipe(items,recipe.id),missing.map(i=>({...i,recipeSource:{id:recipe.id,name:recipe.name}})),makeId);
}
export function editShoppingItem(original,input){
 const item=shoppingItem(input);
 if(shoppingSources(original).some(s=>s.type==='recipe')&&(item.name!==original.name||item.unit!==original.unit||item.quantity!==original.quantity))
  throw new Error('레시피 연결 품목은 출처를 제외한 뒤 직접 추가해 주세요. 예상 가격은 수정할 수 있어요.');
 return {...original,...item,sources:shoppingSources(original).some(s=>s.type==='recipe')?shoppingSources(original):[{key:'manual',type:'manual',name:'직접 추가',quantity:item.quantity}]};
}
export function purchaseUrl(name) {
 const value=String(name || '').trim();
 if(!value || value.length>80) throw new Error('검색할 재료명을 확인해 주세요.');
 return `https://www.coupang.com/np/search?q=${encodeURIComponent(value)}`;
}
export function registerPurchased(state, shoppingId, item) {
 const source=state.shopping.find(i=>i.id===shoppingId);
 if(!source) throw new Error('장보기 항목이 삭제되었어요. 다시 확인해 주세요.');
 if(source.inventoryId) throw new Error('이미 재고에 등록한 품목이에요.');
 return {...state,undo:null,inventory:[...state.inventory,item],shopping:state.shopping.map(i=>i.id===shoppingId?{...i,done:true,inventoryId:item.id}:i)};
}
