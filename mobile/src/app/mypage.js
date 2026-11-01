import { useEffect, useRef, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Page, Card, Button, styles } from '../components/UI';
import { useSession } from '../state/Session';

const options = [
  ['spending_alerts', '소비·예산 알림'],
  ['inventory_alerts', '식재료·재고 알림'],
  ['routine_reminders', '생활 루틴 알림'],
];

export default function MyPage() {
  const { api } = useSession();
  if (!api) return <Redirect href="/" />;
  return <Settings api={api} />;
}

function Settings({ api }) {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(null);
  const saving = useRef(false);

  useEffect(() => {
    const current = { active: true };
    generation.current = current;
    api('me/notification-settings').then(data => {
      if (!current.active) return;
      setSaved(data);
      setDraft({ ...data });
    }).catch(e => {
      if (current.active) setError(e.message || '설정을 불러오지 못했어요.');
    }).finally(() => {
      if (current.active) setBusy(false);
    });
    return () => { current.active = false; };
  }, [api, attempt]);

  const dirty = draft && saved && options.some(([key]) => draft[key] !== saved[key]);
  const save = async () => {
    if (saving.current || busy || !dirty) return;
    saving.current = true;
    const current = generation.current;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data = await api('me/notification-settings', 'PUT', draft);
      if (!current.active) return;
      setSaved(data);
      setDraft({ ...data });
      setNotice('알림 설정을 저장했어요.');
    } catch (e) {
      if (current.active) setError(e.message || '저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      saving.current = false;
      if (current.active) setBusy(false);
    }
  };

  return <Page title="마이페이지">
    <Card>
      <Text style={styles.text}>나에게 맞는 생활 설정</Text>
      <Text style={styles.small}>자취 기간, 목표, 조리 도구와 지역을 확인하고 수정해요.</Text>
      <Button title="생활 설정 확인·수정" disabled={busy || !!dirty}
        onPress={() => router.push({ pathname: '/onboarding', params: { returnTo: 'mypage' } })} />
    </Card>
    <Card>
      <Text style={styles.text}>알림 설정</Text>
      <Text style={styles.small}>원하는 알림을 선택하고 저장해 주세요. 실제 휴대폰 알림 발송은 아직 준비 중이에요.</Text>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!draft ? <>
        <Text style={styles.small}>{busy ? '설정을 불러오는 중…' : '설정을 불러오지 못했어요.'}</Text>
        <Button title="다시 불러오기" disabled={busy} onPress={() => { setBusy(true); setError(''); setAttempt(value => value + 1); }} />
      </> : <>
        {options.map(([key, label]) => <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={[styles.text, { flex: 1 }]}>{label}</Text>
          <Switch accessibilityLabel={label} value={draft[key]} disabled={busy}
            onValueChange={value => { setDraft(previous => ({ ...previous, [key]: value })); setNotice(''); }} />
        </View>)}
        {!!dirty && <Text style={styles.small}>저장하지 않은 변경사항이 있어요.</Text>}
        <Button title={busy ? '저장 중…' : '알림 설정 저장'} disabled={busy || !dirty} onPress={save} />
        <Button title="변경 취소" disabled={busy || !dirty} onPress={() => {
          setDraft({ ...saved }); setError(''); setNotice('변경을 취소했어요.');
        }} />
      </>}
      {!!notice && <Text accessibilityLiveRegion="polite" style={styles.small}>{notice}</Text>}
    </Card>
    <Text style={styles.small}>저장 버튼을 누른 변경만 반영돼요. 화면을 나가면 저장 전 변경은 사라져요.</Text>
    <Button title="소비 관리로" disabled={busy || !!dirty} onPress={() => router.replace('/spending')} />
  </Page>;
}
