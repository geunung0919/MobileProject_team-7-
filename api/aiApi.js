
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from 'firebase/functions';

import {
  app,
  USE_EMULATOR,
} from '../firebase/firebaseConfig';

import { environment } from '../config/environment';

// AI Functions 실행 지역
const REGION = 'asia-northeast3';

// Firebase Functions 초기화
const functions = getFunctions(app, REGION);

// 개발 환경에서는 로컬 에뮬레이터 연결
if (USE_EMULATOR) {
  connectFunctionsEmulator(
    functions,
    environment.devHost,
    5001
  );
}

// Firebase callable 함수
const emergencyCallable = httpsCallable(
  functions,
  'askEmergencyManual',
  { timeout: 60000 }
);

// 비상 매뉴얼 질문 전송
export const askEmergencyManual = async (
  message,
  history = []
) => {
  const question = String(message ?? '').trim();

  if (!question) {
    throw new Error('질문을 입력해 주세요.');
  }

  try {
    console.log('[EmergencyAI] 질문 전송');

    const result = await emergencyCallable({
      message: question,
      history,
    });

    const data = result.data;

    if (!data || typeof data.reply !== 'string') {
      throw new Error('AI 응답 형식이 올바르지 않습니다.');
    }

    console.log('[EmergencyAI] 답변 수신 성공');

    return {
      reply: data.reply,
      safety: Boolean(data.safety),
      ai: Boolean(data.ai),
      faq_ids: data.faq_ids ?? [],
      reason: data.reason ?? null,
    };
  } catch (error) {
    console.error(
      '[EmergencyAI] 요청 실패:',
      error?.code || error?.message
    );

    if (error?.code === 'functions/unavailable') {
      throw new Error(
        'AI 서버에 연결할 수 없습니다. 서버 상태를 확인해 주세요.'
      );
    }

    if (error?.code === 'functions/deadline-exceeded') {
      throw new Error(
        '응답 시간이 초과되었습니다. 다시 시도해 주세요.'
      );
    }

    if (error?.code === 'functions/unauthenticated') {
      throw new Error(
        '로그인이 필요한 기능입니다.'
      );
    }

    throw new Error(
      error?.message || 'AI 상담 중 오류가 발생했습니다.'
    );
  }
};
