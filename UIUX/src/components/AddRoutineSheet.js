import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Keyboard,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';
import PrimaryButton from './PrimaryButton';
import FieldLabel from './FieldLabel';
import SheetInput from './SheetInput';
import SegmentedControl from './SegmentedControl';
import { pad } from '../utils/format';
import { to24HourString } from '../utils/time';
import { colors, fonts } from '../theme';

// 키보드나 선택 목록이 열려도 시트가 화면 밖으로 넘치지 않도록, 입력 영역은 이 높이까지만 보이고 넘치면 스크롤됩니다.
const BODY_MAX_HEIGHT = Dimensions.get('window').height * 0.5;

const PERIOD_OPTIONS = [
  { value: 'am', label: '오전' },
  { value: 'pm', label: '오후' },
];
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]; // 5분 단위


// "루틴 추가" 하단 시트.
// - onSubmit({ title, time }): "추가하기"를 눌렀을 때 호출. time 은 24시간제 "HH:mm" (예: "19:00").
// - 시트를 열 때마다 입력값이 초기화됩니다 (오전 08시 00분으로 시작).
export default function AddRoutineSheet({ visible, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [period, setPeriod] = useState('am');
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [openPicker, setOpenPicker] = useState(null); // 'hour' | 'minute' | null (펼쳐진 선택 목록)

  useEffect(() => {
    if (visible) {
      setName('');
      setPeriod('am');
      setHour(8);
      setMinute(0);
      setOpenPicker(null);
    }
  }, [visible]);

  const togglePicker = (which) => {
    Keyboard.dismiss();
    setOpenPicker((current) => (current === which ? null : which));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('입력을 확인해 주세요', '루틴 이름을 입력해 주세요.');
      return;
    }
    onSubmit({ title: name.trim(), time: to24HourString(period, hour, minute) });
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="루틴 추가">
      <ScrollView
        style={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <FieldLabel label="루틴 이름" tag="필수" required />
        <SheetInput
          value={name}
          onChangeText={setName}
          placeholder="예: 가벼운 스트레칭"
          maxLength={30}
          accessibilityLabel="루틴 이름"
        />

        <FieldLabel label="실행 시간" tag="필수" required style={styles.labelSpaced} />
        <SegmentedControl options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />

        <View style={styles.timeRow}>
          <TimeSelectBox
            value={hour}
            unit="시"
            open={openPicker === 'hour'}
            onPress={() => togglePicker('hour')}
          />
          <TimeSelectBox
            value={minute}
            unit="분"
            open={openPicker === 'minute'}
            onPress={() => togglePicker('minute')}
          />
        </View>

        {openPicker ? (
          <View style={styles.grid}>
            {(openPicker === 'hour' ? HOURS : MINUTES).map((n) => {
              const selected = n === (openPicker === 'hour' ? hour : minute);
              return (
                <Pressable
                  key={n}
                  onPress={() => {
                    if (openPicker === 'hour') setHour(n);
                    else setMinute(n);
                    setOpenPicker(null);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.pill,
                    selected && styles.pillSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{pad(n)}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      <Text style={styles.helper}>매일 반복되며, 시간순으로 목록에 담겨요.</Text>
      <PrimaryButton label="추가하기" onPress={handleSubmit} />
    </BottomSheet>
  );
}

// "08 시 ⌄" 모양의 시간 선택 칸
function TimeSelectBox({ value, unit, open, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${unit} 선택`}
      style={({ pressed }) => [styles.timeBox, open && styles.timeBoxOpen, pressed && styles.pressed]}
    >
      <View style={styles.timeValueRow}>
        <Text style={styles.timeValue}>{pad(value)}</Text>
        <Text style={styles.timeUnit}>{unit}</Text>
      </View>
      <Ionicons
        name={open ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={colors.textSecondary}
      />
    </Pressable>
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
  timeRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 12,
  },
  timeBox: {
    flex: 1,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.cardBg,
  },
  timeBoxOpen: {
    borderColor: colors.green,
  },
  pressed: {
    opacity: 0.85,
  },
  timeValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeValue: {
    fontFamily: fonts.medium,
    fontSize: 22,
    color: colors.textPrimary,
  },
  timeUnit: {
    marginLeft: 10,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },
  grid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  pill: {
    width: '23.5%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.cardBg,
  },
  pillSelected: {
    backgroundColor: colors.green,
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.textPrimary,
  },
  pillTextSelected: {
    color: colors.white,
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
