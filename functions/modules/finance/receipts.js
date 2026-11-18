/* eslint-disable require-jsdoc, max-len */
const {createHash} = require("node:crypto");
const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const fail = (message, status = 422) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
const text = (v, key, max = 100) => {
  if (typeof v !== "string" || !v.trim() || v.length > max) fail(`${key} 확인 필요`);
  return v.trim();
};
const id = (v, key) => {
  if (typeof v !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(v)) fail(`${key} 확인 필요`);
  return v;
};
const date = (v) => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v) fail("날짜 확인 필요");
  return v;
};
const money = (v) => {
  if (!Number.isSafeInteger(v) || v < 0 || v > 1000000000) fail("금액 확인 필요");
  return v;
};
function normalize(body) {
  if (!body || typeof body !== "object") fail("요청 확인 필요");
  const requestId = id(body.requestId, "requestId");
  const receiptId = id(body.receiptId, "receiptId");
  const title = text(body.title, "사용처");
  const purchasedAt = date(body.purchasedAt);
  const today = new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Seoul"}).format(new Date());
  if (purchasedAt > today) fail("구매일은 미래일 수 없어요.");
  const amount = money(body.amount);
  const category = body.category;
  if (category !== undefined &&
      (typeof category !== "string" ||
       category.trim().length < 1 ||
       category.trim().length > 10 ||
       category !== category.trim() ||
       Array.from(category).some((char) => {
         const code = char.charCodeAt(0);
         return code <= 31 || code === 127;
       }))) {
    fail("소비 카테고리는 1~10자로 입력해 주세요.");
  }
  if (!Array.isArray(body.items) || body.items.length > 100) fail("품목은 100개 이하로 보내 주세요.");
  const seen = new Set();
  const items = body.items.map((raw) => {
    if (!raw || typeof raw !== "object") fail("품목 확인 필요");
    const receiptItemId = id(raw.receiptItemId, "receiptItemId");
    if (seen.has(receiptItemId)) fail("중복 품목 ID");
    seen.add(receiptItemId);
    if (raw.reviewStatus !== "confirmed") fail("품목 확인을 완료해 주세요.");
    if (!["ingredient", "prepared_food", "household", "other", "unknown"].includes(raw.itemType)) fail("품목 분류 확인 필요");
    if (typeof raw.inventorySelected !== "boolean") fail("냉장고 등록 선택 확인 필요");
    const item = {receiptItemId, name: text(raw.name, "품목명"), rawName: text(raw.rawName || raw.name, "원래 품목명"),
      itemType: raw.itemType, reviewStatus: "confirmed", inventorySelected: raw.inventorySelected,
      linePaidAmount: raw.linePaidAmount == null ? null : money(raw.linePaidAmount)};
    if (item.inventorySelected) {
      if (item.itemType !== "ingredient") fail("식재료만 냉장고에 등록할 수 있어요.");
      if (typeof raw.quantity !== "number" || !Number.isFinite(raw.quantity) || raw.quantity <= 0 || raw.quantity > 1000000) fail("재고 수량 확인 필요");
      if (!["g", "ml", "개", "팩"].includes(raw.unit)) fail("단위는 g, ml, 개, 팩 중 확인해 주세요.");
      if (!["refrigerated", "frozen", "room"].includes(raw.storageMethod)) fail("보관 방법 확인 필요");
      if (!["package", "reference", "unknown"].includes(raw.dateType)) fail("날짜 유형 확인 필요");
      if (raw.dateType === "unknown" && raw.expiresAt) fail("기한 미입력은 날짜를 비워 주세요.");
      const expiresAt = raw.dateType === "unknown" ? null : date(raw.expiresAt);
      if (expiresAt && expiresAt < purchasedAt) fail("기한은 구매일보다 빠를 수 없어요.");
      Object.assign(item, {quantity: raw.quantity, unit: raw.unit, storageMethod: raw.storageMethod,
        dateType: raw.dateType, expiresAt});
    }
    return item;
  }).sort((a, b) => a.receiptItemId.localeCompare(b.receiptItemId));
  const knownTotal = items.reduce((n, item) => n + (item.linePaidAmount || 0), 0);
  if (knownTotal > amount) fail("품목별 실제 결제 금액 합계가 총 결제 금액보다 커요.");
  if (body.source !== undefined && !["manual", "ocr", "sms", "kakao", "notification", "commerce"].includes(body.source)) fail("입력 방식 확인 필요");
  // Keep the digest of existing OCR requests unchanged.
  return {requestId, receiptId, title, purchasedAt, amount, items,
    ...(category !== undefined ? {category} : {}),
    ...(body.source && body.source !== "ocr" ? {source: body.source} : {})};
}
async function confirmReceipt(db, uid, body) {
  const input = normalize(body);
  const {requestId, ...payload} = input;
  const digest = hash(payload);
  const root = `users/${uid}`;
  const receipt = db.doc(`${root}/receipts/${input.receiptId}`);
  const request = db.doc(`${root}/importRequests/${requestId}`);
  const expenseId = `receipt_${hash(input.receiptId).slice(0, 40)}`;
  const result = {receiptId: input.receiptId, expenseId, inventoryIds: input.items.filter((i) => i.inventorySelected)
      .map((i) => hash([input.receiptId, i.receiptItemId]))};
  return db.runTransaction(async (tx) => {
    const priorRequest = await tx.get(request);
    const priorReceipt = await tx.get(receipt);
    for (const prior of [priorRequest, priorReceipt]) {
      if (prior.exists && prior.data().digest !== digest) fail("같은 ID로 다른 내용이 전달됐어요.", 409);
    }
    if (priorReceipt.exists) {
      const existing = priorReceipt.data().result;
      if (!priorRequest.exists) tx.create(request, {digest, result: existing, createdAt: new Date().toISOString()});
      return {...existing, replayed: true};
    }
    if (priorRequest.exists) fail("저장 연결 기록 확인이 필요해요.", 409);
    const stamp = new Date().toISOString();
    tx.create(receipt, {...payload, digest, result, createdAt: stamp});
    tx.create(request, {digest, result, createdAt: stamp});
    tx.create(db.doc(`${root}/transactions/${expenseId}`), {
      id: expenseId, receiptId: input.receiptId, title: input.title, amount: input.amount,
      date: input.purchasedAt, category: input.category ?? (input.source === "manual" ? "직접 입력" : input.source ? "결제 가져오기" : "영수증"), source: input.source || "ocr", items: input.items, createdAt: stamp,
    });
    for (const item of input.items) {
      tx.create(db.doc(`${receipt.path}/items/${item.receiptItemId}`), {...item, expenseId});
      if (!item.inventorySelected) continue;
      const inventoryId = hash([input.receiptId, item.receiptItemId]);
      tx.create(db.doc(`${root}/fridgeItems/${inventoryId}`), {
        id: inventoryId, name: item.name, rawName: item.rawName, category: "food",
        quantity: item.quantity, unit: item.unit, purchasedAt: input.purchasedAt,
        storageMethod: item.storageMethod, dateType: item.dateType, expiresAt: item.expiresAt,
        remainingCost: item.linePaidAmount, sourceReceiptId: input.receiptId,
        sourceReceiptItemId: item.receiptItemId, sourceExpenseId: expenseId, version: 1, updatedAt: stamp,
      });
      tx.create(db.doc(`${root}/receiptInventoryLinks/${inventoryId}`), {
        receiptId: input.receiptId, receiptItemId: item.receiptItemId, expenseId, inventoryId,
      });
    }
    return {...result, replayed: false};
  });
}
module.exports = {normalize, confirmReceipt};
