import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Keyboard,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Text from './AppText';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CalendarPicker from './CalendarPicker';
import BottomSheet from './BottomSheet';
import PrimaryButton from './PrimaryButton';
import FieldLabel from './FieldLabel';
import SheetInput from './SheetInput';
import SegmentedControl from './SegmentedControl';
import { formatKoreanDateShort, toDateString } from '../utils/format';
import { colors, fonts } from '../theme';

// 키보드/달력이 열려도 시트가 넘치지 않도록 입력 영역 높이를 제한합니다 (넘치면 스크롤).
const BODY_MAX_HEIGHT = Dimensions.get('window').height * 0.5;

const DUE_OPTIONS = [
  { value: true, label: '날짜 선택' },
  { value: false, label: '기한 없음' },
];

// "할 일 추가" 시트. onSubmit({ title, due }): due 는 "YYYY-MM-DD" (기한 없으면 null)
// 열 때마다 입력값이 초기화됩니다 (마감일은 오늘로 시작).
export default function AddTodoSheet({ visible, onClose, onSubmit }) {
  const [text, setText] = useState('');
  const [hasDue, setHasDue] = useState(true);
  const [date, setDate] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(false); // 날짜 박스 아래로 펼쳐지는 달력

  useEffect(() => {
    if (visible) {
      setText('');
      setHasDue(true);
      setDate(new Date());
      setPickerOpen(false);
    }
  }, [visible]);

  const handleChangeDue = (value) => {
    setHasDue(value);
    if (!value) setPickerOpen(false);
  };

  const handlePressDate = () => {
    Keyboard.dismiss();
    setPickerOpen((open) => !open);
  };

  const handleSubmit = () => {
    if (!text.trim()) {
      Alert.alert('입력을 확인해 주세요', '할 일 내용을 입력해 주세요.');
      return;
    }
    onSubmit({ title: text.trim(), due: hasDue ? toDateString(date) : null });
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="할 일 추가">
      <ScrollView
        style={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <FieldLabel label="할 일 내용" tag="필수" required />
        <SheetInput
          value={text}
          onChangeText={setText}
          placeholder="예: 관리비 납부하기"
          maxLength={40}
          accessibilityLabel="할 일 내용"
        />

        <FieldLabel label="마감일" tag="선택" style={styles.labelSpaced} />
        <SegmentedControl options={DUE_OPTIONS} value={hasDue} onChange={handleChangeDue} />

        {hasDue ? (
          <>
            <Pressable
              onPress={handlePressDate}
              accessibilityRole="button"
              accessibilityLabel="마감일 선택"
              style={({ pressed }) => [styles.dateBox, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="calendar-month-outline" size={26} color={colors.green} />
              <Text style={styles.dateText}>{formatKoreanDateShort(date)}</Text>
              <Ionicons
                name={pickerOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>

            {pickerOpen ? (
              <View style={styles.picker}>
                <CalendarPicker value={date} minimumDate={new Date()} onChange={setDate} />
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <Text style={styles.helper}>추가하면 마감일 순서에 맞춰 목록에 담겨요.</Text>
      <PrimaryButton label="추가하기" onPress={handleSubmit} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    maxHeight: BODY_MAX_HEIGHT,
    flexGrow: 0,
  },
  labelSpaced: {
    marginTop: 20,
  },
  dateBox: {
    marginTop: 10,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
  dateText: {
    flex: 1,
    marginLeft: 12,
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.textPrimary,
  },
  picker: {
    marginTop: 8,
    alignItems: 'center',
  },
  helper: {
    marginTop: 22,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
