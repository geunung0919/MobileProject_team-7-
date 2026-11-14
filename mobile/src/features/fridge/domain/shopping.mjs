export function shoppingItem(input) {
 const name=String(input.name || '').trim(), unit=String(input.unit || '').trim(), quantity=Number(input.quantity);
 if(!name || name.length>80 || !unit || unit.length>20 || !Number.isFinite(quantity) || quantity<=0 || quantity>1000000) throw new Error('재료명과 단위, 0보다 큰 수량을 확인해 주세요.');
 return {...input,name,unit,quantity};
}
export function mergeShopping(existing, items, makeId) {
 const next=existing.map(i=>({...i}));
 for(const input of items) {
  const item=shoppingItem(input);
  const found=next.find(i=>i.name===item.name && i.unit===item.unit && !i.done && !i.inventoryId);
  // 같은 부족 재료를 반복 추가해도 수량이 계속 늘어나지 않도록 최대 필요량을 보관합니다.
  if(found) found.quantity=Math.max(found.quantity,item.quantity);
  else next.push({...item,id:makeId(),done:false});
 }
 return next;
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
