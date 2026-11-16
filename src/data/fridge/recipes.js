// AI 레시피 추천 화면 데이터와 문구. AI API 를 연결하면 recipes 를 그 결과로 교체하세요.
// - recipes 는 추천 순서 그대로 보여주되, 냉장고에 재료가 하나도 없는 레시피는 뺍니다.
// - ingredients[].name 은 냉장고 식재료 이름과 맞춰 보고, amount 는 필요한 분량(글자)입니다.
// - icon: MaterialCommunityIcons 이름

export const recipeData = {
  texts: {
    listTitle: 'AI 레시피 추천',
    listSubtitle: '냉장고 속 재료로 만들 수 있는 요리예요.',
    bannerUrgent: '기한이 임박한 재료를 먼저 활용했어요',
    bannerNormal: '냉장고 속 재료로 만들 수 있는 요리를 골랐어요',
    sectionTitle: '추천 레시피',
    count: (n) => `${n}개`,
    haveLabel: '있는 재료',
    needLabel: '필요한 재료',
    allHave: '모두 있어요',
    urgentBadge: (n) => `임박 재료 ${n}개`,
    empty: '아직 만들 수 있는 요리가 없어요.',
    emptyHint: '식재료를 추가하면 요리를 추천해 드려요.',
    // 상세
    detailTitle: '레시피',
    ingredientsTitle: '재료',
    haveCount: (total, have) => `${total}개 중 ${have}개 보유`,
    missingBadge: '없음',
    stepsTitle: '조리 순서',
    cookDone: '요리 완료 · 사용한 재료 빼기',
    confirmTitle: '사용한 재료를 뺄까요?',
    confirmMessage: (names) => `${names}을(를) 냉장고에서 빼요.`,
    confirmAction: '빼기',
    cancel: '취소',
    nothingToRemove: '냉장고에서 뺄 재료가 없어요.',
    notFound: '레시피를 찾을 수 없어요.',
  },
  recipes: [
    {
      id: 'rcp1',
      title: '두부 시금치 된장국',
      minutes: 15,
      difficulty: '쉬움',
      servings: 1,
      icon: 'silverware-fork-knife',
      ingredients: [
        { name: '두부', amount: '1/2모' },
        { name: '시금치', amount: '1줌' },
        { name: '된장', amount: '1큰술' },
      ],
      steps: [
        '물 400ml에 된장 1큰술을 풀어 끓여요.',
        '두부는 깍둑썰기, 시금치는 먹기 좋게 잘라요.',
        '국물이 끓으면 두부를 넣고 3분, 시금치를 넣고 1분 더 끓여요.',
      ],
    },
    {
      id: 'rcp2',
      title: '달걀 당근 볶음밥',
      minutes: 20,
      difficulty: '쉬움',
      servings: 1,
      icon: 'silverware-fork-knife',
      ingredients: [
        { name: '달걀', amount: '2개' },
        { name: '당근', amount: '1/2개' },
      ],
      steps: [
        '당근은 잘게 다지고, 달걀은 소금을 약간 넣어 풀어요.',
        '팬에 기름을 두르고 당근을 2분 볶아요.',
        '달걀을 넣어 스크램블한 뒤 밥 한 공기를 넣고 2분 더 볶아요.',
      ],
    },
    {
      id: 'rcp3',
      title: '사과 우유 스무디',
      minutes: 5,
      difficulty: '아주 쉬움',
      servings: 1,
      icon: 'coffee-outline',
      ingredients: [
        { name: '우유', amount: '200ml' },
        { name: '사과', amount: '1/2개' },
      ],
      steps: [
        '사과는 씨를 빼고 한입 크기로 썰어요.',
        '믹서에 사과와 우유 200ml를 넣어요.',
        '곱게 갈아 컵에 담으면 완성이에요.',
      ],
    },
  ],
};
