// ?붿옄???좏겙. ?됱긽? ?ㅽ겕由곗꺑?먯꽌 異붿젙??媛믪씠誘濡?
// Figma Inspect 媛믨낵 ?ㅻⅤ硫????뚯씪留??섏젙?섎㈃ ?꾩껜??諛섏쁺?⑸땲??

export const colors = {
  background: '#FFFFFF',
  textPrimary: '#1F3A30',
  textSecondary: '#666D69', // ?곗깋 5.3:1 / 移대뱶 4.9:1 (WCAG AA 4.5:1 ?댁긽)
  placeholder: '#6B726E', // ?곗깋 4.9:1 / ?낅젰李?cardBg) 4.5:1 ?댁긽
  green: '#26784F', // ??湲??5.4:1, ?고븳 珥덈줉 諛곌꼍 ??湲??4.6:1 ?댁긽
  greenLight: '#5CC79A',
  heroBg: '#EEF6F1',
  badgeBg: '#DFF0E6',
  cardBg: '#F5F6F4',
  divider: '#E6E8E5',
  calmBg: '#EEF0ED', // 湲고븳 ?ъ쑀 ?쒓렇 諛곌꼍 (textSecondary 湲??4.6:1)
  progressTrack: '#DCEBE1',
  warnBg: '#FCEBE1',
  warnText: '#A84E27', // warnBg ??4.8:1
  tabActiveBg: '#E1F3E9',
  tabInactive: '#5F6B66',
  white: '#FFFFFF',
  // ?????붾㈃??
  checkboxBorder: '#C5D0CB',
  overdueBg: '#FBF1EC',
  overdueBorder: '#DDA08E',
  inputBorder: '#E3E7E4',
  // ?곹깭/媛뺤“ ??(鍮꾩긽留ㅻ돱?? ?먯랬?앹〈留?
  danger: '#C34242',
  expired: '#B3261E', // ?좏넻湲고븳 吏???먭린 ?꾩슂) 媛뺤“??吏꾪븳 鍮④컯 (??湲??6:1 ?댁긽)
  dangerBg: '#FFF5F4',
  dangerBorder: '#F2DAD7',
  accent: '#087F79',
  accentBg: '#E5F4F0',
  // 洹몃┝?? ?쒗듃 諛곌꼍留? ?쒗듃 ?먯옟??
  shadow: '#1F3A30',
  overlay: 'rgba(31, 46, 40, 0.4)',
  sheetHandle: '#DDE3DF',
};

// 李⑦듃 ??(?뚮퉬 遺꾩꽍 ?꾨꽋/紐⑸줉 ??. 移댄뀒怨좊━ ?대쫫蹂??됱? data/spending/spendingAnalysis.js ?먯꽌 怨좊쫭?덈떎.
export const chartColors = {
  green: '#65C695',
  mint: '#9ECCB6',
  lime: '#C2D9A8',
  gray: '#D9DED7',
  other: '#BFC8C2',
  fallback: ['#B7CFA0', '#8FBFA6', '#CFE0C0', '#A9BFB2', '#C9D8B6'],
};

export const fonts = {
  regular: 'NotoSansKR_400Regular',
  medium: 'NotoSansKR_500Medium',
  bold: 'NotoSansKR_700Bold',
};

// ?쒖뒪??湲???ш린(iOS ?숈쟻 湲???ш린)瑜??ㅼ썱????湲?먭? 而ㅼ????곹븳 諛곗쑉.
// body: ?쇰컲 湲?? chrome: ??諛붿쿂??怨듦컙???뺥빐吏?怨녹쓽 湲??
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
// ?먯랬?앹〈留듭쓽 ?덉떆 吏???됱긽 (PNG ?쎌? 媛?. ?ㅼ젣 吏??SDK 濡?諛붽씀硫??꾩슂 ?놁뼱吏묐땲??
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

// 기존 비상 매뉴얼 전용 색상 유지
export const emergencyColors = {
  text: '#203346',
  textSecondary: '#74818B',
  danger: '#C34242',
  dangerBg: '#FFF5F4',
  dangerBorder: '#F2DAD7',
  surface: '#F7F9F9',
  border: '#E5EAEA',
  accent: '#087F79',
};
