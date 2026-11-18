import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from './TabBar';
import { colors } from '../theme';

// 탭 바 위에 떠 있는 "추가" 버튼. hasTabBar=false 면 탭 바가 없는 화면용 위치에 놓입니다.
export default function Fab({ onPress, accessibilityLabel = '추가', hasTabBar = true }) {
  const insets = useSafeAreaInsets();
  const bottom = hasTabBar
    ? Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT + 34
    : insets.bottom + 18;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.fab, { bottom }, pressed && styles.pressed]}
    >
      <Ionicons name="add" size={32} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F3A30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  pressed: {
    opacity: 0.85,
  },
});
