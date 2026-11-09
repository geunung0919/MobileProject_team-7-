import { sampleReceipt } from './receipt';

// 소비 화면 더미 데이터. icon 은 MaterialCommunityIcons 이름입니다.
// - daysAgo: 더미 전용. 오늘로부터 며칠 전 지출인지 (AppDataContext 가 실제 date 로 바꿔 줌)
//   실제 데이터에는 date("YYYY-MM-DD")를 넣으세요.
// - source: 'receipt' 면 영수증 지출 (상세에서 "영수증 · 식료품" 으로 표시)
// - items: 구매 품목 [{ id, name, unitPrice, quantity, inFridge }] (없으면 상세에 품목 없이 표시)

export const spendingData = {
  budget: 1000000,
  // 카테고리를 고르지 않은 지출(직접 입력 등)의 기본값
  defaultCategory: '기타',
  defaultIcon: 'wallet-outline',
  transactions: [
    {
      id: 't1',
      title: '이마트 성수점',
      daysAgo: 0,
      category: '식료품',
      amount: 48500,
      icon: 'basket-outline',
      source: 'receipt',
      items: sampleReceipt.items,
    },
    { id: 't2', title: '오늘의 식탁', daysAgo: 0, category: '식비', amount: 12000, icon: 'silverware-fork-knife' },
    { id: 't3', title: '스타벅스', daysAgo: 1, category: '카페·간식', amount: 5500, icon: 'coffee-outline' },
    { id: 't4', title: '올리브영', daysAgo: 1, category: '생활용품', amount: 23900, icon: 'shopping-outline' },
  ],
  // + 버튼의 "소비 추가" 시트 선택지
  addOptions: [
    {
      id: 'receipt',
      title: '영수증 촬영하기',
      description: '영수증을 촬영해 소비를 기록해요.',
      icon: 'camera-outline',
    },
    {
      id: 'manual',
      title: '직접 입력하기',
      description: '구매 품목, 가격, 날짜를 입력해요.',
      icon: 'square-edit-outline',
    },
  ],
};