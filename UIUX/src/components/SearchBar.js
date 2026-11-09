
import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, emergencyColors as c } from '../theme';

export default function SearchBar({
  value = '',
  onChangeText,
  placeholder = '장소 이름 검색',
  onPressFilter,
  filterActive = false,
}) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="magnify"
        size={22}
        color={c.textSecondary}
      />

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textSecondary}
        returnKeyType="search"
        autoCorrect={false}
      />

      {value.length > 0 && (
        <Pressable
          style={styles.clearButton}
          onPress={() => onChangeText?.('')}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={19}
            color={c.textSecondary}
          />
        </Pressable>
      )}

      {onPressFilter && (
        <Pressable
          style={[
            styles.filterButton,
            filterActive && styles.filterButtonActive,
          ]}
          onPress={onPressFilter}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={18}
            color={filterActive ? colors.white : c.accent}
          />
          <Text
            style={[
              styles.filterText,
              filterActive && styles.filterTextActive,
            ]}
          >
            필터
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7F6',
    borderRadius: 14,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#E2EAE8',
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: 48,
    marginLeft: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: c.text,
    paddingVertical: 0,
  },

  clearButton: {
    padding: 4,
    marginRight: 4,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: c.accent,
    gap: 4,
  },

  filterButtonActive: {
    backgroundColor: c.accent,
  },

  filterText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: c.accent,
  },

  filterTextActive: {
    color: colors.white,
  },
});
