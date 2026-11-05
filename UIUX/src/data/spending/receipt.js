// 영수증 인식 결과 화면 더미 데이터.
//
// ★ 카메라/OCR 담당 화면과 약속할 "데이터 형식" 입니다.
//   카메라 화면이 완성되면 인식 결과를 아래 모양으로 만들어서 넘겨주면 됩니다.
//     navigation.navigate('ReceiptResult', { receipt })
//   (params 가 없으면 이 파일의 sampleReceipt 가 대신 표시됩니다.)
//
// receipt = {
//   store: '이마트 성수점',       // 상호명
//   date: '2026-10-24',          // YYYY-MM-DD
//   time: '14:32',               // HH:mm
//   total: 48500,                // 영수증에 찍힌 총액
//   items: [{ id, name, unitPrice, quantity, inFridge }],
// }
//   (화면에서 사용자가 상호명 / 날짜 / 총액 / 품목을 수정할 수 있고, 수정한 값이 저장됩니다.)
//   inFridge: 냉장고에 보관하는 식품이면 true (지출 상세에서 "냉장고에 N개 담김"으로 셉니다).
//             OCR 이 구분하지 못하면 생략해도 됩니다(false 로 취급).

import { toDateString } from '../../utils/format';

// 샘플 영수증의 날짜는 항상 오늘입니다 (저장하면 이번 달 "최근 지출 내역"에 바로 보이도록).
export const sampleReceipt = {
  store: '이마트 성수점',
  date: toDateString(new Date()),
  time: '14:32',
  total: 48500,
  items: [
    { id: 'r1', name: '서울우유 1L', unitPrice: 2800, quantity: 2, inFridge: true },
    { id: 'r2', name: '무항생제 달걀 15구', unitPrice: 7900, quantity: 1, inFridge: true },
    { id: 'r3', name: '국산콩 두부 300g', unitPrice: 1800, quantity: 2, inFridge: true },
    { id: 'r4', name: '바나나 한 송이', unitPrice: 4900, quantity: 1, inFridge: true },
    { id: 'r5', name: '햇쌀 4kg', unitPrice: 18900, quantity: 1, inFridge: false },
    { id: 'r6', name: '데일리 샐러드', unitPrice: 3800, quantity: 2, inFridge: true },
  ],
};

export const receiptTexts = {
  title: '영수증 인식 결과',
  subtitle: '촬영한 영수증의 내용을 읽어왔어요.',
  totalLabel: '영수증 총액',
  badge: '인식 완료',
  itemsTitle: '세부 품목',
  headerName: '품목 / 단가',
  headerQty: '수량',
  headerSum: '품목 합계',
  saveLabel: '저장하기',
  // 수정 모드: 영수증을 잘못 읽었을 때 사용자가 직접 고칠 수 있습니다.
  editLabel: '수정',
  editSubtitle: '잘못 읽은 부분을 직접 고쳐 주세요.',
  editHint: '식품은 체크하면 냉장고에 담겨요',
  doneLabel: '수정 완료',
  cancelLabel: '취소',
  storeLabel: '상호명',
  storePlaceholder: '예: 이마트 성수점',
  dateLabel: '구매일',
  totalFieldLabel: '영수증 총액',
  addItemLabel: '품목 추가',
  // 영수증 총액과 품목 합계가 다를 때 (인식 오류 가능성)
  mismatch: (total, itemsTotal) =>
    `영수증 총액(${total}원)과 품목 합계(${itemsTotal}원)가 달라요. 잘못 읽은 곳이 없는지 확인해 주세요.`,
  matchAction: '품목 합계로 맞추기',
  fridgeSaveLabel: (count) => `저장하고 냉장고에 ${count}개 담기`,
};
