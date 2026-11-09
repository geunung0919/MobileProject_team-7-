import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fonts, emergencyColors as c } from '../theme';

// 돋보기 아이콘이 있는 검색 입력창 (비상매뉴얼 화면).
export default function SearchBar({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.box}>
      <MaterialCommunityIcons name="magnify" size={20} color={c.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textSecondary}
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
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    padding: 0,
    marginLeft: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: c.text,
  },
});
