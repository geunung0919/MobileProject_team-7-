import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, emergencyColors as c } from '../theme';

// 화면 하단의 안내 배너 (제목 + 초록 링크 문구 + 오른쪽 화살표).
export default function InfoBanner({ title, linkLabel, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title} ${linkLabel}`}
      style={({ pressed }) => [styles.banner, style, pressed && styles.pressed]}
    >
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.link}>{linkLabel}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: c.surface,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: c.text,
  },
  link: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: c.accent,
  },
});
