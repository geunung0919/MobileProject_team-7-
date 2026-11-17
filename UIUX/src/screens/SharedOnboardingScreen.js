import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import FormField from '../components/FormField';
import Chip from '../components/Chip';
import PrimaryButton from '../components/PrimaryButton';
import { useAppData } from '../store/AppDataContext';
import { loadOnboarding, saveOnboarding } from '../../../api/receiptApi';
import { auth } from '../../../firebase/firebaseConfig';
import { spacing } from '../theme';

const priorities = [['save_money', '생활비 절약'], ['reduce_waste', '식재료 낭비 줄이기'], ['build_routine', '생활 습관 만들기']];
const equipment = [['microwave', '전자레인지'], ['stove', '가스·인덕션'], ['rice_cooker', '밥솥'], ['air_fryer', '에어프라이어']];
const inventory = [['not_entered', '나중에 입력'], ['empty', '비어 있어요'], ['needs_registration', '재료가 있어요']];
const digits = (value, min, max, label) => {
  if (value === '') return null;
  if (!/^\d+$/.test(value) || Number(value) < min || Number(value) > max) throw new Error(`${label} 입력 범위를 확인해 주세요.`);
  return Number(value);
};

export default function SharedOnboardingScreen({ navigation }) {
  const { top, bottom } = useSafeAreaInsets();
  const { sharedUid } = useAppData();
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: top + 12, paddingBottom: bottom + 24, paddingHorizontal: spacing.screenX, gap: 12 }}>
    <BackHeader title="내 생활 설정" onBack={() => navigation.goBack()} />
    {sharedUid ? <Onboarding key={sharedUid} uid={sharedUid} navigation={navigation} /> :
      <PrimaryButton label="로그인" onPress={() => navigation.navigate('SharedLogin')} />}
  </ScrollView>;
}

function Onboarding({ uid, navigation }) {
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    setMessage('');
    loadOnboarding(uid).then(({ profile: p }) => {
      if (!active) return;
      setDraft({ months: String(p?.living_months ?? ''), days: String(p?.cooking_days_per_week ?? ''),
        budget: String(p?.monthly_budget_krw ?? ''), priority: p?.priority === 'build_habit' ? 'build_routine' : p?.priority ?? null,
        tools: Array.isArray(p?.cooking_tools) ? p.cooking_tools : [], inventory: p?.initial_inventory_state ?? 'not_entered' });
    }).catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [uid, reload]);
  const patch = (name, value) => setDraft((row) => ({ ...row, [name]: value }));
  const save = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      await saveOnboarding({
        living_months: digits(draft.months, 0, 1200, '자취 개월 수'),
        cooking_days_per_week: digits(draft.days, 0, 7, '한 주 요리 횟수'),
        monthly_budget_krw: digits(draft.budget, 1, 1e9, '월 예산'),
        priority: draft.priority, cooking_tools: draft.tools, initial_inventory_state: draft.inventory,
      }, uid);
      if (auth.currentUser?.uid === uid && navigation.isFocused()) navigation.goBack();
    } catch (error) {
      setMessage(error.message || '생활 설정을 저장하지 못했어요.');
    } finally { lock.current = false; setBusy(false); }
  };
  return <>
    {message ? <Text accessibilityRole="alert">{message}</Text> : null}
    {!draft ? (message ? <PrimaryButton label="다시 불러오기" onPress={() => setReload((n) => n + 1)} /> : <Text>생활 설정을 불러오는 중이에요.</Text>) : <>
      <Text>입력한 기본 월 예산은 해당 달에 별도 예산이 없을 때 소비 화면에 반영돼요.</Text>
      <FormField label="자취 기간 (개월)" value={draft.months} keyboardType="number-pad" maxLength={4} onChangeText={(v) => patch('months', v)} marginTop={0} />
      <FormField label="한 주에 요리하는 날 (0~7)" value={draft.days} keyboardType="number-pad" maxLength={1} onChangeText={(v) => patch('days', v)} marginTop={0} />
      <FormField label="기본 월 예산 (원)" value={draft.budget} keyboardType="number-pad" maxLength={10} onChangeText={(v) => patch('budget', v)} marginTop={0} />
      <Text>가장 우선하는 목표</Text>
      <Choices options={priorities} selected={(v) => draft.priority === v} pick={(v) => patch('priority', draft.priority === v ? null : v)} />
      <Text>보유한 조리 도구</Text>
      <Choices options={equipment} selected={(v) => draft.tools.includes(v)} pick={(v) => patch('tools', draft.tools.includes(v) ? draft.tools.filter((t) => t !== v) : [...draft.tools, v])} />
      <Text>현재 냉장고 상태</Text>
      <Choices options={inventory} selected={(v) => draft.inventory === v} pick={(v) => patch('inventory', v)} />
      {busy ? <Text>저장 중이에요.</Text> : <PrimaryButton label="생활 설정 저장" onPress={save} />}
    </>}
  </>;
}

function Choices({ options, selected, pick }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {options.map(([value, label]) => <Chip key={value} label={label} selected={selected(value)} onPress={() => pick(value)} />)}
  </View>;
}
