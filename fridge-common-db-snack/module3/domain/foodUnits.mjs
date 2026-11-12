import {exactIngredient} from './ingredientCatalog.mjs';
export function foodUnit(name){const i=exactIngredient(name);return i?{name:i.name,unit:i.unit}:null;}
export function normalizeFoodDraft(draft){
 const match=draft.category==='household'?null:foodUnit(draft.name);
 let unit=String(draft.unit||'').trim(),quantity=draft.quantity;
 // Only exact metric conversions. A pack, bowl, piece or bottle has no assumed weight.
 if(unit==='kg'||unit==='L'||unit==='l'){
  const n=Number(quantity);
  if(String(quantity).trim()!==''&&Number.isFinite(n)&&n>=0){quantity=String(Math.round(n*1000*1000000)/1000000);unit=unit==='kg'?'g':'ml';}
 }
 return {...draft,ingredientId:draft.category==='household'?null:(exactIngredient(draft.name)?.id||null),name:match?.name||draft.name,unit,quantity};
}
