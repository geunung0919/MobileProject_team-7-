
// 비상 매뉴얼 화면 데이터
// icon: MaterialCommunityIcons 아이콘 이름
// family: 'ion'인 경우 Ionicons 사용
// keywords: 검색에 사용하는 단어

export const emergencyData = {
  eyebrow: '생활정보',
  title: '생활안전 매뉴얼',

  contactsLabel: '긴급 연락처',

  contacts: [
    {
      id: '119',
      number: '119',
      label: '화재·구조·구급',
    },
    {
      id: '112',
      number: '112',
      label: '범죄·신변 위협',
    },
  ],

  searchPlaceholder: '누수, 정전, 분실 등 검색',

  question: '어떤 상황인가요?',

  // 메인 화면에서 먼저 표시할 생활 안전 문제
  groups: [
    {
      id: 'life',
      title: '생활 안전 문제',
      tone: 'accent',

      items: [
        {
          id: 'leak',
          title: '누수·단수',
          icon: 'water-outline',
          keywords: ['물', '수도', '배관', '누수', '단수'],
        },
        {
          id: 'power',
          title: '정전·차단기',
          icon: 'flash-outline',
          keywords: ['전기', '정전', '두꺼비집', '누전', '차단기'],
        },
        {
          id: 'pest',
          title: '벌레·해충',
          icon: 'bug-outline',
          keywords: ['벌레', '바퀴벌레', '모기', '쥐', '해충'],
        },
        {
          id: 'lost',
          title: '분실·도난',
          icon: 'key-outline',
          keywords: ['열쇠', '카드', '지갑', '휴대폰', '도난', '분실'],
        },
        {
          id: 'crime',
          title: '범죄·신변 위협',
          icon: 'shield-alert-outline',
          keywords: ['스토킹', '침입', '도둑', '범죄', '신고', '위협'],
        },
      ],
    },
  ],

  // 메인 화면 하단의 별도 메뉴
  disasterMenu: {
    title: '재난 행동요령',
    description:
      '화재·지진·응급환자 대응 방법을 미리 확인하세요.',
    buttonLabel: '재난 행동요령 펼쳐보기',

    items: [
      {
        id: 'fire',
        title: '화재·연기',
        icon: 'flame-outline',
        family: 'ion',
        keywords: ['불', '연기', '소화기', '대피', '화재'],
      },
      {
        id: 'disaster',
        title: '지진·재난',
        icon: 'alert-outline',
        keywords: ['지진', '태풍', '홍수', '대피', '재난'],
      },
      {
        id: 'patient',
        title: '응급환자·부상',
        icon: 'heart-pulse',
        keywords: ['구급', '다침', '화상', '심폐소생', '응급환자'],
      },
    ],
  },

  // 기존 하단 영역은 추후 AI 상담 UI 협의 후 변경
  footer: {
    title: '원하는 상황을 찾지 못했나요?',
    link: '전체 상황 둘러보기',
  },
};
