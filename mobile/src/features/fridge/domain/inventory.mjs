export function dayKey(date=new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function validDate(value) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
 const [y,m,d]=value.split('-').map(Number);const date=new Date(y,m-1,d);
 return date.getFullYear()===y && date.getMonth()===m-1 && date.getDate()===d;
}
export function daysLeft(value,today=dayKey()) {
 const utc=s=>{const [y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d);};
 return Math.round((utc(value)-utc(today))/86400000);
}
export function available(inventory,ingredient,today=dayKey()) {return inventory.filter(i=>i.name===ingredient.name && i.unit===ingredient.unit && daysLeft(i.expiresAt,today)>=0).reduce((s,i)=>s+i.quantity,0);}
export function shortages(inventory,recipe,today=dayKey()) {return recipe.ingredients.map(i=>({...i,quantity:Math.max(0,i.quantity-available(inventory,i,today))})).filter(i=>i.quantity>0);}
export function consume(inventory,recipe,today=dayKey()) {
 if(shortages(inventory,recipe,today).length) throw new Error('재료가 부족하거나 소비기한이 지났어요.');
 const next=inventory.map(i=>({...i}));
 for(const ingredient of recipe.ingredients) {
  let remaining=ingredient.quantity;
  const batches=next.filter(i=>i.name===ingredient.name && i.unit===ingredient.unit && daysLeft(i.expiresAt,today)>=0).sort((a,b)=>a.expiresAt.localeCompare(b.expiresAt));
  for(const batch of batches){const used=Math.min(remaining,batch.quantity);batch.quantity-=used;remaining-=used;if(remaining<=0)break;}
 }
 return next.filter(i=>i.quantity>0);
}
export function rankRecipes(inventory,recipes) {
 return recipes.map(recipe=>{const missing=shortages(inventory,recipe);const urgent=recipe.ingredients.filter(g=>inventory.some(i=>i.name===g.name&&i.unit===g.unit&&i.quantity>0&&daysLeft(i.expiresAt)>=0&&daysLeft(i.expiresAt)<=3)).length;return {...recipe,missing,score:100-missing.length*25+urgent*10};}).sort((a,b)=>b.score-a.score);
}
