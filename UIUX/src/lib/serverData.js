// 서버(jachwi-core) 데이터 <-> 앱 화면 데이터 변환. 화면 코드가 쓰는 형식은 src/data/README.md 참고.
// 화면 바깥의 순수 함수라서 테스트하기 쉽게 따로 둡니다 (tests/serverData.test.mjs).

const DEFAULT_ICON = 'wallet-outline';
const RECEIPT_ICON = 'receipt-text-outline';
const FRIDGE_ICON = 'food-variant';
// 서버에 날짜가 없는 재고(예전 앱에서 넣은 것)는 화면에서 구매일/오늘 + 14일로 보여 줍니다.
const UNKNOWN_EXPIRY_DAYS = 14;

// ---- 날짜 (utils/format 과 같은 규칙, 이 파일만으로 테스트할 수 있게 따로 둡니다) ----
const pad = (n) => String(n).padStart(2, '0');
export const toDateString = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (dateString, days) => {
  const [y, m, d] = dateString.split('-').map(Number);
  return toDateString(new Date(y, m - 1, d + days));
};

// ---- 카테고리: 화면은 한글 이름, 서버 예산 계산은 5가지 분류 ----
const TO_SERVER_CATEGORY = {
  식품: 'groceries',
  식재료: 'groceries',
  장보기: 'groceries',
  식비: 'food',
  외식: 'food',
  배달: 'food',
  '카페·간식': 'food',
  교통: 'transport',
  생활용품: 'living',
};
const SERVER_CATEGORY_LABEL = {
  groceries: '식품',
  food: '식비',
  transport: '교통',
  living: '생활용품',
  other: '기타',
};
export const toServerCategory = (label) => TO_SERVER_CATEGORY[label] ?? 'other';

// ---- 소비 ----
// 서버 지출 -> 화면 transaction
export function expenseToTransaction(expense) {
  const meta = expense.meta ?? {};
  const fromReceipt = meta.source === 'receipt' || expense.import_source === 'ocr';
  const items =
    meta.items ??
    (expense.receipt_items?.length
      ? expense.receipt_items.map((it, index) => {
          const quantity = Number(it.quantity) > 0 ? Number(it.quantity) : 1;
          return {
            id: `${expense.id}-${index}`,
            name: it.normalized_name || it.raw_name,
            unitPrice: it.item_amount_krw ? Math.round(it.item_amount_krw / quantity) : 0,
            quantity,
            inFridge: !!it.is_ingredient,
          };
        })
      : null);
  return {
    id: expense.id,
    title: expense.title,
    amount: expense.amount_krw,
    date: expense.spent_on,
    category: meta.category_label ?? SERVER_CATEGORY_LABEL[expense.category] ?? '기타',
    icon: meta.icon ?? (fromReceipt ? RECEIPT_ICON : DEFAULT_ICON),
    ...(fromReceipt ? { source: 'receipt' } : {}),
    ...(items ? { items } : {}),
  };
}

const cleanItems = (items) =>
  (items ?? []).slice(0, 50).map((it, index) => ({
    id: String(it.id ?? `i${index + 1}`).slice(0, 64),
    name: String(it.name ?? '').trim().slice(0, 120) || '품목',
    unitPrice: Math.max(0, Math.round(Number(it.unitPrice) || 0)),
    quantity: Math.min(1000, Math.max(1, Number(it.quantity) || 1)),
    inFridge: !!it.inFridge,
  }));

// 화면 transaction -> 서버 지출 입력 (POST /expenses, PUT /expenses/{id})
export function transactionToExpenseInput(t) {
  const items = t.items ? cleanItems(t.items) : null;
  return {
    title: String(t.title ?? '').trim().slice(0, 100),
    amount_krw: Math.round(Number(t.amount) || 0),
    spent_on: t.date,
    category: toServerCategory(t.category),
    meta: {
      category_label: String(t.category ?? '기타').slice(0, 30) || '기타',
      ...(t.icon ? { icon: String(t.icon).slice(0, 60) } : {}),
      source: t.source === 'receipt' ? 'receipt' : 'manual',
      ...(items ? { items } : {}),
    },
  };
}

const ITEM_TYPES = ['ingredient', 'food', 'living', 'other', 'unknown'];
const MATCH_METHODS = ['none', 'rule', 'exact', 'fuzzy', 'learned', 'dataset', 'ai', 'unknown'];

// 영수증 OCR 지출 -> 서버 영수증 저장 입력 (POST /imports/confirm)
// 사용자가 화면에서 고친 품목을 기준으로 하고, OCR 원래 정보(원문 이름, 바코드 등)는 같은 품목이면 이어 붙입니다.
// 서버는 이 확인 결과로 다음 영수증의 식재료 분류를 학습하고, 같은 영수증 중복 저장을 막습니다.
export function receiptConfirmInput(t, ocr) {
  const original = Array.isArray(ocr?.receipt_items) ? ocr.receipt_items : [];
  const receiptItems = cleanItems(t.items).map((it) => {
    const match = /^ocr-(\d+)$/.exec(it.id);
    const from = match ? original[Number(match[1])] : null;
    const itemType = it.inFridge
      ? 'ingredient'
      : ITEM_TYPES.includes(from?.item_type) && from.item_type !== 'ingredient'
        ? from.item_type
        : 'unknown';
    const lineAmount = it.unitPrice * it.quantity;
    return {
      raw_name: String(from?.raw_name || it.name).slice(0, 120),
      normalized_name: it.name,
      quantity: it.quantity,
      unit: '개',
      item_amount_krw: lineAmount > 0 ? Math.min(lineAmount, 1_000_000_000) : null,
      product_code: from?.product_code ? String(from.product_code).slice(0, 20) : null,
      item_type: itemType,
      is_ingredient: it.inFridge,
      ingredient_confidence: it.inFridge ? 1 : Math.min(1, Math.max(0, Number(from?.ingredient_confidence) || 0)),
      match_method: MATCH_METHODS.includes(from?.match_method) ? from.match_method : null,
      matched_alias: from?.matched_alias ? String(from.matched_alias).slice(0, 120) : null,
      suggested_for_inventory: it.inFridge,
    };
  });
  return {
    ...transactionToExpenseInput({ ...t, source: 'receipt' }),
    raw_text: String(ocr.raw_text).slice(0, 5000),
    source: 'ocr',
    receipt_items: receiptItems,
  };
}

// 영수증 분석 결과(POST /receipts/analyze) -> 영수증 결과 화면 형식 (src/data/spending/receipt.js)
export function receiptFromAnalysis(result, today = toDateString(new Date())) {
  const candidate = result?.candidate ?? {};
  const allowInventory = result?.receipt_document?.allow_inventory !== false;
  const items = (result?.receipt_items ?? []).map((it, index) => {
    const quantity = Number(it.quantity) > 0 ? Number(it.quantity) : 1;
    const name =
      it.normalized_name && it.normalized_name !== '상품명 확인 필요' ? it.normalized_name : it.raw_name;
    return {
      id: `ocr-${index}`,
      name: name ?? '',
      unitPrice: it.unit_price_krw ?? (it.item_amount_krw ? Math.round(it.item_amount_krw / quantity) : 0),
      quantity,
      inFridge: allowInventory && !!(it.suggested_for_inventory || it.is_ingredient),
    };
  });
  const time = /\b([01]?\d|2[0-3]):([0-5]\d)\b/.exec(result?.raw_text ?? '');
  const itemsTotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  return {
    store: candidate.title && candidate.title !== '사용처 확인 필요' ? candidate.title : '',
    date: candidate.spent_on ?? today,
    time: time ? `${pad(Number(time[1]))}:${time[2]}` : '',
    total: candidate.amount_krw ?? itemsTotal,
    items,
    warnings: Array.isArray(result?.warnings) ? result.warnings : [],
    ocr: { raw_text: result?.raw_text ?? '', receipt_items: result?.receipt_items ?? [] },
  };
}

// ---- 냉장고 ----
// 화면 단위 -> 서버 단위 (서버는 g / ml / piece / pack 만 계산). 그 밖의 단위는 pack 으로 세고, 화면 단위는 display_unit 에 그대로 둡니다.
const UNIT_TO_SERVER = { 개: ['piece', 1], 팩: ['pack', 1], g: ['g', 1], kg: ['g', 1000], ml: ['ml', 1], L: ['ml', 1000] };

const fridgeText = (amount, unit, detail) => `${amount}${unit}${detail ? ` · ${detail}` : ''}`;

export function fridgeToServerItem(it) {
  const amount = Number(it.amount) > 0 ? Number(it.amount) : 1;
  const unit = it.unit || '개';
  const [serverUnit, factor] = UNIT_TO_SERVER[unit] ?? ['pack', 1];
  return {
    item_id: String(it.id).slice(0, 64),
    name: String(it.name).trim().slice(0, 100) || '식재료',
    quantity: amount * factor,
    unit: serverUnit,
    storage: 'fridge',
    target_date: it.expiry ?? null,
    date_source: it.expiry ? 'estimate' : 'unknown',
    display_quantity: amount,
    display_unit: unit.slice(0, 20),
    ...(it.detail ? { detail: String(it.detail).slice(0, 40) } : {}),
    purchase_date: it.purchaseDate ?? null,
    icon: (it.icon || FRIDGE_ICON).slice(0, 60),
  };
}

export function serverItemToFridge(s, today = toDateString(new Date())) {
  const unit = s.display_unit ?? ({ piece: '개', pack: '팩' }[s.unit] ?? s.unit);
  const amount = s.display_quantity ?? s.quantity;
  const purchaseDate = s.purchase_date ?? null;
  return {
    id: s.item_id,
    name: s.name,
    quantity: fridgeText(amount, unit, s.detail),
    amount,
    unit,
    ...(s.detail ? { detail: s.detail } : {}),
    purchaseDate,
    expiry: s.target_date ?? addDays(purchaseDate ?? today, UNKNOWN_EXPIRY_DAYS),
    icon: s.icon ?? FRIDGE_ICON,
  };
}

export { fridgeText };
