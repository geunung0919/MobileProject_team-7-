
export const SPENDING_CATEGORIES = [
  '식비',
  '생활용품',
  '교통비',
  '주거비',
  '통신비',
  '의료비',
  '문화·여가',
  '쇼핑',
  '기타',
];

export const emptyLine = (key) => ({
  key,
  name: '',
  rawName: '',
  itemType: 'unknown',
  inventorySelected: false,
  quantity: '',
  unit: '',
  storageMethod: '',
  dateType: 'unknown',
  expiresAt: '',
  paid: '',
});

export function reviewedPayload(draft) {
  const validDate = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;

  const amount = (value) => {
    if (
      !/^\d+$/.test(value) ||
      Number(value) > 1e9
    ) {
      throw new Error(
        '결제 금액은 0원 이상 정수로 입력해 주세요.'
      );
    }

    return Number(value);
  };

  if (
    !draft.title.trim() ||
    !validDate(draft.purchasedAt)
  ) {
    throw new Error(
      '사용처와 실제 구매일을 확인해 주세요.'
    );
  }

  // 신규: 소비 카테고리 검증
  const category = draft.category ?? '기타';

  if (
    typeof category !== 'string' ||
    category.trim().length < 1 ||
    category.trim().length > 10 ||
    category !== category.trim() ||
    /[\x00-\x1F\x7F]/.test(category)
  ) {
    throw new Error(
      '소비 카테고리는 1~10자로 입력해 주세요.'
    );
  }

  const total = amount(draft.total);

  const items = draft.items.map((item) => {
    const name = item.name.trim();

    if (!name) {
      throw new Error(
        '품목명을 입력해 주세요.'
      );
    }

    const entry = {
      receiptItemId: item.key,
      name,
      rawName: item.rawName || name,
      itemType: item.itemType,
      inventorySelected: item.inventorySelected,
      reviewStatus: 'confirmed',
      linePaidAmount:
        item.paid === ''
          ? null
          : amount(item.paid),
    };

    if (item.inventorySelected) {
      if (item.itemType !== 'ingredient') {
        throw new Error(
          `${name}: 식재료만 등록할 수 있어요.`
        );
      }

      if (
        !/^\d+(?:\.\d+)?$/.test(item.quantity) ||
        Number(item.quantity) <= 0 ||
        Number(item.quantity) > 1e6 ||
        !item.unit ||
        !item.storageMethod
      ) {
        throw new Error(
          `${name}: 실제 재고 수량·단위와 보관 방법을 선택해 주세요.`
        );
      }

      if (
        item.dateType !== 'unknown' &&
        !validDate(item.expiresAt)
      ) {
        throw new Error(
          `${name}: 기한 날짜를 확인해 주세요.`
        );
      }

      if (
        item.dateType !== 'unknown' &&
        item.expiresAt < draft.purchasedAt
      ) {
        throw new Error(
          `${name}: 기한은 구매일보다 빠를 수 없어요.`
        );
      }

      Object.assign(entry, {
        quantity: Number(item.quantity),
        unit: item.unit,
        storageMethod: item.storageMethod,
        dateType: item.dateType,
        expiresAt:
          item.dateType === 'unknown'
            ? null
            : item.expiresAt,
      });
    }

    return entry;
  });

  const itemTotal = items.reduce(
    (sum, item) =>
      sum + (item.linePaidAmount ?? 0),
    0
  );

  if (itemTotal > total) {
    throw new Error(
      '품목 결제 금액의 합계가 총 결제액보다 커요.'
    );
  }

  return {
    receiptId: draft.receiptId,
    requestId: draft.requestId || draft.receiptId,
    title: draft.title.trim(),
    purchasedAt: draft.purchasedAt,
    amount: total,
    category,
    items,
    ...(
      [
        'manual',
        'sms',
        'kakao',
        'notification',
        'commerce',
      ].includes(draft.source)
        ? { source: draft.source }
        : {}
    ),
  };
}

export function draftFromRecognition(result) {
  const {
    candidate,
    receipt_document: document,
  } = result ?? {};

  if (
    document?.document_type === 'multiple_receipts' ||
    result?.receipt_document_issues?.includes(
      'multiple_receipts_suspected'
    )
  ) {
    throw new Error(
      '영수증 한 장만 찍거나 잘라서 다시 분석해 주세요.'
    );
  }

  if (
    !candidate ||
    candidate.transaction_kind === 'non_expense'
  ) {
    throw new Error(
      '저장할 구매 영수증을 확인해 주세요.'
    );
  }

  const warnings = Array.isArray(result.warnings)
    ? result.warnings
    : [];

  return {
    title:
      candidate.title_inferred ||
      candidate.title === '사용처 확인 필요'
        ? ''
        : (candidate.title || ''),

    purchasedAt: warnings.some(
      (warning) =>
        typeof warning === 'string' &&
        warning.includes('오늘 날짜로 채웠어요')
    )
      ? ''
      : (candidate.spent_on || ''),

    total:
      candidate.amount_krw == null
        ? ''
        : String(candidate.amount_krw),

    // 신규: OCR 결과에서도 소비 목적을 선택
    category: '기타',

    items: (
      Array.isArray(result.receipt_items)
        ? result.receipt_items
        : []
    )
      .slice(0, 100)
      .map((line, i) => ({
        ...emptyLine(`line-${i + 1}`),
        name: String(
          line.normalized_name ||
          line.raw_name ||
          ''
        ).slice(0, 100),
        rawName: String(
          line.raw_name || ''
        ).slice(0, 100),

        itemType:
          line.item_type === 'ingredient' &&
          document?.allow_inventory === false
            ? 'unknown'
            : [
                'ingredient',
                'prepared_food',
                'household',
                'other',
              ].includes(line.item_type)
              ? line.item_type
              : 'unknown',

        printedAmount:
          Number.isSafeInteger(
            line.item_amount_krw
          )
            ? line.item_amount_krw
            : null,
      })),

    receiptId:
      typeof result.fingerprint === 'string' &&
      /^[a-f0-9]{16,64}$/.test(result.fingerprint)
        ? `ocr-${result.fingerprint}`
        : '',

    warnings,
  };
}

export function draftFromPayment(result, source) {
  if (
    result?.candidate?.transaction_kind ===
      'non_expense' ||
    result?.warnings?.some(
      (warning) =>
        typeof warning === 'string' &&
        warning.includes(
          '새 지출로 가져올 수 없어요'
        )
    )
  ) {
    throw new Error(
      '취소·거절·실패·환불 내역은 새 지출로 저장하지 않아요.'
    );
  }

  const draft = draftFromRecognition(result);

  return {
    ...draft,
    items: [],
    source,
    category: '기타',
    receiptId: draft.receiptId.replace(
      /^ocr-/,
      'payment-'
    ),
  };
}
