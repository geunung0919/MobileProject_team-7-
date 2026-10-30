import React, { useRef, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Page, Field, Button, styles } from './UI';
import { useApp, newId } from '../state/AppProvider';
import ReferenceNotice from './ReferenceNotice';
import { STORAGE_METHODS, DATE_TYPES, inventoryDraft, inventoryRecord } from '../domain/inventoryFields.mjs';

function Choices({ label, options, value, onChange }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={formStyles.choices}>
        {options.map(option => (
          <Pressable key={option.value} accessibilityRole="radio"
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityState={{ checked: value === option.value }}
            onPress={() => onChange(option.value)}
            style={[formStyles.choice, value === option.value && formStyles.selected]}>
            <Text style={{ color: value === option.value ? 'white' : '#19382c' }}>
              {value === option.value ? '● ' : '○ '}{option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function InventoryForm({ item, shopping }) {
  const { saveItem, deleteItem, registerShopping } = useApp();
  const [draft, setDraft] = useState(() => inventoryDraft(item || (shopping ? {name:shopping.name,quantity:shopping.quantity,unit:shopping.unit} : undefined)));
  const [error, setError] = useState('');
  const lock = useRef(false);
  const [busy,setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const change = key => value => {
    setDraft(current => ({ ...current, [key]: value }));
    setError('');
    setConfirm(false);
  };
  async function save() {
    if(lock.current)return;
    lock.current=true;setBusy(true);
    try {
      const record=inventoryRecord(draft, item?.id || newId(), item);
      if(shopping) await registerShopping(shopping.id,record);
      else await saveItem(record);
      router.back();
    } catch (e) {
      setError(e.message);
    } finally { lock.current=false;setBusy(false); }
  }
  const dateLabel = draft.dateType === 'reference' ? '보관 참고일' : '소비기한';
  return (
    <Page title={item ? '재고 수정' : '새 재료 등록'}>
      {item && (!item.purchasedAt || !item.storageMethod || !item.dateType) &&
        <Text style={styles.muted}>이전에 등록한 재고예요. 구매일, 보관 방법, 날짜 유형을 확인해서 입력해 주세요.</Text>}
      <Field label="재료명 (예: 달걀)" value={draft.name} onChangeText={change('name')} />
      <Field label="수량" keyboardType="decimal-pad" value={draft.quantity} onChangeText={change('quantity')} />
      <Field label="단위 (개 / g / 공기 / 모)" value={draft.unit} onChangeText={change('unit')} />
      <Field label="현재 수량에 해당하는 구매 금액 (원, 선택)" keyboardType="number-pad" value={draft.remainingCost} onChangeText={change('remainingCost')} placeholder="모르면 비워 두세요"/>
      <Text style={styles.muted}>수량을 수정하면 해당 수량의 금액도 함께 확인해 주세요. 사용·폐기한 비율만큼 줄어들며 가계부 결제액은 바뀌지 않아요.</Text>
      <Field label="구매일 (YYYY-MM-DD)" placeholder="예: 2026-10-08"
        maxLength={10} autoCorrect={false} value={draft.purchasedAt} onChangeText={change('purchasedAt')} />
      <Choices label="보관 방법" options={STORAGE_METHODS} value={draft.storageMethod} onChange={change('storageMethod')} />
      <Choices label="날짜 유형" options={DATE_TYPES} value={draft.dateType} onChange={change('dateType')} />
      <Field label={`${dateLabel} (YYYY-MM-DD)`} maxLength={10} autoCorrect={false}
        value={draft.expiresAt} onChangeText={change('expiresAt')} />
      <ReferenceNotice/>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Button title={busy?"저장 중…":"저장"} disabled={busy} onPress={save} />
      {item && <Button secondary title="일부 수량 폐기하기" disabled={busy} onPress={()=>router.replace(`/inventory/discard/${item.id}`)}/>}
      {item && <Button disabled={busy} secondary title={confirm ? '정말 삭제하기' : '재고 삭제'} onPress={async () => {
        if(lock.current)return;
        if (!confirm) { setConfirm(true); return; }
        lock.current=true;setBusy(true);
        try { await deleteItem(item.id); router.back(); } catch(e) {setError(e.message);} finally {lock.current=false;setBusy(false);}
      }} />}
    </Page>
  );
}

const formStyles = StyleSheet.create({
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 44, justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ccd8cd', backgroundColor: 'white' },
  selected: { backgroundColor: '#217451', borderColor: '#217451' },
});
