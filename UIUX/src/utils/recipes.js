import { addDays, daysBetween } from './format';

// 식재료에 "남은 일수(daysLeft)"와 "임박 여부(urgent)"를 계산해 붙이고, 유통기한 빠른 순으로 정렬합니다.
// (냉장고 화면과 같은 기준: 오늘 기준, urgentWithinDays 이내면 임박)
export function getFridgeEntries(items, baseDate, urgentWithinDays) {
  return items
    .map((item) => {
      const expiry = item.expiry ?? addDays(baseDate, item.daysFromToday);
      const daysLeft = daysBetween(baseDate, expiry);
      return { ...item, expiry, daysLeft, urgent: daysLeft <= urgentWithinDays };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

// 냉장고 식재료 이름과 레시피 재료 이름이 같은 재료인지: 한쪽이 다른 쪽을 포함하면 같다고 봅니다. ("우유" ↔ "서울우유 1L")
const isSameIngredient = (fridgeName, ingredientName) =>
  fridgeName.includes(ingredientName) || ingredientName.includes(fridgeName);

// 레시피 재료를 냉장고와 맞춰 봅니다. entries 는 getFridgeEntries 의 결과(유통기한 빠른 순)입니다.
// 반환: { ingredients(각 재료에 fridgeItem 이 붙음), owned, missing, urgent }
export function analyzeRecipe(recipe, entries) {
  const ingredients = recipe.ingredients.map((ing) => ({
    ...ing,
    fridgeItem: entries.find((e) => isSameIngredient(e.name, ing.name)) ?? null,
  }));
  return {
    ingredients,
    owned: ingredients.filter((i) => i.fridgeItem),
    missing: ingredients.filter((i) => !i.fridgeItem),
    urgent: ingredients.filter((i) => i.fridgeItem?.urgent),
  };
}

// 배너 칩용: "1일 지남" / "오늘까지" / "1일"
export const shortDueLabel = (daysLeft) =>
  daysLeft < 0 ? `${-daysLeft}일 지남` : daysLeft === 0 ? '오늘까지' : `${daysLeft}일`;

// 카드 배지용: "1일 지남" / "오늘까지" / "2일 남음"
// 냉장고 목록, 레시피 추천, 홈 화면이 모두 이 함수를 써서 같은 문구가 나옵니다.
export const badgeDueLabel = (daysLeft) =>
  daysLeft < 0 ? `${-daysLeft}일 지남` : daysLeft === 0 ? '오늘까지' : `${daysLeft}일 남음`;
