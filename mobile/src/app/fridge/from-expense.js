import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSession } from '../../state/Session';
import { Page, Card, Field, Button, styles } from '../../features/fridge/components/UI';
import { useApp } from '../../features/fridge/state/AppProvider';
import { won } from '../../lib/api';
const newRow = () => ({ name: '', quantity: '', unit: '개', expiresAt: '' });
export default function FromExpense() {
  const { expenseId, period } = useLocalSearchParams();
  const { api } = useSession();
  const { state, importPurchase } = useApp();
  const [expense, setExpense] = useState(null), [error, setError] = useState('');
  const [rows, setRows] = useState([newRow()]);
  const [saving, setSaving] = useState(false);
  async function fetchExpense() {
    if (typeof expenseId !== 'string' || typeof period !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new Error('소비 내역에서 다시 선택해 주세요.');
    const result = await api('me/spending?period=' + period);
    const found = result.expenses.find(e => e.id === expenseId && e.category === 'groceries');
    if (!found) throw new Error('지출이 삭제되거나 변경되었어요. 소비 내역에서 다시 선택해 주세요.');
    return found;
  }
  useEffect(() => {
    let active = true;
    fetchExpense().then(e => { if (active) setExpense(e); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [api, expenseId, period]); // eslint-disable-line react-hooks/exhaustive-deps
  const imported = state.importedExpenseIds.includes(expenseId);
  const field = (index, name, value) => setRows(items => items.map((item, i) => i === index ? { ...item, [name]: value } : item));
  async function save() {
    setSaving(true);
    try {
      const current = await fetchExpense();
      if (current.title !== expense.title || current.amount_krw !== expense.amount_krw || current.spent_on !== expense.spent_on) {
        setExpense(current); throw new Error('지출 내용이 변경되었어요. 새 내역을 확인하고 다시 등록해 주세요.');
      }
      await importPurchase(current, rows.map(row => ({ ...row, quantity: Number(row.quantity) })));
      router.replace('/fridge/inventory');
    } finally { setSaving(false); }
  }
  return <Page title="구매한 재료 확인" subtitle="이 지출에서 산 재료를 모두 입력해 주세요. 저장하면 이 기기에서 한 번만 등록돼요.">
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {imported ? <Card><Text>이미 등록한 지출이에요. 재료를 추가하거나 고치려면 재고 목록을 이용하세요.</Text><Button title="재고 목록" onPress={() => router.replace('/fridge/inventory')} /></Card> : expense ? <>
      <Card><Text style={styles.label}>{expense.title} · {won(expense.amount_krw)}</Text><Text>{expense.spent_on}</Text><Text style={styles.muted}>금액으로 수량을 추정하지 않아요. 실제 구매한 양과 표시된 소비기한을 확인해 주세요.</Text></Card>
      {rows.map((row, index) => <Card key={index}>
        <Text style={styles.label}>재료 {index + 1}</Text>
        <Field label="재료명" value={row.name} maxLength={100} editable={!saving} onChangeText={v => field(index, 'name', v)} />
        <Field label="수량" value={row.quantity} keyboardType="decimal-pad" editable={!saving} onChangeText={v => field(index, 'quantity', v)} />
        <Field label="단위 (개 / g / 공기 / 모)" value={row.unit} maxLength={20} editable={!saving} onChangeText={v => field(index, 'unit', v)} />
        <Field label="소비기한 (YYYY-MM-DD)" value={row.expiresAt} placeholder="제품에 표시된 날짜" editable={!saving} onChangeText={v => field(index, 'expiresAt', v)} />
        {rows.length > 1 && <Button secondary title="이 재료 빼기" disabled={saving} onPress={() => setRows(items => items.filter((_, i) => i !== index))} />}
      </Card>)}
      <Button secondary title="재료 한 줄 추가" disabled={saving || rows.length >= 30} onPress={() => setRows(items => [...items, newRow()])} />
      <Button title="확인한 재료 냉장고에 저장" disabled={saving} onPress={save} />
      <Text style={styles.muted}>저장 후 지출을 수정·삭제해도 재고는 자동 변경되지 않아요. 재고 화면에서 직접 수정해 주세요.</Text>
    </> : !error && <Text>지출을 확인하고 있어요…</Text>}
    <Button secondary title="소비 관리로 돌아가기" disabled={saving} onPress={() => router.replace('/spending')} />
  </Page>;
}
