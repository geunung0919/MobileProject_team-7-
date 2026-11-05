import { addDays, parseAmount } from './format';

// 직접 입력 / 영수증 인식 결과 / 지출 상세 화면이 함께 쓰는 "구매 품목" 계산 모음.
// 화면마다 따로 복사해 두지 않도록 한곳에 모았습니다. (화면의 상태 구조는 각 화면이 그대로 가집니다.)
//
// 품목(item) 모양: { key, name, quantity(숫자), price(숫자만 담은 글자 "2800"), inFridge(true/false), expiry("YYYY-MM-DD" | null) }

// 식품 품목의 유통기한 기본값 (구매일로부터 며칠 뒤)
export const DEFAULT_EXPIRY_DAYS = 14;
// 냉장고에 담을 때 쓰는 수량 단위 ("개"로 고정)
export const FRIDGE_UNIT = '개';

// 빈 품목 카드 하나
export const createEmptyItem = (key) => ({
  key,
  name: '',
  quantity: 1,
  price: '',
  inFridge: false,
  expiry: null,
});

// 품목 하나에 바뀐 값(patch)을 적용합니다.
// 식품을 처음 체크하면 유통기한을 구매일 + 14일로 미리 채워 줍니다.
export const applyItemPatch = (item, patch, purchaseDate) => {
  const next = { ...item, ...patch };
  if (patch.inFridge && !next.expiry) next.expiry = addDays(purchaseDate, DEFAULT_EXPIRY_DAYS);
  return next;
};

// 품목 합계 금액 (가격 x 수량). 가격이 비었거나 이상한 값이면 0 으로 칩니다.
export const sumItems = (items) =>
  items.reduce((sum, it) => sum + parseAmount(it.price) * (Number(it.quantity) || 0), 0);

// 품목 개수의 합 (수량을 모두 더한 값)
export const countItems = (items) => items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

// 식품으로 체크한(냉장고에 담을) 품목 수
export const countFridgeItems = (items) => items.filter((it) => it.inFridge).length;

// 이름/가격 입력 확인. 문제가 있으면 안내 글을, 괜찮으면 null 을 돌려줍니다.
export const validateItemFields = (items) =>
  items.some((it) => !it.name.trim() || parseAmount(it.price) === 0)
    ? '모든 품목의 이름과 가격을 입력해 주세요.'
    : null;

// 이름/가격 + 유통기한(구매일과 같거나 이후) 입력 확인
export const validateItems = (items, purchaseDate) => {
  const fieldError = validateItemFields(items);
  if (fieldError) return fieldError;
  if (items.some((it) => it.inFridge && it.expiry < purchaseDate)) {
    return '유통기한은 구매일과 같거나 이후여야 해요.';
  }
  return null;
};

// 화면의 품목 -> 저장할 품목. id 를 따로 정하려면 getId(item, index) 를 넘기세요. (기본은 key)
export const toSavedItems = (items, getId = (it) => it.key) =>
  items.map((it, index) => ({
    id: getId(it, index),
    name: it.name.trim(),
    unitPrice: parseAmount(it.price),
    quantity: it.quantity,
    inFridge: it.inFridge,
  }));

// 식품으로 체크한 품목을 냉장고에 담습니다.
export const addCheckedItemsToFridge = (items, purchaseDate, addFridgeItem) => {
  items
    .filter((it) => it.inFridge)
    .forEach((it) =>
      addFridgeItem({
        name: it.name.trim(),
        quantity: it.quantity,
        unit: FRIDGE_UNIT,
        purchaseDate,
        expiry: it.expiry,
      }),
    );
};

// 품목을 추가한 직후 목록 맨 아래로 스크롤합니다. (새 카드가 그려진 뒤에 움직이도록 잠깐 기다립니다)
export const scrollToEndSoon = (scrollRef) => {
  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
};
