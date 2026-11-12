import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import BottomSheet from './BottomSheet';
import PrimaryButton from './PrimaryButton';
import { colors, fonts } from '../theme';

// 생년월일 선택 시트: 연도 · 월 · 일 세 칸을 스크롤해서 고릅니다.
// 달력을 한 달씩 넘기지 않아도 되고, 기기(iOS·Android·웹)와 상관없이 똑같이 보입니다.
// value: 'YYYY-MM-DD' 또는 '', onConfirm(value), onClose()
const ROW = 48;
const pad = (n) => String(n).padStart(2, '0');
const daysIn = (year, month) => new Date(year, month, 0).getDate();

function Column({ label, items, selected, onSelect, format }) {
  // 항목이 최대 130개 정도라 전부 그리고(ScrollView), 열릴 때 선택된 값이 가운데 오도록 스크롤합니다.
  const ref = useRef(null);
  const index = Math.max(0, items.indexOf(selected));
  const center = () => ref.current?.scrollTo({ y: Math.max(0, (index - 2) * ROW), animated: false });
  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <ScrollView ref={ref} style={styles.list} onLayout={center} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {items.map((item) => {
          const active = item === selected;
          return (
            <Pressable
              key={item}
              onPress={() => onSelect(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={format(item)}
              style={[styles.row, active && styles.rowActive]}
            >
              <Text style={[styles.rowText, active && styles.rowTextActive]}>{format(item)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function BirthDatePicker({ visible, value, maxDate, onConfirm, onClose }) {
  const last = maxDate || new Date();
  const lastYear = last.getFullYear();
  const years = useMemo(() => Array.from({ length: lastYear - 1900 + 1 }, (_, i) => lastYear - i), [lastYear]);
  const [year, setYear] = useState(lastYear - 20);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);

  useEffect(() => {
    if (!visible) return;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
      const [y, m, d] = value.split('-').map(Number);
      setYear(y); setMonth(m); setDay(d);
    } else {
      setYear(lastYear - 20); setMonth(1); setDay(1);
    }
  }, [visible]);

  // 연·월을 바꾸면 그 달에 없는 날(예: 2월 30일)은 마지막 날로 맞춥니다.
  const maxDay = daysIn(year, month);
  useEffect(() => { if (day > maxDay) setDay(maxDay); }, [maxDay]);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);
  const picked = `${year}-${pad(month)}-${pad(Math.min(day, maxDay))}`;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="생년월일 선택">
      <Text style={styles.preview} accessibilityLiveRegion="polite">
        {year}년 {month}월 {Math.min(day, maxDay)}일
      </Text>
      {visible && (
        <View style={styles.columns}>
          <Column label="연도" items={years} selected={year} onSelect={setYear} format={(y) => `${y}년`} />
          <Column label="월" items={months} selected={month} onSelect={setMonth} format={(m) => `${m}월`} />
          <Column key={`${year}-${month}`} label="일" items={days} selected={Math.min(day, maxDay)} onSelect={setDay} format={(d) => `${d}일`} />
        </View>
      )}
      <PrimaryButton label="선택 완료" onPress={() => onConfirm(picked)} style={styles.button} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  preview: { textAlign: 'center', fontFamily: fonts.bold, fontSize: 18, color: colors.textPrimary, marginBottom: 12 },
  columns: { flexDirection: 'row', gap: 8 },
  column: { flex: 1 },
  columnLabel: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary, marginBottom: 6 },
  list: { height: ROW * 5, borderRadius: 16, backgroundColor: colors.cardBg },
  row: { height: ROW, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  rowActive: { backgroundColor: colors.tabActiveBg },
  rowText: { fontFamily: fonts.regular, fontSize: 17, color: colors.textPrimary },
  rowTextActive: { fontFamily: fonts.bold, color: colors.green },
  button: { marginTop: 16 },
});
