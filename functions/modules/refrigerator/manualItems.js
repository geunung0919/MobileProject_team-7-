/* eslint-disable require-jsdoc, max-len */
const {createHash} = require("node:crypto");

const fail = (message, status = 422) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

function date(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
    fail("날짜를 확인해 주세요.");
  }
  return value;
}

function normalize(body) {
  if (!body || typeof body.requestId !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(body.requestId)) fail("저장 요청을 확인해 주세요.");
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 100) fail("식재료 이름을 확인해 주세요.");
  if (!Number.isFinite(body.quantity) || body.quantity <= 0 || body.quantity > 1000000) fail("수량을 확인해 주세요.");
  if (!["개", "봉", "모", "팩", "병", "캔", "g", "kg", "ml", "L"].includes(body.unit)) fail("단위를 확인해 주세요.");
  if (!["refrigerated", "frozen", "room"].includes(body.storageMethod)) fail("보관 방법을 확인해 주세요.");
  if (!["package", "reference", "unknown"].includes(body.dateType)) fail("기한 유형을 확인해 주세요.");
  const purchasedAt = body.purchasedAt == null ? null : date(body.purchasedAt);
  const expiresAt = body.dateType === "unknown" ? null : date(body.expiresAt);
  const today = new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Seoul"}).format(new Date());
  if (purchasedAt && purchasedAt > today) fail("구매일은 미래일 수 없어요.");
  if (purchasedAt && expiresAt && expiresAt < purchasedAt) fail("기한은 구매일보다 빠를 수 없어요.");
  if (body.dateType === "unknown" && body.expiresAt != null) fail("기한 미입력을 선택했으면 날짜를 비워 주세요.");
  const scale = ["kg", "L"].includes(body.unit) ? 1000 : 1;
  const quantity = body.quantity * scale;
  if (quantity > 1000000) fail("수량을 확인해 주세요.");
  const unit = body.unit === "kg" ? "g" : body.unit === "L" ? "ml" : body.unit;
  return {name, quantity, unit, purchasedAt, expiresAt, storageMethod: body.storageMethod, dateType: body.dateType};
}

async function createManualItem(db, uid, body) {
  const values = normalize(body);
  const id = `manual_${body.requestId}`;
  const root = `users/${uid}`;
  const ref = db.doc(`${root}/fridgeItems/${id}`);
  const request = db.doc(`${root}/fridgeRequests/${id}`);
  const digest = createHash("sha256").update(JSON.stringify(values)).digest("hex");
  return db.runTransaction(async (tx) => {
    const existing = await tx.get(request);
    if (existing.exists) {
      if (existing.data().digest !== digest) fail("같은 요청으로 다른 식재료를 저장할 수 없어요.", 409);
      return {id, replayed: true};
    }
    const stamp = new Date().toISOString();
    tx.create(ref, {...values, id, category: "food", remainingCost: null, source: "manual", version: 1, updatedAt: stamp});
    tx.create(request, {digest, createdAt: stamp});
    return {id, replayed: false};
  });
}

async function changeFridgeItem(db, uid, body) {
  if (!body || !["update", "delete"].includes(body.action) ||
      typeof body.id !== "string" || !/^[a-zA-Z0-9_-]{1,90}$/.test(body.id) ||
      !Number.isSafeInteger(body.version) || body.version < 1) fail("식재료 수정 정보를 확인해 주세요.");
  const values = body.action === "update" ? normalize({...body, requestId: "edit"}) : null;
  const ref = db.doc(`users/${uid}/fridgeItems/${body.id}`);
  return db.runTransaction(async (tx) => {
    const current = await tx.get(ref);
    if (!current.exists) fail("식재료를 찾지 못했어요.", 404);
    const previous = current.data();
    if (previous.version !== body.version) fail("다른 곳에서 식재료가 바뀌었어요. 목록을 다시 열어 주세요.", 409);
    if (body.action === "delete") {
      tx.delete(ref);
      return {id: body.id, deleted: true};
    }
    const version = body.version + 1;
    const remainingCost = previous.quantity > 0 && Number.isFinite(previous.remainingCost) &&
      previous.unit === values.unit ? Math.min(previous.remainingCost, Math.round(previous.remainingCost * values.quantity / previous.quantity)) : null;
    tx.update(ref, {...values, remainingCost, version, updatedAt: new Date().toISOString()});
    return {id: body.id, version};
  });
}

module.exports = {createManualItem, changeFridgeItem};
