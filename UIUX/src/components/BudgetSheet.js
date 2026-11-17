import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import Text from './AppText';
import BottomSheet from './BottomSheet';
import FieldLabel from './FieldLabel';
import SheetInput from './SheetInput';
import PrimaryButton from './PrimaryButton';
import { formatNumber } from '../utils/format';
import { colors, fonts } from '../theme';

// "이번 달 예산" 수정 시트. onSubmit(금액 숫자)
export default function BudgetSheet({ visible, budget, onClose, onSubmit }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) setText(budget ? String(budget) : '');
  }, [visible, budget]);

  const digits = text.replace(/[^0-9]/g, '');

  const handleSubmit = () => {
    const amount = Number(digits);
    if (!digits || !(amount > 0) || amount > 1_000_000_000) {
      Alert.alert('입력을 확인해 주세요', '예산을 1원 이상 10억원 이하로 입력해 주세요.');
      return;
    }
    onSubmit(amount);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="이번 달 예산">
      <FieldLabel label="예산 (원)" tag="필수" required />
      <SheetInput
        value={digits ? formatNumber(Number(digits)) : ''}
        onChangeText={setText}
        placeholder="예: 500,000"
        keyboardType="number-pad"
        maxLength={13}
        accessibilityLabel="이번 달 예산"
      />
      <Text style={styles.helper}>이번 달 남은 예산과 홈 화면 숫자가 이 금액으로 계산돼요.</Text>
      <PrimaryButton label="저장하기" onPress={handleSubmit} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  helper: {
    marginTop: 12,
    marginBottom: 16,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
