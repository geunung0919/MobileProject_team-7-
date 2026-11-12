// Small app-owned vocabulary. Exact aliases normalize; partial matches require selection.
export const ingredientCatalog = [
 ['rice','밥','공기',['흰밥','쌀밥']],['egg','달걀','개',['계란']],
 ['tofu','두부','모',[]],['kimchi','김치','g',[]],['spaghetti','스파게티면','g',['스파게티 면']],
 ['tomato-sauce','토마토소스','g',['토마토 소스']],['garlic','마늘','g',[]],['olive-oil','올리브유','ml',['올리브 오일','올리브오일']],
 ['milk','우유','ml',[]],['onion','양파','개',[]],['carrot','당근','개',[]],
 ['potato','감자','개',[]],['green-onion','대파','g',[]],['spinach','시금치','g',[]],
 ['tomato','토마토','개',[]],['apple','사과','개',[]],['chicken-breast','닭가슴살','g',['닭 가슴살']],
 ['pork','돼지고기','g',[]],['beef','소고기','g',['쇠고기']],['soy-sauce','간장','ml',[]],
 ['salt','소금','g',[]],['sugar','설탕','g',[]],['cooking-oil','식용유','ml',[]],['gochujang','고추장','g',[]]
].map(([id,name,unit,aliases])=>({id,name,unit,aliases}));
const key=value=>String(value||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
export function exactIngredient(name){return ingredientCatalog.find(i=>[i.name,...i.aliases].some(n=>key(n)===key(name)))||null;}
export function suggestIngredients(query){
 const q=key(query);if(!q)return [];
 return ingredientCatalog.filter(i=>[i.name,...i.aliases].some(n=>key(n).includes(q)))
 .sort((a,b)=>Number(exactIngredient(query)?.id===b.id)-Number(exactIngredient(query)?.id===a.id)).slice(0,6);
}
