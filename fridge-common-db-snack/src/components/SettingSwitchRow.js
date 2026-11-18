import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

// 제목 + 설명 + 오른쪽 스위치로 이루어진 설정 한 줄 (앱 설정 화면).
export default function SettingSwitchRow({ title, description, value, onValueChange, showDivider = true }) {
  return (
    <View style={[styles.row, showDivider && styles.divider]}>
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.divider, true: colors.green }}
        thumbColor={colors.white}
        accessibilityLabel={title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: colors.divider,
  },
  texts: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  description: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
