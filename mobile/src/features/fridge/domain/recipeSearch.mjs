import { rankRecipes } from './inventory.mjs';
const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/계란/g, '달걀').replace(/\s+/g, '');
// 모든 검색어가 이름 또는 재료에 포함되어야 합니다. 검색 결과도 기존 상세/조리 흐름을 사용합니다.
export function searchRecipes(recipes, inventory, {query='', maxMinutes=0, readyOnly=false, sort='recommended'}={}) {
 const tokens=query.trim().split(/\s+/).filter(Boolean).map(normalize);
 const found=rankRecipes(inventory, recipes).filter(r => {
  const haystack=normalize([r.name,...r.ingredients.map(i=>i.name)].join(' '));
  return tokens.every(t=>haystack.includes(t)) && (!maxMinutes || r.minutes<=Number(maxMinutes)) && (!readyOnly || !r.missing.length);
 });
 return sort==='quick' ? found.sort((a,b)=>a.minutes-b.minutes || b.score-a.score) : found;
}
