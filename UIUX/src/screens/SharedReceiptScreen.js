import React, { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackHeader from '../components/BackHeader';
import FormField from '../components/FormField';
import Chip from '../components/Chip';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing } from '../theme';
import { auth } from '../../../firebase/firebaseConfig';
import { confirmReceipt } from '../../../api/receiptApi';
import { receiptOcrBase, recognizeReceipt } from '../../../api/receiptRecognition';
import { draftFromRecognition, emptyLine, reviewedPayload } from '../utils/sharedReceipt.mjs';
import { useAppData } from '../store/AppDataContext';

const types = [['ingredient', '식재료'], ['prepared_food', '조리식품'], ['household', '생활용품'], ['other', '기타'], ['unknown', '미분류']];
const storage = [['refrigerated', '냉장'], ['frozen', '냉동'], ['room', '실온']];
const dates = [['unknown', '기한 미입력'], ['package', '포장지 소비기한'], ['reference', '보관 참고일']];
function Choices({ choices, value, onChange }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }}>
    {choices.map(([key, label]) => <Chip key={key} label={label} selected={value === key} onPress={() => onChange(key)} />)}
  </View>;
}

export default function SharedReceiptScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sharedUid, refreshShared } = useAppData();
  const [draft, setDraft] = useState({ title: '', purchasedAt: '', total: '', items: [], receiptId: '' });
  const [pending, setPending] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [ocrToken, setOcrToken] = useState('');
  const [ocrBusy, setOcrBusy] = useState(false);
  const lock = useRef(false);
  const key = sharedUid ? `shared-receipt-pending:${sharedUid}` : null;
  useEffect(() => {
    let active = true;
    setReady(false);
    setPending(null);
    setOcrToken('');
    setDraft({ title: '', purchasedAt: '', total: '', items: [], receiptId: '' });
    if (key) AsyncStorage.getItem(key).then((raw) => {
      if (!active) return;
      setPending(raw ? JSON.parse(raw) : null);
      setReady(true);
    }).catch(() => { if (active) setMessage('저장 대기 중인 영수증을 읽지 못했어요. 화면을 다시 열어 주세요.'); });
    return () => { active = false; };
  }, [key]);

  const patch = (field, value) => setDraft((old) => ({ ...old, [field]: value }));
  const update = (id, fields) => setDraft((old) => ({ ...old, items: old.items.map((item) => item.key === id ? { ...item, ...fields } : item) }));
  const add = () => setDraft((old) => ({ ...old, items: [...old.items, emptyLine(`line-${Date.now()}-${Math.random().toString(36).slice(2)}`)] }));
  async function pick(camera) {
    if (lock.current || !ocrToken.trim()) {
      if (!ocrToken.trim()) setMessage('OCR 개발 토큰을 먼저 입력해 주세요.');
      return;
    }
    lock.current = true;
    setOcrBusy(true);
    setMessage('');
    try {
      const options = { mediaTypes: ['images'], base64: true, quality: 0.85 };
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) throw new Error('카메라 권한을 확인해 주세요.');
      const picked = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (picked.canceled) return;
      const recognized = await recognizeReceipt(picked.assets[0], ocrToken);
      if (auth.currentUser?.uid === sharedUid) setDraft(draftFromRecognition(recognized));
    } catch (error) {
      setMessage(error.message || '사진을 분석하지 못했어요.');
    } finally {
      lock.current = false;
      setOcrBusy(false);
    }
  }
  async function save() {
    if (!ready || lock.current || auth.currentUser?.uid !== sharedUid) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      const receiptId = draft.receiptId || `receipt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const payload = pending || reviewedPayload({ ...draft, receiptId });
      await AsyncStorage.setItem(key, JSON.stringify(payload));
      setPending(payload);
      try {
        await confirmReceipt(payload, sharedUid);
      } catch (error) {
        if (error.status === 422 || error.status === 409) {
          await AsyncStorage.removeItem(key);
          setPending(null);
        }
        throw error;
      }
      await refreshShared(sharedUid);
      await AsyncStorage.removeItem(key);
      if (auth.currentUser?.uid === sharedUid) navigation.goBack();
    } catch (error) {
      setMessage(error.message || '저장 상태를 확인하지 못했어요. 같은 요청으로 다시 시도해 주세요.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 28, paddingHorizontal: spacing.screenX, gap: 8 }} keyboardShouldPersistTaps="handled">
    <BackHeader title="영수증 저장" onBack={() => navigation.goBack()} />
    {!sharedUid ? <Text>로그인 후 영수증을 저장할 수 있어요.</Text> : null}
    {message ? <Text accessibilityRole="alert" style={{ color: colors.warnText }}>{message}</Text> : null}
    {ready && !pending && !busy ? <>
      {__DEV__ && receiptOcrBase ? <>
        <FormField label="OCR 개발용 토큰" value={ocrToken} onChangeText={setOcrToken} secureTextEntry />
        <Text>사진은 설정한 OCR 서버로 보내요. 영수증 한 장씩 선택해 주세요.</Text>
        {ocrBusy ? <Text>사진 분석 중…</Text> : <>
          {Platform.OS !== 'web' ? <Chip label="사진 촬영 후 분석" onPress={() => pick(true)} /> : null}
          <Chip label="사진첩에서 선택 후 분석" onPress={() => pick(false)} />
        </>}
      </> : null}
      {draft.warnings?.map((warning, i) => <Text key={i}>{warning}</Text>)}
      <Text>영수증 내용을 확인해 입력하고, 냉장고에 넣을 식재료만 선택해 주세요.</Text>
      <FormField label="사용처" value={draft.title} onChangeText={(v) => patch('title', v)} maxLength={100} />
      <FormField label="구매일" placeholder="YYYY-MM-DD" value={draft.purchasedAt} onChangeText={(v) => patch('purchasedAt', v)} />
      <FormField label="총 결제 금액 (원)" value={draft.total} onChangeText={(v) => patch('total', v)} keyboardType="number-pad" />
      {draft.items.map((item) => <View key={item.key} style={{ padding: 12, borderRadius: 16, backgroundColor: colors.cardBg }}>
        <FormField label="품목명" value={item.name} onChangeText={(name) => update(item.key, { name })} maxLength={100} marginTop={0} />
        <Choices choices={types} value={item.itemType} onChange={(itemType) => update(item.key, { itemType, inventorySelected: false })} />
        {item.printedAmount != null ? <Text>인식된 줄 금액: {item.printedAmount.toLocaleString()}원 · 할인 반영 여부를 확인해 주세요.</Text> : null}
        <FormField label="품목 실제 결제 금액 (원)" placeholder="모르면 비워 두세요" keyboardType="number-pad" value={item.paid} onChangeText={(paid) => update(item.key, { paid })} marginTop={8} />
        {item.itemType === 'ingredient' ? <Choices choices={[[false, '소비만 저장'], [true, '냉장고에도 등록']]} value={item.inventorySelected} onChange={(inventorySelected) => update(item.key, { inventorySelected })} /> : null}
        {item.inventorySelected ? <>
          <FormField label="실제 재고 수량" value={item.quantity} keyboardType="decimal-pad" onChangeText={(quantity) => update(item.key, { quantity })} marginTop={8} />
          <Choices choices={['개', '팩', 'g', 'ml'].map((v) => [v, v])} value={item.unit} onChange={(unit) => update(item.key, { unit })} />
          <Choices choices={storage} value={item.storageMethod} onChange={(storageMethod) => update(item.key, { storageMethod })} />
          <Choices choices={dates} value={item.dateType} onChange={(dateType) => update(item.key, { dateType, expiresAt: '' })} />
          {item.dateType !== 'unknown' ? <FormField label="기한" placeholder="YYYY-MM-DD" value={item.expiresAt} onChangeText={(expiresAt) => update(item.key, { expiresAt })} marginTop={8} /> : null}
        </> : null}
        <Chip label="품목 삭제" onPress={() => patch('items', draft.items.filter((row) => row.key !== item.key))} />
      </View>)}
      {draft.items.length < 100 ? <Chip label="품목 추가" onPress={add} /> : null}
    </> : null}
    {pending ? <Text>{pending.title} · {pending.amount.toLocaleString()}원 · 저장 확인 대기 중</Text> : null}
    {busy ? <Text>저장 및 조회 중…</Text> : ready && !ocrBusy ? <PrimaryButton label={pending ? '같은 요청으로 다시 확인' : '확인하고 저장'} onPress={save} /> : null}
  </ScrollView>;
}
