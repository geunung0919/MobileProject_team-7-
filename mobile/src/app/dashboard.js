import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Page, Card, Button, styles } from '../components/UI';
import { DiagnosisSummary } from '../components/DiagnosisSummary';
import { useSession } from '../state/Session';
import { moduleNames, moduleSummary, cardRoute } from '../lib/dashboard';

const statuses = { missing: '데이터 없음', available: '최근 데이터', stale: '갱신 필요' };
export default function Dashboard() {
  const { api } = useSession();
  const [view, setView] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    if (!api) return;
    let active = true;
    setBusy(true);
    setError('');
    setView(null);
    api('me/dashboard').then(data => {
      if (active) setView(data);
    }).catch(e => {
      if (active) setError(e.message || '통합 현황을 불러오지 못했어요.');
    }).finally(() => {
      if (active) setBusy(false);
    });
    return () => { active = false; };
  // attempt는 수동 새로고침 시 포커스 조회를 다시 실행하는 트리거입니다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, attempt]));
  if (!api) return <Redirect href="/" />;
  return <Page title="내 생활 통합 현황">
    <Text style={styles.small}>각 기능에서 전달된 정보를 모아 보여줘요. 팀 연동 확인용 화면이에요.</Text>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Button title={busy ? '불러오는 중…' : '현황 새로고침'} disabled={busy}
      onPress={() => { setBusy(true); setAttempt(value => value + 1); }} />
    {view && <>
      {view.profile && view.diagnosis ? <DiagnosisSummary result={view} /> :
        <Card><Text style={styles.text}>생활 설정을 아직 저장하지 않았어요.</Text>
          <Button title="자취 진단 시작" onPress={() => router.push('/onboarding')} /></Card>}
      {Object.entries(moduleNames).map(([key, name]) => <Card key={key}>
        <Text style={styles.text}>{name} · {statuses[view.module_status[key]] || '상태 확인 필요'}</Text>
        <Text style={styles.text}>{moduleSummary(view, key)}</Text>
        {view.modules[key] && <Text style={styles.small}>원본 갱신 시각: {view.modules[key].source_updated_at}</Text>}
      </Card>)}
      <Card><Text style={styles.text}>확인할 항목</Text>
        {!view.cards.length && <Text style={styles.small}>현재 전달된 데이터에서 표시할 항목이 없어요. 모든 상태가 양호하다는 의미는 아니에요.</Text>}
        {view.cards.map((card, index) => cardRoute(card.target)
          ? <Button key={`${card.kind}-${index}`} title={card.title} onPress={() => router.push(cardRoute(card.target))} />
          : <Text key={`${card.kind}-${index}`} style={styles.text}>{card.title} · 상세 화면 연결 준비 중</Text>)}
      </Card>
    </>}
    <Button title="소비 관리" onPress={() => router.push('/spending')} />
    <Button title="마이페이지" onPress={() => router.push('/mypage')} />
  </Page>;
}
