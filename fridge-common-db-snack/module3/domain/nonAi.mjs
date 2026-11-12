import {dayKey,validDate} from './inventory.mjs';
import {quantity,removeFromBatch} from './transactions.mjs';
export const defaultConditions={tools:['pan'],maxMinutes:0,budget:null,energy:'normal',excluded:'',onePan:false,minCleanup:false};
export const defaultAlertSettings={enabled:false,days:[3,1],hour:9,minute:0};
export function conditions(input){
 const c={...defaultConditions,...input};
 if(!Array.isArray(c.tools)||!c.tools.length||c.tools.some(x=>!['pan','microwave','pot'].includes(x)))throw new Error('사용 가능한 조리 도구를 선택해 주세요.');
 c.maxMinutes=Number(c.maxMinutes);
 if(!Number.isInteger(c.maxMinutes)||c.maxMinutes<0||c.maxMinutes>240)throw new Error('시간은 0~240분으로 입력해 주세요. 0은 제한 없음이에요.');
 c.budget=c.budget===''||c.budget==null?null:Number(c.budget);
 if(c.budget!==null&&(!Number.isSafeInteger(c.budget)||c.budget<0))throw new Error('예산은 0 이상의 정수로 입력해 주세요.');
 if(!['normal','low'].includes(c.energy))throw new Error('체력 설정을 확인해 주세요.');
 c.excluded=String(c.excluded||'').trim();
 return c;
}
export const normalizeName=name=>String(name).normalize('NFKC').replace(/계란/g,'달걀').replace(/\s/g,'').toLowerCase();
export function matchesConditions(recipe,input){
 const c=conditions(input), excluded=c.excluded.split(/[,\n]/).map(x=>normalizeName(x)).filter(Boolean);
 if(excluded.some(x=>recipe.ingredients.some(i=>normalizeName(i.name).includes(x))))return false;
 if(c.maxMinutes&&recipe.minutes>c.maxMinutes)return false;
 if(!recipe.tools?.length||recipe.tools.some(t=>!c.tools.includes(t)))return false;
 if(c.onePan&&!recipe.onePan || c.minCleanup&&!recipe.minCleanup)return false;
 if(c.energy==='low'&&(!recipe.minCleanup||recipe.minutes>15))return false;
 // 검증된 비용 정보가 없는 요리는 예산 충족을 보장하지 않습니다.
 if(c.budget!==null&&(!Number.isFinite(recipe.estimatedCost)||recipe.estimatedCost>c.budget))return false;
 return true;
}
export function logChange(state,kind,before,after,id,at=new Date().toISOString()){
 return {...state,inventoryEvents:[{id,kind,batchId:(after||before)?.id,before:before||null,after:after||null,at},...(state.inventoryEvents||[])]};
}
export function saveInventory(state,item,id,at){
 const before=state.inventory.find(i=>i.id===item.id);
 const now=at||new Date().toISOString();
 const next={...item,version:(before?.version||0)+1,updatedAt:now,createdAt:before?.createdAt||item.createdAt||now};
 return logChange({...state,undo:null,inventory:before?state.inventory.map(i=>i.id===item.id?next:i):[...state.inventory,next]},before?'edit':'create',before,next,id,now);
}
export function useInventory(state,batchId,amount,id,at=new Date().toISOString()){
 if((state.processedIds||[]).includes(id))return state;
 const before=state.inventory.find(i=>i.id===batchId);if(!before)throw new Error('재고를 찾을 수 없어요.');
 const q=quantity(amount),result=removeFromBatch(before,q,at);
 const after={...result.item,updatedAt:at};
 return logChange({...state,inventory:state.inventory.map(i=>i.id===batchId?after:i).filter(i=>i.quantity>0),
 usages:[{id,batchId,name:before.name,unit:before.unit,quantity:q,cost:result.cost,at},...(state.usages||[])],processedIds:[...(state.processedIds||[]),id],undo:{id,kind:'use',label:before.name,inventory:state.inventory,expectedInventory:state.inventory.map(i=>i.id===batchId?after:i).filter(i=>i.quantity>0)}},'use',before,after,id,at);
}
export function monthlyWaste(discards,month){
 if(!/^\d{4}-\d{2}$/.test(month)||Number(month.slice(5))<1||Number(month.slice(5))>12)throw new Error('월은 YYYY-MM 형식으로 입력해 주세요.');
 const rows=discards.filter(d=>dayKey(new Date(d.createdAt)).slice(0,7)===month);
 return {rows,total:rows.reduce((sum,d)=>sum+(Number.isSafeInteger(d.cost)?d.cost:0),0),unknown:rows.filter(d=>!Number.isSafeInteger(d.cost)).length};
}
export function stockMatches(inventory,input){return inventory.filter(i=>i.quantity>0&&normalizeName(i.name)===normalizeName(input.name));}
export function householdForecast(item,usages,now=new Date()){
 const events=usages.filter(u=>u.batchId===item.id&&u.unit===item.unit&&u.name===item.name).sort((a,b)=>a.at.localeCompare(b.at));
 const last=events[events.length-1];
 const anchor=[item.lastConfirmedAt,item.updatedAt,last?.at].filter(Boolean).sort().pop();
 const confirmedDate=anchor||item.updatedAt||item.createdAt;
 const due=new Date(confirmedDate||now);due.setDate(due.getDate()+(Number(item.reviewDays)||7));
 if(events.length<2)return {mode:'manual',reviewAt:dayKey(due)};
 const span=(new Date(last.at)-new Date(events[0].at))/86400000;
 if(span<1)return {mode:'manual',reviewAt:dayKey(due)};
 const rate=events.slice(1).reduce((n,u)=>n+u.quantity,0)/span;
 if(!(rate>0))return {mode:'manual',reviewAt:dayKey(due)};
 const days=Math.max(0,(now-new Date(anchor))/86400000);
 return {mode:'estimate',quantity:Math.max(0,Math.round((item.quantity-rate*days)*100)/100),dailyRate:rate,reviewAt:dayKey(due)};
}
export function alertSettings(input){
 const value={...defaultAlertSettings,...input};
 if(!Array.isArray(value.days)||!value.days.length||value.days.some(n=>!Number.isInteger(n)||n<0||n>30))throw new Error('알림 기준일은 0~30일 사이로 선택해 주세요.');
 value.days=[...new Set(value.days)].sort((a,b)=>b-a);value.hour=Number(value.hour);value.minute=Number(value.minute);
 if(!Number.isInteger(value.hour)||value.hour<0||value.hour>23||!Number.isInteger(value.minute)||value.minute<0||value.minute>59)throw new Error('알림 시각을 확인해 주세요.');
 return value;
}
export const INVENTORY_ALERT_OWNER='module3.inventory.v1';
export function inventoryAlertPlan(inventory,settings,now=new Date()){
 const s=alertSettings(settings);if(!s.enabled)return [];
 const result=[];
 for(const item of inventory){
  if(item.quantity<=0||item.category==='household'||!validDate(item.expiresAt))continue;
  for(const days of s.days){
   const [y,m,d]=item.expiresAt.split('-').map(Number),date=new Date(y,m-1,d-days,s.hour,s.minute);
   if(date<=now)continue;
   const key=JSON.stringify([item.id,item.expiresAt,days]);
   const label=item.dateType==='package'?'표시 소비기한':'보관 참고일';
   result.push({key,at:date.toISOString(),title:`${item.name} ${label} ${days===0?'당일':`${days}일 전`}`,body:'날짜와 보관 상태를 확인하고 사용 계획을 세워 보세요.',batchId:item.id});
  }
 }
 return result.sort((a,b)=>a.at.localeCompare(b.at));
}
// 이 소유자의 예약만 변경합니다. 실패하면 다음 동기화에서 다시 비교합니다.
export async function reconcileAlerts(api,plan){
 const existing=await api.list(),owned=existing.filter(n=>n.content?.data?.owner===INVENTORY_ALERT_OWNER);
 const capacity=Math.max(0,60-(existing.length-owned.length));
 const desired=plan.slice(0,capacity),kept=new Set();let scheduled=0;
 for(const n of owned){const match=desired.find(p=>p.key===n.content.data.key&&p.at===n.content.data.at&&p.title===n.content.title);
  if(!match||kept.has(match.key))await api.cancel(n.identifier);else kept.add(match.key);
 }
 for(const p of desired)if(!kept.has(p.key)){await api.schedule(p);scheduled++;}
 return {count:desired.length,omitted:plan.length-desired.length,scheduled};
}
