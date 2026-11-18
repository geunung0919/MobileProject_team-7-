import React from 'react';
import BottomSheet from './BottomSheet';
import CalendarPicker from './CalendarPicker';
import PrimaryButton from './PrimaryButton';
import { StyleSheet } from 'react-native';

// 날짜를 고르는 하단 시트 (CalendarPicker 사용). onChange(date): 날짜를 누를 때마다, onClose: "선택 완료"/닫을 때
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
