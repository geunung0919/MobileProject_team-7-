import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';
import IconBox from './IconBox';
import { colors, fonts, radius } from '../theme';

// "소비 추가" 시트 (영수증 촬영 / 직접 입력). options: [{ id, title, description, icon }]
// onSelect(id): 고른 항목의 id. 화면 이동은 부모에서 연결합니다.
export default function AddSpendingSheet({ visible, onClose, onClosed, options, onSelect }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} onClosed={onClosed} title="소비 추가">
      <View style={styles.list}>
        {options.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <IconBox
              name={option.icon}
              size={46}
              borderRadius={16}
              iconColor={colors.green}
              backgroundColor={colors.tabActiveBg}
            />
            <View style={styles.texts}>
              <Text style={styles.title}>{option.title}</Text>
              <Text style={styles.description}>{option.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.tabInactive} />
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.75,
  },
  texts: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  description: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});