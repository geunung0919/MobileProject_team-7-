// 디자인 토큰. 색상은 스크린샷에서 추정한 값이므로
// Figma Inspect 값과 다르면 이 파일만 수정하면 전체에 반영됩니다.

export const colors = {
  background: '#FFFFFF',
  textPrimary: '#1F3A30',
  textSecondary: '#666D69', // 흰색 5.3:1 / 카드 4.9:1 (WCAG AA 4.5:1 이상)
  placeholder: '#6B726E', // 흰색 4.9:1 / 입력창(cardBg) 4.5:1 이상
  green: '#26784F', // 흰 글자 5.4:1, 연한 초록 배경 위 글자 4.6:1 이상
  greenLight: '#5CC79A',
  heroBg: '#EEF6F1',
  badgeBg: '#DFF0E6',
  cardBg: '#F5F6F4',
  divider: '#E6E8E5',
  calmBg: '#EEF0ED', // 기한 여유 태그 배경 (textSecondary 글자 4.6:1)
  progressTrack: '#DCEBE1',
  warnBg: '#FCEBE1',
  warnText: '#A84E27', // warnBg 위 4.8:1
  tabActiveBg: '#E1F3E9',
  tabInactive: '#5F6B66',
  white: '#FFFFFF',
  // 할 일 화면용
  checkboxBorder: '#C5D0CB',
  overdueBg: '#FBF1EC',
  overdueBorder: '#DDA08E',
  inputBorder: '#E3E7E4',
  // 상태/강조 색 (비상매뉴얼, 자취생존맵)
  danger: '#C34242',
  dangerBg: '#FFF5F4',
  dangerBorder: '#F2DAD7',
  accent: '#087F79',
  accentBg: '#E5F4F0',
  // 그림자, 시트 배경막, 시트 손잡이
  shadow: '#1F3A30',
  overlay: 'rgba(31, 46, 40, 0.4)',
  sheetHandle: '#DDE3DF',
};

// 차트 색 (소비 분석 도넛/목록 점). 카테고리 이름별 색은 data/spending/spendingAnalysis.js 에서 고릅니다.
export const chartColors = {
  green: '#65C695',
  mint: '#9ECCB6',
  lime: '#C2D9A8',
  gray: '#D9DED7',
  fallback: ['#B7CFA0', '#8FBFA6', '#CFE0C0', '#BFC8C2'],
};

export const fonts = {
  regular: 'NotoSansKR_400Regular',
  medium: 'NotoSansKR_500Medium',
  bold: 'NotoSansKR_700Bold',
};

// 시스템 글자 크기(iOS 동적 글자 크기)를 키웠을 때 글자가 커지는 상한 배율.
// body: 일반 글자, chrome: 탭 바처럼 공간이 정해진 곳의 글자.
export const fontScale = {
  body: 1.4,
  chrome: 1.2,
};

export const spacing = {
  screenX: 24,
  gap: 12,
};

export const radius = {
  card: 24,
  icon: 14,
  pill: 999,
};
// 자취생존맵의 예시 지도 색상 (PNG 픽셀 값). 실제 지도 SDK 로 바꾸면 필요 없어집니다.
export const mapColors = {
  street: '#F0F0EA',
  block: '#E3E5DE',
  crossStreet: '#FFFFFF',
  road: '#FFF9E9',
  roadBorder: '#E3DDD0',
  park: '#D4E6D7',
  parkBorder: '#BBD6C4',
  areaLabel: '#A5ADA5',
  label: '#919B94',
  parkLabel: '#789783',
  userDot: '#3F83CE',
  userHalo: 'rgba(63,131,206,0.18)',
};
