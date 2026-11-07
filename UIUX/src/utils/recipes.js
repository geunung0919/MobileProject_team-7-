import { addDays, daysBetween } from './format';

// 식재료에 남은 일수(daysLeft)와 임박 여부(urgent)를 붙이고 유통기한 빠른 순으로 정렬 (냉장고 화면과 같은 기준)
export function getFridgeEntries(items, baseDate, urgentWithinDays) {
  return items
    .map((item) => {
      const expiry = item.expiry ?? (Number.isFinite(item.daysFromToday) ? addDays(baseDate, item.daysFromToday) : null);
      const daysLeft = expiry ? daysBetween(baseDate, expiry) : Infinity;
      return { ...item, expiry, daysLeft, urgent: daysLeft <= urgentWithinDays };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

// 한쪽 이름이 다른 쪽을 포함하면 같은 재료로 봅니다 ("우유" ↔ "서울우유 1L")
const isSameIngredient = (fridgeName, ingredientName) =>
  fridgeName.includes(ingredientName) || ingredientName.includes(fridgeName);

// 레시피 재료를 냉장고와 맞춰 봅니다. entries 는 getFridgeEntries 의 결과
// 반환: { ingredients(fridgeItem 포함), owned, missing, urgent }
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
  !Number.isFinite(daysLeft) ? '날짜 미입력' : daysLeft < 0 ? `${-daysLeft}일 지남` : daysLeft === 0 ? '오늘까지' : `${daysLeft}일`;

// 카드 배지용 (냉장고, 레시피, 홈 공용): "1일 지남" / "오늘까지" / "2일 남음"
export const badgeDueLabel = (daysLeft) =>
  !Number.isFinite(daysLeft) ? '날짜 미입력' : daysLeft < 0 ? `${-daysLeft}일 지남` : daysLeft === 0 ? '오늘까지' : `${daysLeft}일 남음`;
