import React, { useState } from 'react';
import { ScrollView, TextInput, Pressable, View } from 'react-native';
import Text from '../components/AppText';
import { useAuth } from '../store/AuthContext';
import { diagnosisLabels } from '../utils/diagnosis';
import { styles } from './LoginScreen';

// 30초 자취 진단 (통합 과정에서 만든 기능용 화면).
// 모르는 항목은 null 로 저장해 '미입력'으로 진단합니다. 조리 도구는 '없음'([])과 미입력(null)을 구분합니다.
const EMPTY = {
  living_months: null, priority: null, cooking_tools: null, cooking_days_per_week: null,
  monthly_budget_krw: null, region_code: null, initial_inventory_state: 'not_entered',
};

export default function OnboardingScreen({ navigation }) {
  const { onboarding, finish, firstDiagnosis, dismissFirstDiagnosis, diagnosis: savedDiagnosis } = useAuth();
  const [form, setForm] = useState(onboarding || EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // 저장 직후 진단 결과. 첫 실행에서 화면이 다시 그려져도 저장된 진단을 보여 줍니다.
  const [result, setResult] = useState(null);
  const shown = result || (firstDiagnosis ? savedDiagnosis : null);

  const patch = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const choices = (key, options) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(([value, label]) => {
        const selected = form[key] === value;
        return (
          <Pressable key={String(value)} accessibilityRole="button" accessibilityState={{ selected }}
            onPress={() => patch(key, selected && key !== 'initial_inventory_state' ? null : value)}
            style={[styles.input, selected && { backgroundColor: '#D5EEE3' }]}>
            <Text>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
  const tools = form.cooking_tools;
  const toggleTool = (value) => {
    if (value === 'none') return patch('cooking_tools', tools && tools.length === 0 ? null : []);
    const current = tools || [];
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
    patch('cooking_tools', next.length ? next : null); // 모두 해제하면 '미입력'
  };

  const save = async () => {
    setBusy(true); setError('');
    try { setResult(await finish(form)); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const close = () => {
    if (firstDiagnosis) dismissFirstDiagnosis(); // 첫 실행 → 홈
    else if (navigation?.canGoBack()) navigation.goBack(); // 더보기에서 수정 → 이전 화면
    else setResult(null);
  };

  if (shown) {
    const L = diagnosisLabels;
    const missing = (shown.missing_fields || []).filter((f) => f !== 'region_code');
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.title}>진단 결과</Text>
        <Text style={styles.copy}>입력한 내용으로 정리했어요. 언제든 더보기 &gt; 생활 데이터 수정에서 바꿀 수 있어요.</Text>
        <View style={[styles.input, { gap: 6 }]}>
          <Text>· {L.experience[shown.experience]}</Text>
          <Text>· {L.cooking_environment[shown.cooking_environment]}</Text>
          <Text>· {L.cooking_frequency[shown.cooking_frequency]}</Text>
          <Text>· 월 예산 {form.monthly_budget_krw == null ? '미설정' : `${form.monthly_budget_krw.toLocaleString('ko-KR')}원`}</Text>
        </View>
        {(shown.suggested_actions || []).length > 0 && (
          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: '700' }}>추천 할 일</Text>
            {shown.suggested_actions.map((a) => <Text key={a}>· {L.actions[a] || a}</Text>)}
          </View>
        )}
        {missing.length > 0 && <Text>아직 입력하지 않은 항목: {missing.map((f) => L.fields[f] || f).join(', ')}</Text>}
        <Pressable style={styles.button} onPress={close}>
          <Text style={styles.white}>{firstDiagnosis ? '홈으로 시작하기' : '확인'}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>30초 자취 진단</Text>
      <Text>모르는 항목은 비워 두어도 괜찮아요. 나중에 수정할 수 있어요.</Text>
      <Text>자취 기간</Text>
      {choices('living_months', [[0, '시작 전'], [3, '6개월 미만'], [9, '1년 미만'], [12, '1년 이상']])}
      <Text>가장 중요한 목표</Text>
      {choices('priority', [['save_money', '생활비 절약'], ['reduce_waste', '낭비 줄이기'], ['build_routine', '습관 만들기']])}
      <Text>조리 도구 (복수 선택)</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[['microwave', '전자레인지'], ['stove', '가스·인덕션'], ['rice_cooker', '밥솥'], ['air_fryer', '에어프라이어'], ['none', '조리 도구 없음']].map(([value, label]) => {
          const selected = value === 'none' ? !!tools && tools.length === 0 : !!tools?.includes(value);
          return (
            <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => toggleTool(value)}
              style={[styles.input, selected && { backgroundColor: '#D5EEE3' }]}>
              <Text>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text>주간 요리 일수</Text>
      {choices('cooking_days_per_week', Array.from({ length: 8 }, (_, i) => [i, `${i}일`]))}
      <Text>월 목표 예산 (원)</Text>
      <TextInput style={styles.input} keyboardType="number-pad" placeholder="예: 500,000"
        value={form.monthly_budget_krw == null ? '' : form.monthly_budget_krw.toLocaleString('ko-KR')}
        onChangeText={(text) => { const digits = text.replace(/\D/g, ''); patch('monthly_budget_krw', digits ? Math.min(1000000000, Number(digits)) : null); }} />
      <Text style={{ color: '#5F6F68' }}>비워 두면 예산은 '미설정'으로 표시돼요. 0을 입력하면 0원 예산으로 저장돼요.</Text>
      <Text>현재 냉장고</Text>
      {choices('initial_inventory_state', [['not_entered', '나중에 입력'], ['empty', '비어 있어요'], ['needs_registration', '재료가 있어요']])}
      <Text style={{ color: '#B3261E' }}>{error}</Text>
      <Pressable disabled={busy} style={styles.button} onPress={save}>
        <Text style={styles.white}>{busy ? '저장 중…' : '저장하고 진단 보기'}</Text>
      </Pressable>
    </ScrollView>
  );
}
