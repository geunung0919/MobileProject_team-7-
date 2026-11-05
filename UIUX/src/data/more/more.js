// 더보기 화면 문구/메뉴 데이터.
// icon 은 MaterialCommunityIcons 아이콘 이름입니다.

export const moreData = {
  subtitle: '내 계정과 생활 정보를 한곳에서 관리해요.',
  accountSection: '계정 관리',
  accountMenus: [
    {
      id: 'profile',
      title: '개인정보 관리',
      description: '계정의 개인정보를 확인하고 수정해요.',
      icon: 'account-outline',
    },
  ],
  logoutLabel: '로그아웃',
  lifeData: {
    title: '생활 데이터 수정',
    description: '생활 기본 정보를\n확인하고 수정해요.',
    icon: 'tune-variant',
  },
  appSection: '앱 이용 안내',
  appMenus: [
    {
      id: 'settings',
      title: '앱 설정',
      description: '알림과 앱 이용 환경을 설정해요.',
      icon: 'cog-outline',
    },
    {
      id: 'help',
      title: '도움말',
      description: '이용 방법을 확인하고 문의해요.',
      icon: 'help-circle-outline',
    },
  ],
};
