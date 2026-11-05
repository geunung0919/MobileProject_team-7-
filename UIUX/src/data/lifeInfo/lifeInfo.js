// 생활정보 화면 문구/메뉴 데이터.
// icon 은 MaterialCommunityIcons 아이콘 이름입니다.

export const lifeInfoData = {
  subtitle: '혼자 사는 일상, 필요한 도움을 한곳에서.',
  aiManager: {
    title: 'AI 자취 매니저',
    description: '혼자 살며 궁금한 일,\n편하게 물어보세요.',
    icon: 'forum-outline',
    actionLabel: '매니저에게 물어보기',
  },
  survivalMap: {
    title: '자취생존맵',
    description: '생활에 필요한 주변 장소를\n지도에서 찾아보세요.',
    icon: 'map-marker-outline',
    actionLabel: '지도 보러 가기',
  },
  sectionTitle: '더 편안한 일상을 위해',
  menus: [
    {
      id: 'todo',
      title: '할 일 기록',
      description: '오늘 할 일을 빠르게 기록하고 관리해요.',
      icon: 'calendar-check-outline',
    },
    {
      id: 'routine',
      title: '생활 루틴 설정',
      description: '청소·빨래 등 나만의 생활 주기를 정해요.',
      icon: 'calendar-check-outline',
    },
    {
      id: 'emergency',
      title: '비상 매뉴얼 확인',
      description: '갑작스러운 상황, 대처 방법을 확인해요.',
      icon: 'shield-check-outline',
    },
  ],
};
