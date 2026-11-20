
import { signInAnonymously } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

// 기존 공통 Firebase Authentication 사용
import {
  auth,
  USE_EMULATOR,
} from '../../../firebase/firebaseConfig';

// 이미 에뮬레이터가 연결된 공통 Functions 사용
import { functions } from '../../../api/aiApi';

// 공통 Firebase 설정이 초기화되어 있으므로 사용 가능
export const isAiServerEnabled = true;

// 진혁이의 AI Functions 공통 호출
// options.quiet: 없어도 되는 보조 호출(예: 소비 분석 한마디)은 실패해도 화면에 빨간 오류창을 띄우지 않고 로그만 남깁니다.
export async function callAi(name, data = {}, options = {}) {
  if (!name || typeof name !== 'string') {
    throw new Error('AI 함수 이름이 올바르지 않습니다.');
  }

  try {
    // 저장된 로그인 상태 복원
    await auth.authStateReady();

    // 로컬 테스트에서 로그인 사용자가 없을 때만 익명 인증
    if (USE_EMULATOR && !auth.currentUser) {
      await signInAnonymously(auth);
    }

    const callable = httpsCallable(
      functions,
      name,
      { timeout: 60000 }
    );

    const result = await callable(data);
    console.log('[AI 서버 응답]', {
      functionName: name,
      ai: result.data?.ai,
      reason: result.data?.reason,
      faq_ids: result.data?.faq_ids,
    });

    return result.data;
  } catch (error) {
    (options.quiet ? console.log : console.error)(
      '[AI Firebase] 호출 실패:',
      name,
      error?.code || error?.message
    );

    throw error;
  }
}
