import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, mapColors as m } from '../theme';

// 지도 위 장소 핀 (x, y 는 핀 중심 좌표). 기본: 흰 원 + 초록 테두리 / selected: 초록 물방울 + 이름 말풍선
export default function MapPin({ x, y, icon = 'silverware-fork-knife', label, selected, onPress }) {
  if (!selected) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.pin, { left: x - 16, top: y - 16 }]}
      >
        <MaterialCommunityIcons name={icon} size={20} color={colors.accent} />
      </Pressable>
    );
  }

  return (
    <>
      <View style={[styles.bubbleWrap, { left: x - 100, top: y - 60 }]} pointerEvents="none">
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{label}</Text>
        </View>
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label} (선택됨)`}
        style={[styles.head, { left: x - 22, top: y - 22 }]}
      >
        <View style={styles.headInner}>
          <MaterialCommunityIcons name={icon} size={24} color={colors.white} />
        </View>
        <View style={styles.tail} />
      </Pressable>
    </>
  );
}

// 내 위치 (파란 점 + 반투명 원)
export function UserDot({ x, y }) {
  return (
    <>
      <View style={[styles.halo, { left: x - 32, top: y - 32 }]} pointerEvents="none" />
      <View style={[styles.dotRing, { left: x - 9, top: y - 9 }]} pointerEvents="none">
        <View style={styles.dot} />
      </View>
    </>
  );
}

const shadow = {
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 6,
  elevation: 3,
};

const styles = StyleSheet.create({
  pin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  headInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tail: {
    position: 'absolute',
    left: 16,
    top: 41,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.accent,
  },
  bubbleWrap: {
    position: 'absolute',
    width: 200,
    alignItems: 'center',
  },
  bubble: {
    height: 33,
    borderRadius: 16.5,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  bubbleText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.accent,
  },
  halo: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: m.userHalo,
  },
  dotRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: m.userDot,
  },
});
