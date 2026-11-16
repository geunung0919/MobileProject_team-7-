import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './AppText';
import { colors, fonts } from '../theme';

// 시트 입력 칸 위의 라벨 + 작은 태그 (예: "할 일 내용 필수"). required 면 태그가 초록색, style 은 바깥 여백용
export default function FieldLabel({ label, tag, required = false, style }) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.label}>{label}</Text>
      {tag ? <Text style={[styles.tag, required && styles.tagRequired]}>{tag}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  tag: {
    marginLeft: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  tagRequired: {
    color: colors.green,
  },
});
