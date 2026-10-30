import { rankRecipes } from '../domain/inventory.mjs';
// 실제 API 도입 시 provider를 교체하고 화면은 동일한 응답 구조를 사용합니다.
export async function mockRecipeProvider({ inventory, recipes }) {
 return { mode:'mock', items:rankRecipes(inventory,recipes).map(recipe=>({
  ...recipe,
  explanation:recipe.missing.length
   ? `부족한 재료 ${recipe.missing.length}종을 준비하면 만들 수 있어요. 임박 재료와 재료 일치도를 고려했어요.`
   : '현재 재고로 만들 수 있어요. 재료 일치도와 3일 이내 보관 참고일을 우선했어요.',
 })) };
}
export async function recommendRecipes(input, provider = mockRecipeProvider) {
 if(!input.inventory.some(i=>i.quantity>0)) return {mode:'mock',items:[]};
 return provider(input);
}
