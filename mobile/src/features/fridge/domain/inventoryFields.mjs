import { dayKey, validDate } from './inventory.mjs';

export const STORAGE_METHODS = [
  { value: 'refrigerated', label: '냉장' },
  { value: 'frozen', label: '냉동' },
  { value: 'room', label: '실온' },
];
export const DATE_TYPES = [
  { value: 'package', label: '포장지 표시 소비기한' },
  { value: 'reference', label: '직접 설정한 보관 참고일' },
];

// 과거 데이터의 구매일/날짜 출처를 추측하지 않습니다.
export function inventoryDraft(item, today = dayKey()) {
  return {
    name: item?.name ?? '',
    quantity: item ? String(item.quantity) : '',
    unit: item?.unit ?? '개',
    purchasedAt: item ? (item.purchasedAt ?? '') : today,
    expiresAt: item?.expiresAt ?? today,
    storageMethod: item?.storageMethod ?? '',
    dateType: item?.dateType ?? '',
  };
}

export function validateInventoryDraft(draft, today = dayKey()) {
  if (!draft.name.trim()) return '식재료명을 입력해 주세요.';
  if (!Number.isFinite(Number(draft.quantity)) || Number(draft.quantity) <= 0)
    return '수량은 0보다 큰 숫자로 입력해 주세요.';
  if (!draft.unit.trim()) return '단위를 입력해 주세요.';
  if (!validDate(draft.purchasedAt)) return '구매일을 YYYY-MM-DD 형식의 올바른 날짜로 입력해 주세요.';
  if (draft.purchasedAt > today) return '구매일은 오늘 이후로 설정할 수 없어요.';
  if (!validDate(draft.expiresAt)) return '소비기한 또는 보관 참고일을 올바른 날짜로 입력해 주세요.';
  if (!STORAGE_METHODS.some(option => option.value === draft.storageMethod)) return '보관 방법을 선택해 주세요.';
  if (!DATE_TYPES.some(option => option.value === draft.dateType)) return '날짜 유형을 선택해 주세요.';
  // 기한이 지난 재고도 등록 가능하며 자동 폐기하지 않습니다.
  return '';
}

export function inventoryRecord(draft, id, previous = {}) {
  const error = validateInventoryDraft(draft);
  if (error) throw new Error(error);
  return { ...previous, ...draft, id, name: draft.name.trim(), unit: draft.unit.trim(), quantity: Number(draft.quantity) };
}
