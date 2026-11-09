import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fonts, emergencyColors as c } from '../theme';

// 비상매뉴얼 상단의 긴급 연락처 카드 (119 / 112).
export default function EmergencyContactCard({ number, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${number} ${label} 전화 걸기`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.number}>{number}</Text>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.phone}>
        <MaterialCommunityIcons name="phone-outline" size={22} color={c.danger} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 86,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.dangerBorder,
    backgroundColor: c.dangerBg,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.8,
  },
  number: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: c.danger,
  },
  label: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: c.text,
  },
  phone: {
    position: 'absolute',
    top: 15,
    right: 14,
  },
});
