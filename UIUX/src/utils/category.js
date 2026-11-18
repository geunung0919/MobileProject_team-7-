import { spendingData } from '../data/spending/spending';

// 소비 카테고리 규칙
// - 식품(spendingData.foodCategory)은 고정이라 항상 첫 번째 선택지입니다.
// - 나머지는 사용자가 직접 추가한 카테고리(customCategories)이고, 한 번 추가하면 다음에도 선택할 수 있습니다.
// - 아무것도 고르지 않으면 resolveCategory 규칙대로 저장됩니다.

export const MAX_CATEGORY_LENGTH = 10;

// 화면에 보여줄 선택지: [식품, ...사용자가 추가한 카테고리]
export const getCategoryOptions = (customCategories) => [
  spendingData.foodCategory,
  ...customCategories,
];

// 고르지 않았을 때 저장할 카테고리: 냉장고에 담는 식품이 있으면 '식품', 없으면 '기타'
export const resolveCategory = (selected, fridgeCount = 0) =>
  selected || (fridgeCount > 0 ? spendingData.foodCategory : spendingData.defaultCategory);

// 새 카테고리 이름 확인. 문제가 있으면 안내 글을, 괜찮으면 null 을 돌려줍니다.
export function validateCategoryName(name, existing) {
  const trimmed = name.trim();
  if (!trimmed) return '카테고리 이름을 입력해 주세요.';
  if (trimmed.length > MAX_CATEGORY_LENGTH) return `이름은 ${MAX_CATEGORY_LENGTH}자까지 입력할 수 있어요.`;
  const reserved = [spendingData.foodCategory, spendingData.defaultCategory, '영수증'];
  const taken = [...reserved, ...existing].some((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (taken) return '이미 있는 카테고리예요.';
  return null;
}
