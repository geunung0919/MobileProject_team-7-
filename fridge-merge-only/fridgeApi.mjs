export const API='https://asia-northeast3-solo-living-ai.cloudfunctions.net/api';
export async function readItems(user, request=fetch) {
 if (!user) throw new Error('로그인이 필요합니다.');
 const token=await user.getIdToken();
 const response=await request(API+'/refrigerator/items',{method:'GET',headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},redirect:'error'});
 if (!response.ok) throw new Error(`재고 조회 실패 (HTTP ${response.status})`);
 const data=await response.json();
 if (!Array.isArray(data.items)||data.success===false) throw new Error('재고 응답 형식 오류');
 return data;
}
export function serverInventory(records){
 const seen=new Set();
 return (Array.isArray(records)?records:[]).filter(i=>i&&typeof i.id==='string'&&i.id&&!seen.has(i.id)&&(seen.add(i.id),true)&&typeof i.name==='string'&&Number.isFinite(i.quantity)&&i.quantity>0).map(i=>({...i,category:i.category||'food',expiresAt:i.expiresAt||'',purchasedAt:i.purchasedAt||'',dateType:i.dateType||'',storageMethod:i.storageMethod||''}));
}
function writeFields(item){
 if(item.category && item.category!=='food')throw new Error('서버는 식재료만 지원해요.');
 if(!['개','봉','모','팩','병','캔','g','kg','ml','L'].includes(item.unit))throw new Error('서버에서 지원하지 않는 단위예요.');
 if(!['refrigerated','frozen','room'].includes(item.storageMethod)||!['package','reference','unknown'].includes(item.dateType))throw new Error('보관 방법과 날짜 유형을 확인해 주세요.');
 return {name:item.name,quantity:Number(item.quantity),unit:item.unit,purchasedAt:item.purchasedAt||null,expiresAt:item.dateType==='unknown'?null:item.expiresAt||null,storageMethod:item.storageMethod,dateType:item.dateType};
}
export function planServerWrite(kind,input,records){
 const old=records.find(i=>i.id===input.id);
 if(kind==='save'&&!old){if(input.version)throw new Error('수정할 재고가 없어요.');if(input.remainingCost!=null)throw new Error('직접 등록 구매금액은 서버 API에서 지원하지 않아요. 금액을 비워 주세요.');return {path:'/refrigerator/items',body:{requestId:input.id,...writeFields(input)}};}
 if(!old||!Number.isSafeInteger(old.version)||input.version!==old.version)throw new Error('재고가 변경됐어요. 화면을 다시 열어 주세요.');
 const base={id:old.id,version:old.version};
 if(kind==='delete')return {path:'/refrigerator/items/change',body:{...base,action:'delete'}};
 if(kind==='save'){if(input.remainingCost!==old.remainingCost&&!(input.remainingCost==null&&old.remainingCost==null))throw new Error('구매금액 직접 수정은 서버에서 지원하지 않아요.');return {path:'/refrigerator/items/change',body:{...base,action:'update',...writeFields(input)}};}
 if(kind==='use'){const q=Number(input.amount);if(!Number.isFinite(q)||q<=0||q>old.quantity)throw new Error('사용량을 확인해 주세요.');if(q===old.quantity)return {path:'/refrigerator/items/change',body:{...base,action:'delete'}};return {path:'/refrigerator/items/change',body:{...base,action:'update',...writeFields({...old,quantity:Math.round((old.quantity-q)*1e6)/1e6})}};}
 throw new Error('지원하지 않는 변경 요청이에요.');
}
export async function writeServer(user,plan,request=fetch,isCurrentUser=()=>false){
 const token=await user.getIdToken();
 if(!isCurrentUser(user))throw new Error('로그인이 변경됐어요.');
 const r=await request(API+plan.path,{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(plan.body)});
 const d=await r.json().catch(()=>({}));if(!r.ok||d.success===false||!d.id)throw new Error(d.error||'서버 변경 실패 (HTTP '+r.status+')');return d;
}
export function serverFridgeRows(records) {
 const seen=new Set();
 return (Array.isArray(records)?records:[]).filter(i=>i&&typeof i.id==='string'&&i.id&&!seen.has(i.id)&&(seen.add(i.id),true)).map(i=>{
  const raw=i.expiresAt;
  const date=typeof raw==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw)&&!Number.isNaN(Date.parse(raw+'T00:00:00Z'))&&new Date(raw+'T00:00:00Z').toISOString().slice(0,10)===raw?raw:null;
  const source=i.sourceReceiptId||i.source==='receipt'?'영수증':i.source==='manual'?'직접 등록':'출처 미확인';
  const qty=typeof i.quantity==='number'&&Number.isFinite(i.quantity)?String(i.quantity):typeof i.quantity==='string'&&i.quantity.trim()?i.quantity:'수량 미확인';
  return {id:i.id,name:typeof i.name==='string'&&i.name.trim()?i.name:'이름 미확인',quantity:[qty,typeof i.unit==='string'?i.unit:''].filter(Boolean).join(' ')+' · '+source,expiry:date,dateType:i.dateType==='package'||i.dateType==='reference'?i.dateType:null,icon:'food-outline',serverReadOnly:true};
 });
}
