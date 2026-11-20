import React, { useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoutineAlerts } from '../features/routine/RoutineAlerts';
import BackHeader from '../components/BackHeader';
import Chip from '../components/Chip';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import SoftButton from '../components/SoftButton';
import RefreshButton from '../components/RefreshButton';
import TodoRow from '../components/TodoRow';
import { listRoutines, writeRoutine } from '../../../api/receiptApi';
import { useAppData } from '../store/AppDataContext';
import { spacing } from '../theme';

const days = ['월', '화', '수', '목', '금', '토', '일'];
const empty = () => ({ id: `routine-${Date.now()}-${Math.random().toString(36).slice(2)}`, title: '', time: '08:00', repeatDays: [] });

export default function SharedRoutineScreen({ navigation }) {
  const { top, bottom } = useSafeAreaInsets();
  const { sharedUid } = useAppData();
  return <ScrollView contentContainerStyle={{ paddingTop: top + 12, paddingBottom: bottom + 24, paddingHorizontal: spacing.screenX, gap: 12 }} keyboardShouldPersistTaps="handled">
    <BackHeader title="생활 루틴" onBack={() => navigation.goBack()} />
    {sharedUid ? <RoutineList key={sharedUid} uid={sharedUid} /> :
      <PrimaryButton label="로그인하고 내 루틴 보기" onPress={() => navigation.navigate('SharedLogin')} />}
  </ScrollView>;
}

function RoutineList({ uid }) {
  const alerts = useRoutineAlerts();
  const [list, setList] = useState(null);
  const [draft, setDraft] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const lock = useRef(false);

  useEffect(() => {
    let active = true;
    let request = 0;
    async function refresh() {
      const ticket = ++request;
      try {
        const data = await listRoutines(uid);
        if (active && ticket === request) {
          setList(data);
          setNotice('');
        }
      } catch (error) {
        if (active && ticket === request) setNotice(error.message || '루틴을 불러오지 못했어요.');
      }
    }
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !lock.current) refresh();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active' && !lock.current) refresh();
    }, 60000);
    return () => { active = false; clearInterval(timer); subscription.remove(); };
  }, [uid, reload]);

  async function send(payload) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice('');
    try {
      await writeRoutine(payload, uid);
      alerts?.refresh();
      if (payload.action === 'save') setDraft(null);
      if (payload.action === 'archive') setConfirmId(null);
      setReload((n) => n + 1);
    } catch (error) {
      setNotice(error.message || '루틴 작업을 저장하지 못했어요.');
    } finally { lock.current = false; setBusy(false); }
  }

  return <>
    {list ? <Text>{list.date} · 오늘 완료 {list.items.filter((item) => item.scheduledToday && item.doneToday).length}개</Text> : <Text>서버 루틴을 불러오는 중이에요.</Text>}
    {list?.possiblyTruncated ? <Text>오래된 루틴 일부가 목록에 표시되지 않을 수 있어요.</Text> : null}
    {notice ? <Text accessibilityRole="alert">{notice}</Text> : null}
    {alerts?.supported ? <>
      <SoftButton label={alerts.busy ? '알림 설정 중…' : alerts.enabled === null ? '알림 설정 불러오는 중…' : alerts.enabled ? '이 기기 루틴 알림 끄기' : '이 기기 루틴 알림 켜기'} onPress={alerts.toggle} />
      {alerts.status ? <Text>{alerts.status}</Text> : null}
    </> : <Text>루틴 알림은 모바일 앱에서 켤 수 있어요.</Text>}
    <RefreshButton onPress={() => setReload((n) => n + 1)} />
    {list?.items.length === 0 ? <Text>서버에 등록한 루틴이 없어요.</Text> : null}
    {[...(list?.items ?? [])].sort((a, b) => String(a.time).localeCompare(String(b.time))).map((item) => <View key={item.id}>
      <TodoRow title={item.title} subText={`${item.time || '시간 미설정'} · ${item.repeat_days?.join('·') || '매일'}`}
        extraText={item.scheduledToday ? item.doneToday ? '오늘 완료' : undefined : '오늘 일정 없음'}
        done={item.scheduledToday && item.doneToday}
        onToggle={() => item.scheduledToday && send({ action: 'complete', id: item.id, date: list.date, completed: !item.doneToday })} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label={`${item.title} 수정`} onPress={() => !busy && setDraft({ id: item.id, title: item.title, time: item.time || '08:00', repeatDays: item.repeat_days ?? [] })} />
        <Chip label={confirmId === item.id ? '삭제 확인' : `${item.title} 삭제`} onPress={() => !busy && (confirmId === item.id ? send({ action: 'archive', id: item.id }) : setConfirmId(item.id))} />
        {confirmId === item.id ? <Chip label="삭제 취소" onPress={() => setConfirmId(null)} /> : null}
      </View>
    </View>)}
    {draft ? <>
      <FormField label="루틴 이름" value={draft.title} maxLength={30} onChangeText={(title) => setDraft((old) => ({ ...old, title }))} />
      <FormField label="실행 시간 (HH:mm)" value={draft.time} maxLength={5} onChangeText={(time) => setDraft((old) => ({ ...old, time }))} />
      <Text>요일을 선택하지 않으면 매일 반복해요.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {days.map((day) => <Chip key={day} label={day} selected={draft.repeatDays.includes(day)} onPress={() => setDraft((old) => ({
          ...old, repeatDays: old.repeatDays.includes(day) ? old.repeatDays.filter((value) => value !== day) : [...old.repeatDays, day],
        }))} />)}
      </View>
      <PrimaryButton label={busy ? '저장 중…' : '루틴 저장'} onPress={() => send({ action: 'save', ...draft })} />
      <SoftButton label="취소" onPress={() => !busy && setDraft(null)} />
    </> : <PrimaryButton label="루틴 추가" onPress={() => !busy && setDraft(empty())} />}
  </>;
}
