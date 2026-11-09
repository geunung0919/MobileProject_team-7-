import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import SummaryBanner from '../components/SummaryBanner';
import TodoRow from '../components/TodoRow';
import AddRoutineSheet from '../components/AddRoutineSheet';
import Fab from '../components/Fab';
import { routineData } from '../data/lifeInfo/routines';
import { useAppData } from '../store/AppDataContext';
import { formatRoutineTime } from '../utils/time';
import { colors, fonts, spacing } from '../theme';

export default function RoutineScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // 루틴 목록은 공용 저장소(AppDataContext)에 있어 화면을 나갔다 와도 유지되고 홈에도 반영됩니다.
  // TODO: 서버 연결은 store/AppDataContext.js 의 addRoutine / toggleRoutine 안에서 하세요.
  const { routines: items, addRoutine, toggleRoutine: toggleDone } = useAppData();
  const [addVisible, setAddVisible] = useState(false);

  // 이른 시간 순 ("HH:mm" 문자열은 그대로 비교해도 시간 순서가 맞습니다)
  const sorted = useMemo(() => [...items].sort((a, b) => a.time.localeCompare(b.time)), [items]);

  const doneCount = items.filter((i) => i.doneToday).length;
  const summaryTitle =
    items.length > 0 && doneCount === items.length
      ? '오늘 루틴을 모두 마쳤어요'
      : doneCount > 0
        ? `오늘은 ${doneCount}개를 완료했어요`
        : '오늘은 아직 완료한 루틴이 없어요';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: spacing.screenX,
        }}
      >
        <BackHeader title="생활 루틴 설정" onBack={() => navigation.goBack()} />

        <SummaryBanner
          label="매일 반복하는 나의 루틴"
          title={summaryTitle}
          description="작은 습관도 하나씩, 마치면 체크해 주세요."
        />

        <View style={styles.sectionRow}>
          <View style={styles.sectionLeft}>
            <Text style={styles.sectionTitle}>나의 루틴</Text>
            <Text style={styles.sectionCount}>{items.length}</Text>
          </View>
          <Text style={styles.sortText}>{routineData.sortLabel}</Text>
        </View>

        {sorted.length > 0 ? (
          sorted.map((item) => (
            <TodoRow
              key={item.id}
              title={item.title}
              subText={formatRoutineTime(item.time)}
              extraText={item.doneToday ? '오늘 완료' : undefined}
              done={item.doneToday}
              vertical={17}
              onToggle={() => toggleDone(item.id)}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>아직 루틴이 없어요. + 버튼으로 추가해 보세요.</Text>
        )}
      </ScrollView>

      <Fab hasTabBar={false} accessibilityLabel="루틴 추가" onPress={() => setAddVisible(true)} />

      <AddRoutineSheet
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onSubmit={addRoutine}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionRow: {
    marginTop: 14,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  sectionCount: {
    marginLeft: 8,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.green,
  },
  sortText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyText: {
    paddingVertical: 28,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
