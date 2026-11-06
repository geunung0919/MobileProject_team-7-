// 자취생존맵 문구와 장소 데이터.
// x, y 는 디자인 프레임(가로 400 x 지도 높이 552) 기준 좌표입니다. 지도 SDK 를 붙이면 위도/경도로 바꾸세요.
// 이름이 정해지지 않은 장소는 '예시' 로 표시했습니다.

export const survivalMapData = {
  eyebrow: '생활정보',
  title: '자취생존맵',
  location: '서교동 · 내 주변',
  searchPlaceholder: '동네나 장소를 검색해 보세요',
  userLocation: { x: 147, y: 319 },
  categories: [
    { id: 'food', label: '음식점', icon: 'silverware-fork-knife' },
    { id: 'mart', label: '마트', icon: 'cart-outline' },
    { id: 'hospital', label: '병원', icon: 'hospital-building' },
    { id: 'laundry', label: '세탁소', icon: 'tshirt-crew-outline' },
    { id: 'pharmacy', label: '약국', icon: 'pill' },
  ],
  // 카테고리 id -> 장소 목록. 디자인에는 음식점만 있어서 나머지는 비어 있습니다.
  places: {
    food: [
      {
        id: 'seogyo-hankki',
        name: '서교한끼',
        distance: '240m',
        address: '서울 마포구 잔다리로 24',
        x: 244,
        y: 228,
      },
      { id: 'food-sample-1', name: '음식점 예시 1', distance: '', address: '', x: 175, y: 99 },
      { id: 'food-sample-2', name: '음식점 예시 2', distance: '', address: '', x: 70, y: 208 },
      { id: 'food-sample-3', name: '음식점 예시 3', distance: '', address: '', x: 341, y: 350 },
    ],
    mart: [],
    hospital: [],
    laundry: [],
    pharmacy: [],
  },
};
