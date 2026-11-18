// 회원가입 후 나오는 프로필 설정(5단계 + 진단 결과) 문구와 진단 문장 틀.
// 자취 기간·목표·조리 도구 선택지와 예산·지역 문구는 data/more/lifeData.js 를 같이 씁니다. (생활 데이터 수정과 같은 값)
// 진단 문장을 바꾸려면 아래 diagnosis 를, 계산 방식은 utils/diagnosis.js 를 보세요.

export const profileSetupData = {
  stepCount: 5,
  nextLabel: '다음으로',
  editDoneLabel: '수정 완료', // 확인 화면에서 "수정"을 눌러 들어온 단계의 버튼
  reviewButtonLabel: '진단 결과 보기',
  skipRegionHint: '지역은 비워 둬도 돼요.',

  nickname: {
    title: '어떻게 불러드릴까요?',
    subtitle: '자취메이트에서 사용할 닉네임을 정해 주세요.',
    label: '닉네임',
    placeholder: '닉네임 입력',
    hint: '2~12자, 한글·영문·숫자를 쓸 수 있어요.',
    maxLength: 12,
    pattern: /^[가-힣a-zA-Z0-9]{2,12}$/,
    invalidNotice: '닉네임은 2~12자의 한글, 영문, 숫자로 입력해 주세요.',
  },
  status: {
    title: '자취 생활은 어떤 상태인가요?',
    subtitle: '지금 상황에 맞는 것을 골라 주세요.',
  },
  cooking: {
    title: '요리 환경을 알려주세요',
    subtitle: '쓸 수 있는 도구에 맞춰 레시피를 추천해요.',
  },
  budgetRegion: {
    title: '예산과 지역을 알려주세요',
    subtitle: '지출 관리와 주변 장소 추천에 사용해요.',
  },
  review: {
    title: '입력한 내용을 확인해 주세요',
    subtitle: '고치고 싶은 항목은 오른쪽 수정을 눌러요.',
    editLabel: '수정',
    emptyRegion: '입력 안 함',
    sections: {
      nickname: '닉네임',
      status: '자취 상태',
      cooking: '요리 환경',
      budgetRegion: '예산 · 지역',
    },
    rows: {
      nickname: '닉네임',
      period: '자취 기간',
      goal: '중요한 목표',
      tools: '조리 도구',
      cookDays: '요리 빈도',
      budget: '월 예산',
      region: '거주 지역',
    },
  },

  result: {
    title: (nickname) => `${nickname}님의 진단 결과예요`,
    subtitle: '입력한 정보로 맞춤 시작 방법을 정리했어요.',
    typeLabel: '자취 유형',
    badge: '맞춤 진단',
    recTitle: '이런 기능부터 써 보세요',
    startLabel: '자취메이트 시작하기',
    statLabels: { period: '자취 기간', budget: '월 예산', cookDays: '요리' },
  },

  diagnosis: {
    // 유형 이름 = 기간 말 + 목표 유형  (예: "적응 중인 알뜰 자취러")
    periodWord: { under1m: '막 시작한', '1m': '적응 중인', '6m': '익숙해진', '1y': '노련한' },
    goalType: { saving: '알뜰 자취러', food: '식재료 지킴이', habit: '루틴 메이커' },
    // {period} 는 자취 기간 글자(예: "1개월 이상")로 바뀝니다.
    goalSentence: {
      saving: '{period} 자취 중이고, 생활비를 아끼고 싶어요.',
      food: '{period} 자취 중이고, 식재료를 알뜰하게 쓰고 싶어요.',
      habit: '{period} 자취 중이고, 규칙적인 생활 습관을 만들고 싶어요.',
    },
    // {n} 은 일주일 요리 일수
    cookSentence: {
      none: '요리를 거의 하지 않아서, 간단한 한 끼부터 시작해 봐요.',
      some: '주 {n}일 요리하고 있어서 식재료 관리부터 챙기면 효과가 커요.',
      often: '주 {n}일이나 요리하는 만큼 식재료 낭비를 줄이면 효과가 커요.',
    },
    // 목표별 추천 기능. to: { tab } 는 하단 탭, { screen } 은 일반 화면.
    // description 의 {budget}, {tools} 는 입력값으로 바뀝니다.
    recommendations: {
      saving: [
        { icon: 'wallet-outline', title: '월 예산 관리 시작하기', description: '{budget} 예산으로 지출을 기록해요', to: { tab: 'Spending' } },
        { icon: 'fridge-outline', title: '식재료 등록하고 레시피 받기', description: '{tools}', to: { tab: 'Fridge' } },
        { icon: 'calendar-check-outline', title: '생활 루틴 만들기', description: '작은 루틴부터 시작해 보세요', to: { screen: 'Routine' } },
      ],
      food: [
        { icon: 'fridge-outline', title: '식재료 등록하고 기한 챙기기', description: '유통기한이 임박하면 알려줘요', to: { tab: 'Fridge' } },
        { icon: 'chef-hat', title: '냉장고 재료로 레시피 보기', description: '{tools}', to: { screen: 'RecipeList' } },
        { icon: 'wallet-outline', title: '월 예산 관리 시작하기', description: '{budget} 예산으로 지출을 기록해요', to: { tab: 'Spending' } },
      ],
      habit: [
        { icon: 'calendar-check-outline', title: '생활 루틴 만들기', description: '매일 할 일을 루틴으로 만들어요', to: { screen: 'Routine' } },
        { icon: 'format-list-checks', title: '할 일 정리하기', description: '마감이 있는 일을 한곳에 모아요', to: { screen: 'Todo' } },
        { icon: 'wallet-outline', title: '월 예산 관리 시작하기', description: '{budget} 예산으로 지출을 기록해요', to: { tab: 'Spending' } },
      ],
    },
    // {tools} 자리에 들어갈 문장 (조리 도구에 따라)
    toolsSentence: {
      some: '{list} 기준으로 레시피를 받아요',
      none: '조리 도구 없이 만들 수 있는 레시피를 받아요',
    },
  },
};
