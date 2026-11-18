import { useEffect, useState } from 'react';
import { normalizeNickname } from './nickname';
import { useAuth } from './AuthContext';

// 닉네임 입력 중 중복 확인 (AC-07). 입력이 멈추고 delay(ms) 뒤에 한 번만 조회합니다.
//   const check = useNicknameCheck(nickname);
//   check.status: 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error'
//   check.message: 화면에 보여 줄 문구 (idle·checking 은 빈 문자열)
// 최종 판단은 저장할 때 서버(트랜잭션)가 한 번 더 합니다. 여기서 '사용 가능'이어도 저장 순간 다른 사람이 먼저 쓰면 nickname 오류가 납니다.
export default function useNicknameCheck(nickname, { delay = 400 } = {}) {
  const { checkNickname } = useAuth();
  const [state, setState] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    if (!String(nickname || '').trim()) { setState({ status: 'idle', message: '' }); return undefined; }
    const local = normalizeNickname(nickname);
    if (local.message) { setState({ status: 'invalid', message: local.message }); return undefined; }
    let alive = true;
    setState({ status: 'checking', message: '' });
    const timer = setTimeout(async () => {
      const result = await checkNickname(local.nickname);
      if (alive) setState({ status: result.status, message: result.message });
    }, delay);
    return () => { alive = false; clearTimeout(timer); };
  }, [nickname, delay, checkNickname]);

  return state;
}
