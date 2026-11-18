// 더보기 > 개인정보 / 앱 설정 / 도움말 데이터. initial 은 로그인한 사용자 정보로 교체하세요.

export const profileData = {
  title: '개인정보 관리',
  subtitle: '계정의 개인정보를 확인하고 수정해요.',
  // email 은 로그인 계정이라 화면에서 읽기만 가능합니다.
  initial: { nickname: '자취생', email: 'user@example.com', region: '' },
  nicknameLabel: '닉네임',
  emailLabel: '이메일',
  emailHint: '로그인에 사용하는 이메일은 바꿀 수 없어요.',
  regionLabel: '거주 지역',
  regionPlaceholder: '예: 서울시 마포구',
  saveLabel: '저장하기',
};

export const settingsData = {
  title: '앱 설정',
  subtitle: '알림과 앱 이용 환경을 설정해요.',
  initial: { notifyFridge: true, notifyRoutine: true, notifyTodo: true, notifySpending: false },
  notifySection: '알림',
  // key 는 settings 의 값 이름과 같아야 합니다.
  toggles: [
    { key: 'notifyFridge', title: '유통기한 알림', description: '기한이 임박한 식재료를 알려줘요.' },
    { key: 'notifyRoutine', title: '루틴 알림', description: '정해 둔 시간에 루틴을 알려줘요.' },
    { key: 'notifyTodo', title: '할 일 마감 알림', description: '마감이 다가오는 할 일을 알려줘요.' },
    { key: 'notifySpending', title: '예산 알림', description: '이번 달 예산을 넘기기 전에 알려줘요.' },
  ],
  infoSection: '앱 정보',
  version: '1.0.0',
  versionLabel: '앱 버전',
};

export const helpData = {
  title: '도움말',
  subtitle: '이용 방법을 확인하고 문의해요.',
  faqSection: '자주 묻는 질문',
  faqs: [
    { id: 'receipt', q: '영수증은 어떻게 등록하나요?', a: '소비 탭에서 영수증을 촬영하거나, 직접 입력으로 품목과 가격을 적어 등록할 수 있어요.' },
    { id: 'fridge', q: '식재료 유통기한은 어떻게 관리하나요?', a: '냉장고 탭에서 식재료를 추가하면 기한이 가까운 순서대로 보여 드려요.' },
    { id: 'routine', q: '루틴과 할 일은 어떻게 달라요?', a: '루틴은 매일 반복하는 습관이고, 할 일은 마감일이 있는 한 번짜리 일이에요.' },
    { id: 'emergency', q: '비상매뉴얼은 인터넷 없이도 볼 수 있나요?', a: '앱에 들어 있는 안내라서 상황별 대처법은 바로 볼 수 있어요. 전화 연결은 통신이 필요해요.' },
  ],
  contactSection: '문의하기',
  contactDescription: '해결되지 않았다면 메일로 알려 주세요.',
  contactLabel: '메일로 문의하기',
  // TODO: 실제 문의 메일 주소로 바꿔 주세요.
  contactEmail: 'support@example.com',
};
