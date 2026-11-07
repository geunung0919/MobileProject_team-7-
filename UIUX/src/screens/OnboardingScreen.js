import React, { useState } from 'react';
import { ScrollView, Text, TextInput, Pressable, View } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { styles } from './LoginScreen';
export default function OnboardingScreen({ navigation }) {
  const { onboarding, finish } = useAuth();
  const [form,setForm] = useState(onboarding || {living_months:null,priority:null,cooking_tools:[],cooking_days_per_week:null,monthly_budget_krw:null,region_code:null,initial_inventory_state:'not_entered'});
  const [error,setError] = useState(''); const [busy,setBusy] = useState(false);
  const patch = (key,value) => setForm(p => ({...p,[key]:value}));
  const choices = (key, options, multiple=false) => <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{options.map(([value,label]) => {
    const selected = multiple ? form[key]?.includes(value) : form[key] === value;
    return <Pressable key={String(value)} onPress={() => patch(key,multiple ? (selected ? form[key].filter(x=>x!==value) : [...(form[key]||[]),value]) : value)} style={[styles.input,selected && {backgroundColor:'#D5EEE3'}]}><Text>{label}</Text></Pressable>;
  })}</View>;
  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>30초 자취 진단</Text><Text>모르는 항목은 비워 두어도 괜찮아요. 나중에 수정할 수 있어요.</Text>
    <Text>자취 기간</Text>{choices('living_months',[[0,'시작 전'],[3,'6개월 미만'],[9,'1년 미만'],[12,'1년 이상']])}
    <Text>가장 중요한 목표</Text>{choices('priority',[['save_money','생활비 절약'],['reduce_waste','낭비 줄이기'],['build_routine','습관 만들기']])}
    <Text>조리 도구 (복수 선택)</Text>{choices('cooking_tools',[['microwave','전자레인지'],['stove','가스·인덕션'],['rice_cooker','밥솥'],['air_fryer','에어프라이어']],true)}
    <Text>주간 요리 일수</Text>{choices('cooking_days_per_week',Array.from({length:8},(_,i)=>[i,`${i}일`]))}
    <Text>월 목표 예산 (원)</Text><TextInput style={styles.input} keyboardType="number-pad" placeholder="예: 500,000" value={form.monthly_budget_krw === null ? '' : form.monthly_budget_krw.toLocaleString('ko-KR')} onChangeText={text=>{const digits=text.replace(/\D/g,'');patch('monthly_budget_krw',digits ? Math.min(1000000000,Number(digits)) : null);}} />
    <Text>현재 냉장고</Text>{choices('initial_inventory_state',[['not_entered','나중에 입력'],['empty','비어 있어요'],['needs_registration','재료가 있어요']])}
    <Text style={{color:'#B3261E'}}>{error}</Text>
    <Pressable disabled={busy} style={styles.button} onPress={async()=>{setBusy(true);try{await finish(form);if(navigation?.canGoBack())navigation.goBack();}catch(e){setError(e.message);}finally{setBusy(false);}}}><Text style={styles.white}>{busy?'저장 중…':'저장하고 시작하기'}</Text></Pressable>
  </ScrollView>;
}
