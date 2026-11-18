import IngredientSuggestions from '../../module3/components/IngredientSuggestions';
import {foodUnit} from '../../module3/domain/foodUnits.mjs';
import {useApp,newId} from '../../module3/state/AppProvider';
import {inventoryDraft,inventoryRecord,STORAGE_METHODS,DATE_TYPES} from '../../module3/domain/inventoryFields.mjs';
import {router} from '../../integration/router';
import ReferenceNotice from '../../module3/components/ReferenceNotice';
import ActionMenu from '../components/ActionMenu';
import Chip from '../components/Chip';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormField from '../components/FormField';
import QuantityField from '../components/QuantityField';
import UnitPickerSheet from '../components/UnitPickerSheet';
import DatePickerSheet from '../components/DatePickerSheet';
import PrimaryButton from '../components/PrimaryButton';
import { fridgeData } from '../data/fridge/fridge';
import { useAppData } from '../store/AppDataContext';
import { formatDotDate, toDateString, fromDateString, addDays } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

// "1개 · 1L" 같은 예전 형식의 글자에서 수량 숫자와 단위를 뽑아냅니다. (amount / unit 이 없는 항목용)
function parseQuantity(text = '') {
  const m = String(text).match(/^\s*(\d+(?:\.\d+)?)\s*([^\s·]+)?/);
  return { amount: m ? m[1] : '', unit: m?.[2] ?? null };
}

// 식재료 추가 / 수정 화면. navigate('FridgeAdd') 는 추가, navigate('FridgeAdd', { id }) 는 그 식재료를 불러와 수정합니다 (삭제 버튼도 보임).
export default function FridgeAddScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { unitOptions } = fridgeData;
  const {state,saveItem,deleteItem}=useApp();
  const lock=useRef(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [confirmDelete,setConfirmDelete]=useState(false);

  const editId = route.params?.id;
  const isEdit = !!editId;
  const existing = isEdit ? state.inventory.find((i) => i.id === editId) : undefined;
  const parsed = existing ? parseQuantity(existing.quantity) : null;

  const [manualUnit,setManualUnit]=useState(!!existing);
  const [name, setName] = useState(existing?.name ?? '');
  const [quantity, setQuantity] = useState(
    existing ? String(existing.quantity) : '', // 숫자와 소수점만 저장합니다.
  );
  const [unit, setUnit] = useState(existing ? (existing.unit ?? parsed.unit) : null);
  const [purchaseDate, setPurchaseDate] = useState(
    existing?.purchasedAt ? fromDateString(existing.purchasedAt) : null, // 선택 전에는 null (칸에 YYYY.MM.DD 표시)
  );
  // 더미 데이터는 expiry 대신 "오늘로부터 며칠 뒤(daysFromToday)"만 있어서 날짜로 바꿔 줍니다.
  const [expiryDate, setExpiryDate] = useState(
    existing?.expiresAt ? fromDateString(existing.expiresAt) : null,
  );

  const [storageMethod,setStorageMethod]=useState(existing?.storageMethod||'');
  const [dateType,setDateType]=useState(existing?.dateType||'');
  const [remainingCost,setRemainingCost]=useState(existing?.remainingCost==null?'':String(existing.remainingCost));
  const [extra,setExtra]=useState(false);
  const [unitSheetVisible, setUnitSheetVisible] = useState(false);
  const [dateSheetVisible, setDateSheetVisible] = useState(false);
  const [activeTarget, setActiveTarget] = useState('purchase'); // 날짜 시트가 다루는 칸: 'purchase' | 'expiry'

  const handleQuantityChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const [integer, ...rest] = cleaned.split('.');
    setQuantity(rest.length ? `${integer}.${rest.join('')}` : integer);
  };

  // 칸마다 값/저장 함수/선택 범위가 다릅니다 (구매일은 오늘까지, 유통기한은 구매일 이후만).
  const getDateConfig = (target) =>
    target === 'purchase'
      ? { value: purchaseDate, setValue: setPurchaseDate, minimumDate: undefined, maximumDate: new Date() }
      : { value: expiryDate, setValue: setExpiryDate, minimumDate: purchaseDate ?? undefined, maximumDate: undefined };

  const openDatePicker = (target) => {
    Keyboard.dismiss();
    const { value, setValue } = getDateConfig(target);
    // 아직 고른 날짜가 없으면 시트에 보이는 날짜(오늘)를 먼저 채워 둡니다.
    if (!value) setValue(new Date());
    setActiveTarget(target);
    setDateSheetVisible(true);
  };

  const openUnitSheet = () => {
    Keyboard.dismiss();
    setUnitSheetVisible(true);
  };

  const handleSelectUnit = (selected) => {
    setManualUnit(true);
    setUnit(selected);
    setUnitSheetVisible(false);
  };

  const handleSave = async () => {
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try {
      const draft={...inventoryDraft(existing),name,quantity,unit:unit||'',purchasedAt:purchaseDate?toDateString(purchaseDate):'',expiresAt:expiryDate?toDateString(expiryDate):'',storageMethod,dateType,remainingCost};
      await saveItem(inventoryRecord(draft,editId||newId(),existing));
      navigation.goBack();
    } catch(e){setError(e.message);} finally{lock.current=false;setBusy(false);}
  };
  const handleDelete = async () => {
    if(lock.current)return;
    if(!confirmDelete){setConfirmDelete(true);return;}
    lock.current=true;setBusy(true);
    try{await deleteItem(editId);navigation.goBack();}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}
  };

  const sheet = getDateConfig(activeTarget);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: spacing.screenX,
          paddingBottom: 24,
        }}
      >
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
          >
            <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>{isEdit ? '식재료 수정' : '식재료 추가'}</Text>
          {isEdit ? (
            <Pressable
              onPress={handleDelete}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="식재료 삭제"
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={24} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          {isEdit ? '식재료 정보를 수정해 주세요.' : '냉장고에 보관할 식재료 정보를 입력해 주세요.'}
        </Text>

        <FormField
          label="식재료 이름"
          value={name}
          onChangeText={value=>{setName(value);if(!manualUnit)setUnit(foodUnit(value)?.unit||null);}}
          placeholder="예: 우유, 달걀, 두부"
          maxLength={30}
        />
        <IngredientSuggestions value={name} onSelect={i=>{setName(i.name);if(!manualUnit)setUnit(i.unit);}}/>
        <QuantityField
          label="수량"
          value={quantity}
          onChangeText={handleQuantityChange}
          placeholder="수량 입력"
          unit={unit}
          onPressUnit={openUnitSheet}
          hint="예: 달걀 6개 · 시금치 1봉 · 두부 1모"
        />
        {foodUnit(name)&&<View style={{marginTop:12,gap:8}}>
          <Text style={{color:colors.textSecondary}}>레시피 기준: {foodUnit(name).name} · {foodUnit(name).unit}{unit!==foodUnit(name).unit?' / 현재 단위와 달라 재고 비교가 안 될 수 있어요.':''}</Text>
          {unit!==foodUnit(name).unit&&<Pressable accessibilityRole="button" onPress={()=>{setUnit(foodUnit(name).unit);setManualUnit(true);}}><Text style={{color:colors.green,fontWeight:'700'}}>수량을 확인하고 {foodUnit(name).unit} 단위로 변경</Text></Pressable>}
          {unit!==foodUnit(name).unit&&<Text style={{color:colors.textSecondary}}>개·봉·병을 공기·g·ml로 자동 환산하지 않아요. 단위를 바꾸면 수량도 직접 확인해 주세요.</Text>}
        </View>}
        {(unit==='kg'||unit==='L')&&<Text style={{marginTop:10,color:colors.textSecondary}}>저장 시 {quantity||'0'}{unit} → {Number(quantity||0)*1000}{unit==='kg'?'g':'ml'}로 맞춰요. 구매 금액은 그대로 유지돼요.</Text>}
        <FormField
          label="구매일"
          value={purchaseDate ? formatDotDate(toDateString(purchaseDate)) : ''}
          placeholder="YYYY.MM.DD"
          rightIcon="calendar-month-outline"
          onPress={() => openDatePicker('purchase')}
          hint="구매한 날짜를 입력해 주세요. 예: 2026.11.02"
        />
        <FormField
          label={dateType==='reference'?'보관 참고일':'소비기한'}
          value={expiryDate ? formatDotDate(toDateString(expiryDate)) : ''}
          placeholder="YYYY.MM.DD"
          rightIcon="calendar-month-outline"
          onPress={() => openDatePicker('expiry')}
          hint={dateType==='reference'?'직접 확인한 참고일이며 식품의 안전을 보장하지 않아요.':'포장에 표시된 날짜를 입력해 주세요.'}
        />
        <View style={{marginTop:28}}><Text style={[styles.subtitle,{marginTop:0,marginBottom:10,fontWeight:'700'}]}>보관 방법</Text><View style={{flexDirection:'row',gap:8}}>{STORAGE_METHODS.map(x=><Chip key={x.value} label={x.label} selected={storageMethod===x.value} onPress={()=>setStorageMethod(x.value)}/>)}</View></View>
        <View style={{marginTop:24}}><Text style={[styles.subtitle,{marginTop:0,marginBottom:10,fontWeight:'700'}]}>날짜 유형</Text><View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>{DATE_TYPES.map(x=><Chip key={x.value} label={x.value==='package'?'포장 표시일':'보관 참고일'} selected={dateType===x.value} onPress={()=>setDateType(x.value)}/>)}</View></View>
        <Pressable accessibilityRole="button" onPress={()=>setExtra(!extra)} style={{paddingVertical:22}}><Text style={{color:colors.green}}>구매 금액 {extra?'접기 −':'입력 +'}</Text></Pressable>
        {extra&&<FormField label="현재 수량의 구매 금액 (원)" value={remainingCost} onChangeText={setRemainingCost} keyboardType="number-pad" marginTop={0} placeholder="모르면 비워 두세요" hint="부분 사용·폐기 시 수량 비율에 따라 계산해요."/>}
        {isEdit&&<ActionMenu label="사용 · 폐기 · 이력" items={[
          ['실제 사용량 입력',()=>router.push(`/inventory/use/${editId}`)],
          ['일부 수량 폐기',()=>router.push(`/inventory/discard/${editId}`)],
          ['상세 관리 · 개봉일',()=>router.push(`/inventory/${editId}`)],
          ['재고 변경 이력',()=>router.push('/inventory/history')]
        ]}/>}
        {confirmDelete&&<View style={{paddingVertical:12,gap:12}}><Text>이 식재료를 삭제할까요?</Text><PrimaryButton label="삭제 확인" onPress={handleDelete}/><Pressable onPress={()=>setConfirmDelete(false)}><Text>취소</Text></Pressable></View>}
        {!!error&&<Text accessibilityRole="alert" style={{color:'#B33525',paddingVertical:16}}>{error}</Text>}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <PrimaryButton label={busy?'저장 중…':isEdit ? '수정 완료' : '추가하기'} onPress={handleSave} />
      </View>

      <UnitPickerSheet
        visible={unitSheetVisible}
        options={unitOptions}
        value={unit}
        onSelect={handleSelectUnit}
        onClose={() => setUnitSheetVisible(false)}
      />
      <DatePickerSheet
        visible={dateSheetVisible}
        value={sheet.value ?? new Date()}
        minimumDate={sheet.minimumDate}
        maximumDate={sheet.maximumDate}
        onChange={sheet.setValue}
        onClose={() => setDateSheetVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.bold, fontWeight:'700',
    fontSize: 24,
    color: colors.textPrimary,
  },
  deleteButton: {
    padding: 4,
  },
  subtitle: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: spacing.screenX,
    backgroundColor: colors.background,
  },
});
