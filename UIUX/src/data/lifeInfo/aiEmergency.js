// AI 비상 매뉴얼 문구와 임시 답변. 키워드가 들어 있으면 emergencyGuides.js 의 안내로 답하는 "가짜 AI"입니다.
// TODO: 실제 AI API 는 EmergencyAiScreen 의 getEmergencyReply 를 서버 호출로 바꾸세요.
//   답변 형식: { text, call: { number, label } | null, steps: [{ title, body }], detail: { id, title, tone } | null }
import { emergencyGuides } from './emergencyGuides';

export const aiEmergencyData = {
  title: 'AI 비상 매뉴얼',
  notice: 'AI 답변은 참고용이에요. 위급하면 안내를 기다리지 말고 먼저 신고하세요.',
  greeting: '어떤 상황인가요? 지금 일어난 일을 짧게 적어 주세요.',
  inputPlaceholder: '상황을 입력하세요',
  suggestionsLabel: '이렇게 물어볼 수 있어요',
  suggestions: ['천장에서 물이 새요', '갑자기 정전됐어요', '집에 불이 났어요', '지갑을 잃어버렸어요'],
  contacts: [
    { number: '119', label: '화재·구조·구급' },
    { number: '112', label: '범죄·위협' },
  ],
  stepLimit: 4,
  fallback: {
    text: '어떤 상황인지 잘 모르겠어요. 화재, 누수, 정전, 분실, 다쳤을 때처럼 지금 상황을 조금 더 자세히 적어 주세요. 위급하면 바로 119·112에 연락하세요.',
    call: null,
    steps: [],
    detail: null,
  },
  // id 는 emergencyGuides.js / emergency.js 의 id 와 같아야 합니다.
  situations: [
    { id: 'fire', title: '화재·연기', tone: 'default', keywords: ['화재', '불이', '불났', '연기', '소화기'] },
    { id: 'crime', title: '범죄·신변 위협', tone: 'default', keywords: ['스토킹', '침입', '도둑', '따라와', '위협', '범죄'] },
    { id: 'disaster', title: '지진·재난', tone: 'default', keywords: ['지진', '태풍', '홍수', '재난'] },
    { id: 'patient', title: '응급환자·부상', tone: 'default', keywords: ['다쳤', '다침', '쓰러', '화상', '응급', '피가', '아파'] },
    { id: 'leak', title: '누수·단수', tone: 'accent', keywords: ['누수', '물이 새', '단수', '천장', '배관'] },
    { id: 'power', title: '정전·차단기', tone: 'accent', keywords: ['정전', '차단기', '전기', '누전', '두꺼비집'] },
    { id: 'pest', title: '벌레·해충', tone: 'accent', keywords: ['바퀴', '벌레', '모기', '쥐', '해충'] },
    { id: 'lost', title: '분실·도난 후 조치', tone: 'accent', keywords: ['분실', '잃어', '도난', '지갑', '열쇠', '휴대폰'] },
  ],
};

// 입력에 키워드가 들어 있는 첫 번째 상황의 대처 안내로 답을 만듭니다.
export function getEmergencyReply(text) {
  const { situations, stepLimit, fallback } = aiEmergencyData;
  const found = situations.find((s) => s.keywords.some((k) => text.includes(k)));
  const guide = found ? emergencyGuides[found.id] : null;
  if (!found || !guide) return fallback;
  return {
    text: guide.summary,
    call: guide.call,
    steps: guide.steps.slice(0, stepLimit),
    detail: { id: found.id, title: found.title, tone: found.tone },
  };
}
