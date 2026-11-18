import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// 할 일 목록의 한 줄: 체크박스 + 제목 + 마감 안내.
// subText(제목 아래 글자), extraText(뒤에 " · " 로 붙는 초록 글씨), tone('normal' | 'today' | 'overdue'),
// overdue(기한 지난 할 일 전용 카드 모양), done(완료: 초록 체크 + 취소선), disabled(오늘은 쉬는 항목: 흐리게, 체크 불가),
// vertical(위아래 여백), onToggle(체크를 눌렀을 때)
export default function TodoRow({
  title,
  subText,
  extraText,
  vertical,
  tone = 'normal',
  overdue = false,
  done = false,
  disabled = false,
  onToggle,
}) {
  return (
    <View
      style={[
        styles.row,
        overdue ? styles.overdueRow : styles.divider,
        done && styles.compact,
        disabled && styles.disabled,
        vertical != null && { paddingVertical: vertical },
      ]}
    >
      <Pressable
        onPress={onToggle}
        disabled={disabled}
        hitSlop={12}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled }}
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
  disabled: {
    opacity: 0.5,
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
