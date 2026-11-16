import React from 'react';
import { View, StyleSheet } from 'react-native';
import TextInput from './AppTextInput';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// 돋보기 아이콘이 있는 검색 입력창 (비상매뉴얼 화면).
export default function SearchBar({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.box}>
      <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCorrect={false}
        accessibilityLabel="상황 검색"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    minHeight: 48,
    padding: 0,
    marginLeft: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary,
  },
});
