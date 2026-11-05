import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// 할 일 목록의 한 줄: 체크박스 + 제목 + 마감 안내.
// - subText: 제목 아래 글자 (예: "내일까지", "11월 1일까지 · 1일 지남")
// - tone: 'normal'(회색) | 'today'(초록 굵게) | 'overdue'(주황 굵게 + 경고 아이콘)
// - overdue: true 면 기한이 지난 할 일 전용 카드 모양 (연한 주황 배경, 구분선 없음)
// - done: 완료된 할 일 (초록 체크 + 취소선, 줄 높이가 조금 더 낮음)
// - extraText: 제목 아래 글자 뒤에 " · " 와 함께 붙는 초록 글씨 (예: "오늘 완료")
// - vertical: 줄의 위아래 여백. 생략하면 기본값 (생활 루틴은 조금 더 높은 줄을 씁니다)
// - onToggle: 체크박스를 눌렀을 때 호출
export default function TodoRow({
  title,
  subText,
  extraText,
  vertical,
  tone = 'normal',
  overdue = false,
  done = false,
  onToggle,
}) {
  return (
    <View
      style={[
        styles.row,
        overdue ? styles.overdueRow : styles.divider,
        done && styles.compact,
        vertical != null && { paddingVertical: vertical },
      ]}
    >
      <Pressable
        onPress={onToggle}
        hitSlop={12}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={title}
        style={[
          styles.checkbox,
          overdue && styles.checkboxOverdue,
          done && styles.checkboxDone,
        ]}
      >
        {done ? <Ionicons name="checkmark" size={18} color={colors.white} /> : null}
      </Pressable>

      <View style={styles.texts}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.subRow}>
          {tone === 'overdue' ? (
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color={colors.warnText}
              style={styles.subIcon}
            />
          ) : null}
          <Text
            style={[
              styles.sub,
              tone === 'today' && styles.subToday,
              tone === 'overdue' && styles.subOverdue,
            ]}
          >
            {subText}
            {extraText ? (
              <>
                <Text>{'  · '}</Text>
                <Text style={styles.subExtra}>{extraText}</Text>
              </>
            ) : null}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  compact: {
    paddingVertical: 7,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: colors.divider,
  },
  overdueRow: {
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: colors.overdueBg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.checkboxBorder,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOverdue: {
    borderColor: colors.overdueBorder,
  },
  checkboxDone: {
    borderColor: colors.green,
    backgroundColor: colors.green,
  },
  texts: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 17,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  titleDone: {
    color: colors.placeholder,
    textDecorationLine: 'line-through',
  },
  subRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subIcon: {
    marginRight: 6,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  subToday: {
    fontFamily: fonts.bold,
    color: colors.green,
  },
  subExtra: {
    color: colors.green,
  },
  subOverdue: {
    fontFamily: fonts.bold,
    color: colors.warnText,
  },
});
