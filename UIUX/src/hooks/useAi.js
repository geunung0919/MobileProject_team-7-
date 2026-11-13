import { useCallback, useEffect, useState } from 'react';
import { fetchRecipes, fetchTodayReport, isAiServerEnabled } from '../api/aiManager';

// 서버가 설정되지 않았으면(enabled=false) 아무것도 부르지 않습니다 → 화면은 기존 더미·계산 데이터로 동작.

// 오늘 AI 리포트 (홈, AI 자취 매니저, 리포트 상세가 같이 씀)
// report = { today_message, actions[], ... } | null (서버 없음·불러오는 중·실패면 null → 화면은 기존 문장 사용)
export function useTodayReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(isAiServerEnabled);
  const [error, setError] = useState(null);

  const load = useCallback(async (force = false) => {
    if (!isAiServerEnabled) return;
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchTodayReport({ force }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { enabled: isAiServerEnabled, report, loading, error, refresh: () => load(true) };
}

// AI 레시피 추천 목록
export function useServerRecipes(options) {
  const [data, setData] = useState(null); // { recipes, reason, message, excludedExpired }
  const [loading, setLoading] = useState(isAiServerEnabled);
  const [error, setError] = useState(null);
  const key = JSON.stringify(options ?? {});

  const load = useCallback(async () => {
    if (!isAiServerEnabled) return;
    setLoading(true);
    setError(null);
    try {
      setData(await fetchRecipes(JSON.parse(key)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { enabled: isAiServerEnabled, data, loading, error, reload: load };
}
