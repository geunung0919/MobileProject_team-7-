// 지출 상세 화면 문구.
// 구매 품목 데이터는 소비 내역(transaction)의 items 에 들어 있습니다. (data/spending/spending.js 참고)

export const spendingDetailTexts = {
  title: '지출 상세',
  totalLabel: '총 지출',
  itemsTitle: '구매한 품목',
  fridgeBadge: (count) => `냉장고에 ${count}개 담김`,
  fridgeNotice: '냉장고에 담은 식품은 냉장고 탭에서 볼 수 있어요.',
  emptyItems: '기록된 품목이 없어요.',
  emptyItemsHint: '영수증으로 기록하면 구매 품목도 함께 저장돼요.',
  notFound: '지출 내역을 찾을 수 없어요.',
  receiptLabel: '영수증',
  editLabel: '수정',
  editTitle: '지출 수정',
  doneLabel: '수정 완료',
  cancelLabel: '취소',
  nameLabel: '이름',
  namePlaceholder: '예: 이마트, 스타벅스, 온라인 주문',
  dateLabel: '구매일',
  addItemLabel: '품목 추가',
  editFridgeNote: '냉장고에 담긴 식재료는 여기서 바뀌지 않아요. 냉장고 탭에서 수정해 주세요.',
  mismatch: (total, itemsTotal) =>
    `총 지출(${total}원)과 품목 합계(${itemsTotal}원)가 달라요.`,
  matchAction: '품목 합계로 맞추기',
  deleteTitle: '지출 내역을 삭제할까요?',
  deleteMessage: (title) =>
    `'${title}' 내역이 삭제되고 이번 달 지출 합계에서도 빠져요. 냉장고에 담은 식재료는 그대로 남아요.`,
};
