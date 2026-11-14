import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { Button, Card, Field, Page, styles, useTask } from '../components/UI';
import { koreaToday } from '../lib/api';
import { useSession } from '../state/Session';
import {
  WEEK_DAYS,
  addRoutine,
  createRoutineStore,
  makeRoutine,
  removeRoutine,
  repeatLabel,
  routinesForDate,
  toggleRoutineComplete,
} from '../features/routine/domain/routines.mjs';

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [0, 6];
const newForm = () => ({ title: '', reminderTime: '', energy: 'normal', days: EVERY_DAY });

export default function Routine() {
  const { api, routineKey } = useSession();
  const { busy, error, run, setError } = useTask();
  const [state, setState] = useState(null);
  const [form, setForm] = useState(newForm);
  const [batteryMode, setBatteryMode] = useState(false);
  const [notice, setNotice] = useState('');
  const today = koreaToday();
  const store = useMemo(() => routineKey ? createRoutineStore(AsyncStorage, routineKey) : null, [routineKey]);

  useEffect(() => {
    if (!store) return;
    let active = true;
    const unsubscribe = store.subscribe(next => { if (active) setState(next); });
    store.load().then(next => { if (active) setState(next); }).catch(e => { if (active) setError(e.message || '생활 루틴을 불러오지 못했어요.'); });
    return () => { active = false; unsubscribe(); };
  }, [store, setError]);

  if (!api || !routineKey) return <Redirect href="/" />;

  const change = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const sameDays = values => form.days.length === values.length && values.every(day => form.days.includes(day));
  const toggleDay = day => change('days', form.days.includes(day) ? form.days.filter(value => value !== day) : [...form.days, day]);

  const saveRoutine = () => run(async () => {
    const routine = makeRoutine({
      id: `routine-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      title: form.title,
      days: form.days,
      reminderTime: form.reminderTime.trim(),
      energy: form.energy,
    });
    await store.update(current => addRoutine(current, routine));
    setForm(newForm());
    setNotice('반복 루틴을 저장했어요.');
  });

  const todayItems = state ? routinesForDate(state, today, batteryMode) : [];
  const completedCount = todayItems.filter(item => item.completedDates.includes(today)).length;

  return <Page title="생활 루틴">
    <Card>
      <Text style={styles.title}>오늘 {completedCount}/{todayItems.length}</Text>
      <Text style={styles.text}>반복 일정과 완료 기록은 이 계정의 기기에 저장돼요.</Text>
      <Button title={batteryMode ? '✓ 방전모드 ON' : '방전모드 OFF'} disabled={busy} onPress={() => setBatteryMode(value => !value)} />
      <Text style={styles.small}>방전모드에서는 ‘5분 이하’로 등록한 가벼운 루틴만 보여줘요.</Text>
      <Text style={styles.small}>알림 시간은 저장·표시에 반영됩니다. 실제 기기 푸시 알림은 후속 연결 항목입니다.</Text>
    </Card>

    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {!!notice && <Text style={styles.small}>{notice}</Text>}

    <Card>
      <Text style={styles.title}>오늘 할 일</Text>
      {!state && <Text style={styles.text}>루틴을 불러오는 중이에요.</Text>}
      {state && !todayItems.length && <Text style={styles.text}>{batteryMode ? '방전모드에서 할 수 있는 오늘 루틴이 없어요.' : '오늘 예정된 루틴이 없어요.'}</Text>}
      {todayItems.map(item => {
        const done = item.completedDates.includes(today);
        return <View key={item.id} style={{ gap: 8, borderBottomWidth: 1, borderBottomColor: '#e1eae5', paddingVertical: 10 }}>
          <Text style={[styles.text, done && { textDecorationLine: 'line-through', opacity: 0.55 }]}>{done ? '✓ ' : ''}{item.title}</Text>
          <Text style={styles.small}>{repeatLabel(item.days)} · {item.energy === 'low' ? '5분 이하' : '보통'}{item.reminderTime ? ` · 알림 ${item.reminderTime}` : ''}</Text>
          <Button title={done ? '완료 취소' : '오늘 완료'} disabled={busy} onPress={() => run(async () => {
            await store.update(current => toggleRoutineComplete(current, item.id, today));
            setNotice(done ? '완료 표시를 취소했어요.' : '오늘 루틴을 완료했어요.');
          })} />
        </View>;
      })}
    </Card>

    <Card>
      <Text style={styles.title}>반복 루틴 추가</Text>
      <Field label="루틴 이름" value={form.title} maxLength={60} editable={!busy} placeholder="예: 설거지 5분, 물 2L 마시기" onChangeText={value => change('title', value)} />
      <Field label="알림 시간 (선택, HH:MM)" value={form.reminderTime} maxLength={5} editable={!busy} keyboardType="numbers-and-punctuation" placeholder="21:30" onChangeText={value => change('reminderTime', value)} />
      <Text style={styles.text}>반복 요일</Text>
      <View style={styles.row}>
        <Button title={(sameDays(EVERY_DAY) ? '✓ ' : '') + '매일'} disabled={busy} onPress={() => change('days', EVERY_DAY)} />
        <Button title={(sameDays(WEEKDAYS) ? '✓ ' : '') + '평일'} disabled={busy} onPress={() => change('days', WEEKDAYS)} />
        <Button title={(sameDays(WEEKEND) ? '✓ ' : '') + '주말'} disabled={busy} onPress={() => change('days', WEEKEND)} />
      </View>
      <View style={styles.row}>
        {WEEK_DAYS.map(day => <Button key={day.value} title={(form.days.includes(day.value) ? '✓ ' : '') + day.label} disabled={busy} onPress={() => toggleDay(day.value)} />)}
      </View>
      <Text style={styles.text}>에너지</Text>
      <View style={styles.row}>
        <Button title={(form.energy === 'low' ? '✓ ' : '') + '5분 이하'} disabled={busy} onPress={() => change('energy', 'low')} />
        <Button title={(form.energy === 'normal' ? '✓ ' : '') + '보통'} disabled={busy} onPress={() => change('energy', 'normal')} />
      </View>
      <Button title={busy ? '저장 중…' : '루틴 저장'} disabled={busy} onPress={saveRoutine} />
    </Card>

    <Card>
      <Text style={styles.title}>등록된 반복 루틴</Text>
      {state && !state.routines.length && <Text style={styles.text}>아직 등록한 루틴이 없어요.</Text>}
      {state?.routines.map(item => <View key={item.id} style={{ gap: 8, borderBottomWidth: 1, borderBottomColor: '#e1eae5', paddingVertical: 10 }}>
        <Text style={styles.text}>{item.title}</Text>
        <Text style={styles.small}>{repeatLabel(item.days)} · {item.energy === 'low' ? '5분 이하' : '보통'}{item.reminderTime ? ` · 알림 ${item.reminderTime}` : ' · 알림 없음'}</Text>
        <Button title="삭제" disabled={busy} onPress={() => run(async () => {
          await store.update(current => removeRoutine(current, item.id));
          setNotice('루틴을 삭제했어요.');
        })} />
      </View>)}
    </Card>
  </Page>;
}
