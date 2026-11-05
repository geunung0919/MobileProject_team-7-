import React from 'react';
import BottomSheet from './BottomSheet';
import CalendarPicker from './CalendarPicker';
import PrimaryButton from './PrimaryButton';
import { StyleSheet } from 'react-native';

// 날짜를 고르는 하단 시트 (달력). 모든 기기에서 같은 달력(CalendarPicker)을 씁니다.
// - value: 현재 선택된 Date
// - onChange(date): 날짜를 누를 때마다 호출
// - onClose: "선택 완료"를 누르거나 시트를 닫을 때 호출
export default function DatePickerSheet({
  visible,
  value,
  minimumDate,
  maximumDate,
  onChange,
  onClose,
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="날짜 선택">
      <CalendarPicker
        value={value}
        onChange={onChange}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
      />
      <PrimaryButton label="선택 완료" onPress={onClose} style={styles.button} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
  },
});
