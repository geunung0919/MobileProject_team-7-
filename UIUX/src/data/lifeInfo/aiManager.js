// AI 자취 매니저 문구와 임시 답변. 키워드가 들어 있으면 미리 적어 둔 답을 돌려주는 "가짜 AI"입니다.
// TODO: 실제 AI API 는 AiManagerScreen 의 getReply 를 서버 호출로 바꾸세요.
// action: 답변 아래 바로가기 버튼 { label, screen, params }. tab 이 있으면 하단 탭 화면으로 이동합니다.

export const aiManagerData = {
  title: 'AI 자취 매니저',
  notice: 'AI 답변은 참고용이에요. 위급한 상황은 119·112로 먼저 연락하세요.',
  greeting: '안녕하세요! 혼자 살면서 궁금했던 일, 편하게 물어보세요.',
  inputPlaceholder: '궁금한 점을 입력하세요',
  suggestionsLabel: '이런 걸 물어볼 수 있어요',
  suggestions: ['천장에서 물이 새요', '유통기한 지난 음식은요?', '이번 달 소비 점검해줘', '청소 주기 알려줘'],
  // 하단 리포트 버튼 (리포트 내용은 data/lifeInfo/reports.js, utils/reportSummary.js)
  reportButtons: { detail: '리포트 상세보기', past: '지난 리포트 보기' },
  fallback: {
    text: '아직 잘 모르는 질문이에요. 누수, 정전, 냉장고, 소비, 청소처럼 생활 이야기를 물어봐 주세요.',
    action: null,
  },
  replies: [
    {
      keywords: ['누수', '물이 새', '천장', '단수'],
      text: '먼저 수도 밸브를 잠그고, 전선 근처에 물이 있다면 차단기를 내려 주세요. 그다음 집주인이나 관리실에 알리고 사진으로 기록해 두면 좋아요.',
      action: { label: '누수·단수 대처 보기', screen: 'EmergencyDetail', params: { id: 'leak', title: '누수·단수', tone: 'accent' } },
    },
    {
      keywords: ['정전', '차단기', '전기'],
      text: '우리 집만 꺼졌는지 건물 전체인지부터 확인해 보세요. 차단기가 계속 내려가면 누전일 수 있으니 사용을 멈추고 점검을 요청하세요.',
      action: { label: '정전·차단기 대처 보기', screen: 'EmergencyDetail', params: { id: 'power', title: '정전·차단기', tone: 'accent' } },
    },
    {
      keywords: ['화재', '불이', '연기'],
      text: '연기가 보이면 먼저 대피하고 119에 신고하세요. 엘리베이터는 타지 마세요.',
      action: { label: '화재·연기 대처 보기', screen: 'EmergencyDetail', params: { id: 'fire', title: '화재·연기', tone: 'default' } },
    },
    {
      keywords: ['유통기한', '냉장고', '식재료', '상한', '상했'],
      text: '냉장고 탭에서 기한이 임박한 식재료를 한눈에 볼 수 있어요. 기한이 지난 음식은 아깝더라도 먹지 않는 게 안전해요.',
      action: { label: '냉장고 보러 가기', tab: 'Fridge' },
    },
    {
      keywords: ['소비', '지출', '예산', '돈', '가계부'],
      text: '소비 탭에서 이번 달 지출과 남은 예산을 확인할 수 있어요. 지출 분석에서 어떤 항목에 많이 썼는지도 볼 수 있어요.',
      action: { label: '소비 보러 가기', tab: 'Spending' },
    },
    {
      keywords: ['청소', '빨래', '루틴', '습관'],
      text: '청소와 빨래처럼 반복되는 일은 루틴으로 만들어 두면 잊지 않아요. 시간을 정해서 매일 체크해 보세요.',
      action: { label: '생활 루틴 설정하기', screen: 'Routine' },
    },
    {
      keywords: ['할 일', '해야', '일정'],
      text: '할 일에 마감일을 적어 두면 급한 순서대로 정리돼요. 오늘 할 일부터 하나씩 추가해 보세요.',
      action: { label: '할 일 기록하기', screen: 'Todo' },
    },
    {
      keywords: ['도난', '분실', '잃어', '지갑', '열쇠'],
      text: '카드는 카드사에 바로 정지 요청하고, 도난이면 112에 신고하세요. 열쇠를 잃어버렸다면 도어락 비밀번호나 열쇠 교체도 알아보세요.',
      action: { label: '분실·도난 대처 보기', screen: 'EmergencyDetail', params: { id: 'lost', title: '분실·도난 후 조치', tone: 'accent' } },
    },
  ],
};

// 입력에 키워드가 들어 있는 첫 번째 답변 찾기
export function getReply(text) {
  const found = aiManagerData.replies.find((r) => r.keywords.some((k) => text.includes(k)));
  return found ?? aiManagerData.fallback;
}
