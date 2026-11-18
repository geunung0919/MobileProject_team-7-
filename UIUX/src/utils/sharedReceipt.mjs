export const emptyLine = (key) => ({ key, name: '', rawName: '', itemType: 'unknown', inventorySelected: false,
  quantity: '', unit: '', storageMethod: '', dateType: 'unknown', expiresAt: '', paid: '' });

// "냉장고에도 등록"을 고르면 비어 있는 단위·보관 방법만 흔한 값(개·냉장)으로 채워 둡니다 (화면에서 바로 고칠 수 있음).
// 재고 수량은 영수증 숫자(팩 수일 수 있음)를 쓰지 않고 사용자가 실제 개수를 입력합니다.
export function inventoryDefaults(item) {
  return {
    unit: item.unit || '개',
    storageMethod: item.storageMethod || 'refrigerated',
  };
}

export function reviewedPayload(draft) {
  const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  const amount = (value) => {
    if (!/^\d+$/.test(value) || Number(value) > 1e9) throw new Error('결제 금액은 0원 이상 정수로 입력해 주세요.');
    return Number(value);
  };
  if (!draft.title.trim() || !validDate(draft.purchasedAt)) throw new Error('사용처와 실제 구매일을 확인해 주세요.');
  const total = amount(draft.total);
  const items = draft.items.map((item) => {
    const name = item.name.trim();
    if (!name) throw new Error('품목명을 입력해 주세요.');
    const entry = { receiptItemId: item.key, name, rawName: item.rawName || name, itemType: item.itemType,
      inventorySelected: item.inventorySelected, reviewStatus: 'confirmed',
      linePaidAmount: item.paid === '' ? null : amount(item.paid) };
    if (item.inventorySelected) {
      if (item.itemType !== 'ingredient') throw new Error(`${name}: 식재료만 등록할 수 있어요.`);
      if (!/^\d+(?:\.\d+)?$/.test(item.quantity) || Number(item.quantity) <= 0 || Number(item.quantity) > 1e6 || !item.unit || !item.storageMethod) {
        throw new Error(`${name}: 실제 재고 수량·단위와 보관 방법을 선택해 주세요.`);
      }
      if (item.dateType !== 'unknown' && !validDate(item.expiresAt)) throw new Error(`${name}: 기한 날짜를 확인해 주세요.`);
      if (item.dateType !== 'unknown' && item.expiresAt < draft.purchasedAt) {
        throw new Error(`${name}: 기한은 구매일보다 빠를 수 없어요.`);
      }
      Object.assign(entry, { quantity: Number(item.quantity), unit: item.unit, storageMethod: item.storageMethod,
        dateType: item.dateType, expiresAt: item.dateType === 'unknown' ? null : item.expiresAt });
    }
    return entry;
  });
  if (items.reduce((n, item) => n + (item.linePaidAmount ?? 0), 0) > total) throw new Error('품목 결제 금액의 합계가 총 결제액보다 커요.');
  return { receiptId: draft.receiptId, requestId: draft.receiptId, title: draft.title.trim(), purchasedAt: draft.purchasedAt, amount: total, items,
    ...(['manual', 'sms', 'kakao', 'notification', 'commerce'].includes(draft.source) ? { source: draft.source } : {}) };
}

export function draftFromRecognition(result) {
  const { candidate, receipt_document: document } = result ?? {};
  if (document?.document_type === 'multiple_receipts' || result?.receipt_document_issues?.includes('multiple_receipts_suspected')) {
    throw new Error('영수증 한 장만 찍거나 잘라서 다시 분석해 주세요.');
  }
  if (!candidate || candidate.transaction_kind === 'non_expense') throw new Error('저장할 구매 영수증을 확인해 주세요.');
  const warnings = Array.isArray(result.warnings) ? result.warnings : [];
  return {
    title: candidate.title_inferred || candidate.title === '사용처 확인 필요' ? '' : (candidate.title || ''),
    purchasedAt: warnings.some((warning) => typeof warning === 'string' && warning.includes('오늘 날짜로 채웠어요')) ? '' : (candidate.spent_on || ''),
    total: candidate.amount_krw == null ? '' : String(candidate.amount_krw),
    items: (Array.isArray(result.receipt_items) ? result.receipt_items : []).slice(0, 100).map((line, i) => ({
      ...emptyLine(`line-${i + 1}`),
      name: String(line.normalized_name || line.raw_name || '').slice(0, 100),
      rawName: String(line.raw_name || '').slice(0, 100),
      itemType: line.item_type === 'ingredient' && document?.allow_inventory === false ? 'unknown' :
        ['ingredient', 'prepared_food', 'household', 'other'].includes(line.item_type) ? line.item_type : 'unknown',
      printedAmount: Number.isSafeInteger(line.item_amount_krw) ? line.item_amount_krw : null,
    })),
    receiptId: typeof result.fingerprint === 'string' && /^[a-f0-9]{16,64}$/.test(result.fingerprint) ? `ocr-${result.fingerprint}` : '',
    warnings,
  };
}

export function draftFromPayment(result, source) {
  if (result?.candidate?.transaction_kind === 'non_expense' ||
      result?.warnings?.some((warning) => typeof warning === 'string' && warning.includes('새 지출로 가져올 수 없어요'))) {
    throw new Error('취소·거절·실패·환불 내역은 새 지출로 저장하지 않아요.');
  }
  const draft = draftFromRecognition(result);
  return { ...draft, items: [], source,
    receiptId: draft.receiptId.replace(/^ocr-/, 'payment-') };
}
