import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import { toDateString } from '../utils/format';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 직접 그린 월 달력 (기기와 상관없이 똑같이 보임). onChange(date): 날짜를 눌렀을 때
// minimumDate / maximumDate: 선택 가능한 범위 (범위 밖은 흐리게 표시)
export default function CalendarPicker({ value, onChange, minimumDate, maximumDate }) {
  const [view, setView] = useState({ year: value.getFullYear(), month: value.getMonth() }); // month: 0~11

  const selectedStr = toDateString(value);
  const todayStr = toDateString(new Date());
  const minStr = minimumDate ? toDateString(minimumDate) : null;
  const maxStr = maximumDate ? toDateString(maximumDate) : null;

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  // 앞쪽 빈칸 + 날짜들 + 뒤쪽 빈칸(7의 배수로 맞춤)
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const dateStrOf = (day) =>
    `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const moveMonth = (delta) => {
    setView(({ year, month }) => {
      const index = year * 12 + month + delta;
      return { year: Math.floor(index / 12), month: index % 12 };
    });
  };

  // 이전/다음 달에 선택 가능한 날짜가 하나도 없으면 화살표를 막습니다.
  const prevDisabled = minStr ? `${view.year}-${String(view.month + 1).padStart(2, '0')}-01` <= minStr : false;
  const nextDisabled = maxStr ? dateStrOf(daysInMonth) >= maxStr : false;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => moveMonth(-1)}
          disabled={prevDisabled}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="이전 달"
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={prevDisabled ? colors.checkboxBorder : colors.textPrimary}
          />
        </Pressable>
        <Text style={styles.monthTitle}>
          {view.year}년 {view.month + 1}월
        </Text>
        <Pressable
          onPress={() => moveMonth(1)}
          disabled={nextDisabled}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="다음 달"
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={nextDisabled ? colors.checkboxBorder : colors.textPrimary}
          />
        </Pressable>
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.week}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={styles.cell} />;
            const str = dateStrOf(day);
            const disabled = (minStr && str < minStr) || (maxStr && str > maxStr);
            const selected = str === selectedStr;
            const isToday = str === todayStr;
            return (
              <View key={di} style={styles.cell}>
                <Pressable
                  disabled={disabled}
                  onPress={() => onChange(new Date(view.year, view.month, day))}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: !!disabled }}
                  accessibilityLabel={`${view.month + 1}월 ${day}일`}
                  style={[styles.day, selected && styles.daySelected]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.dayToday,
                      selected && styles.dayTextSelected,
                      disabled && styles.dayDisabled,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const CELL_HEIGHT = 46;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    marginBottom: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    height: 32,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: colors.green,
  },
  dayText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  dayToday: {
    fontFamily: fonts.bold,
    color: colors.green,
  },
  dayTextSelected: {
    fontFamily: fonts.bold,
    color: colors.white,
  },
  dayDisabled: {
    color: colors.checkboxBorder,
  },
});
