import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import Text from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormField from '../components/FormField';
import QuantityField from '../components/QuantityField';
import PrimaryButton from '../components/PrimaryButton';
import { useAppData } from '../store/AppDataContext';
import { confirmAction } from '../utils/confirm';
import { colors, fonts, spacing } from '../theme';

// "1개 · 1L" 같은 예전 형식의 글자에서 수량 숫자와 단위를 뽑아냅니다. (amount / unit 이 없는 항목용)
function parseQuantity(text = '') {
  const m = String(text).match(/^\s*(\d+(?:\.\d+)?)\s*([^\s·]+)?/);
  return { amount: m ? m[1] : '', unit: m?.[2] ?? null };
}

// 유통기한이 지난 식재료를 폐기하는 화면. navigate('FridgeDiscard', { id })
// 이름과 수량만 보여 주고(읽기 전용), "폐기" 버튼을 누르면 확인 후 냉장고에서 삭제합니다.
export default function FridgeDiscardScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { fridgeItems, removeFridgeItem } = useAppData();
  const id = route.params?.id;
  const item = fridgeItems.find((i) => i.id === id);
  const parsed = item ? parseQuantity(item.quantity) : { amount: '', unit: null };

  const handleDiscard = () => {
    confirmAction({
      title: '식재료를 폐기할까요?',
      message: `'${item?.name ?? '이 식재료'}'이(가) 냉장고에서 삭제돼요.`,
      confirmLabel: '폐기',
      destructive: true,
      onConfirm: () => {
        removeFridgeItem(id);
        navigation.goBack();
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
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
          <Text style={styles.title}>폐기</Text>
        </View>
        <Text style={styles.subtitle}>유통기한이 지난 식재료예요. 폐기할 품목을 확인해 주세요.</Text>

        <FormField label="식재료 이름" value={item?.name ?? ''} editable={false} />
        <QuantityField
          label="수량"
          value={String(item?.amount ?? parsed.amount)}
          unit={item?.unit ?? parsed.unit}
          editable={false}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <PrimaryButton
          label="폐기"
          onPress={handleDiscard}
          style={{ backgroundColor: colors.expired }}
        />
      </View>
    </View>
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
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.textPrimary,
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
