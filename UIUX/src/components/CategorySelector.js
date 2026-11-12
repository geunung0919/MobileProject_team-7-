import React, { useState } from 'react';
import { View, Pressable, Keyboard, StyleSheet } from 'react-native';
import Text from './AppText';
import Chip from './Chip';
import FieldLabel from './FieldLabel';
import SheetInput from './SheetInput';
import { getCategoryOptions, validateCategoryName, MAX_CATEGORY_LENGTH } from '../utils/category';
import { colors, fonts } from '../theme';

// 소비 카테고리 선택. 식품은 항상 맨 앞에 있고, 나머지는 사용자가 "+ 카테고리 추가"로 만든 것입니다.
// 한 번 추가한 카테고리는 저장소(customCategories)에 남아 다음에도 선택할 수 있습니다.
// value: 선택된 카테고리 (없으면 null), onChange(이름 | null): 같은 칩을 다시 누르면 선택이 해제됩니다.
// onAddCategory(이름): 새 카테고리 저장 (보통 useAppData().addCategory). 저장 직후 자동으로 선택됩니다.
export default function CategorySelector({
  customCategories,
  value,
  onChange,
  onAddCategory,
  hint = "선택하지 않으면 냉장고에 담는 식품이 있을 때는 '식품', 없으면 '기타'로 저장돼요.",
  style,
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  const options = getCategoryOptions(customCategories);

  const toggleAdding = () => {
    setAdding((open) => !open);
    setName('');
    setError(null);
  };

  const handleAdd = () => {
    const problem = validateCategoryName(name, customCategories);
    if (problem) {
      setError(problem);
      return;
    }
    const trimmed = name.trim();
    onAddCategory(trimmed);
    onChange(trimmed);
    setAdding(false);
    setName('');
    setError(null);
    Keyboard.dismiss();
  };

  return (
    <View style={style}>
      <FieldLabel label="카테고리" tag="선택" />
      <View style={styles.chips}>
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={value === option}
            onPress={() => onChange(value === option ? null : option)}
          />
        ))}
        <Chip label="+ 카테고리 추가" selected={adding} onPress={toggleAdding} />
      </View>

      {adding ? (
        <View>
          <View style={styles.addRow}>
            <SheetInput
              style={styles.addInput}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError(null);
              }}
              onSubmitEditing={handleAdd}
              placeholder="예: 교통, 월세, 취미"
              maxLength={MAX_CATEGORY_LENGTH}
              autoFocus
              accessibilityLabel="새 카테고리 이름"
            />
            <Pressable
              onPress={handleAdd}
              accessibilityRole="button"
              accessibilityLabel="카테고리 추가하기"
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            >
              <Text style={styles.addButtonText}>추가</Text>
            </Pressable>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : null}

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  addInput: {
    flex: 1,
  },
  addButton: {
    minHeight: 56,
    paddingHorizontal: 22,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
  },
  pressed: {
    opacity: 0.85,
  },
  addButtonText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
  },
  error: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.warnText,
  },
  hint: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
