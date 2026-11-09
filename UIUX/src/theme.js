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
};

export const fonts = {
  regular: 'NotoSansKR_400Regular',
  medium: 'NotoSansKR_500Medium',
  bold: 'NotoSansKR_700Bold',
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
// 비상매뉴얼 / 자취생존맵 화면용 색상. Figma PNG 에서 픽셀 값을 직접 읽어 온 값입니다.
// (위의 colors 는 스크린샷 추정값이라 이 화면과 팔레트가 다릅니다.)
export const emergencyColors = {
  text: '#203346',
  textSecondary: '#5F6C76', // 흰색 5.4:1
  danger: '#C34242',
  dangerBg: '#FFF5F4',
  dangerBorder: '#F2DAD7',
  surface: '#F7F9F9',
  border: '#E5EAEA',
  accent: '#087F79',
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
