// 비상매뉴얼 문구와 메뉴. icon 은 MaterialCommunityIcons 이름 (family: 'ion' 이면 Ionicons).
// keywords 는 검색용 임시 단어입니다. 매뉴얼 내용이 정해지면 바꾸세요.

export const emergencyData = {
  eyebrow: '생활정보',
  title: '비상매뉴얼',
  searchPlaceholder: '누수, 정전 등 상황을 검색하세요',
  question: '어떤 상황인가요?',
  groups: [
    {
      id: 'safety',
      title: '긴급·안전',
      tone: 'default',
      items: [
        { id: 'fire', title: '화재·연기', icon: 'flame-outline', family: 'ion', keywords: ['불', '연기', '소화기', '대피'] },
        { id: 'crime', title: '범죄·신변 위협', icon: 'shield-alert-outline', keywords: ['스토킹', '침입', '도둑', '신고'] },
        { id: 'disaster', title: '지진·재난', icon: 'alert-outline', keywords: ['태풍', '홍수', '대피'] },
        { id: 'patient', title: '응급환자·부상', icon: 'heart-pulse', keywords: ['구급', '다침', '화상', '심폐소생'] },
      ],
    },
    {
      id: 'life',
      title: '생활 문제',
      tone: 'accent',
      items: [
        { id: 'leak', title: '누수·단수', icon: 'water-outline', keywords: ['물', '수도', '배관'] },
        { id: 'power', title: '정전·차단기', icon: 'flash-outline', keywords: ['전기', '두꺼비집', '누전'] },
        { id: 'pest', title: '벌레·해충', icon: 'bug-outline', keywords: ['바퀴벌레', '모기', '쥐'] },
        { id: 'lost', title: '분실·도난 후 조치', icon: 'key-outline', keywords: ['열쇠', '카드', '지갑', '휴대폰'] },
      ],
    },
  ],
  // 긴급·안전(id: safety) 항목은 하단 "미리 대비하기" 상자에 보여줍니다.
  prepare: {
    title: '재난 시 행동요령\n미리 확인해서 대비하기',
  },
  aiAsk: {
    label: 'AI에게 물어보기',
  },
};
