// 자취생존맵 화면 문구/데이터.
// x, y 는 디자인 프레임(가로 400 x 지도 높이 552) 기준의 지도 위 좌표입니다.
// 실제 지도 SDK 를 붙이면 x, y 대신 위도/경도(latitude, longitude)로 바꾸면 됩니다.
// 디자인에 없는 장소(이름 미정)는 '예시' 로 표시했습니다.

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
