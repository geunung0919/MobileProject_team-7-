import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import StepperField from '../components/StepperField';
import OptionCard from '../components/OptionCard';
import ToolTile from '../components/ToolTile';
import PrimaryButton from '../components/PrimaryButton';
import { useAppData } from '../store/AppDataContext';
import { lifeDataForm } from '../data/more/lifeData';
import { showNotice } from '../utils/confirm';
import { colors, fonts, spacing } from '../theme';

// 12 이상이면 "1년 3개월" 처럼 보여줍니다.
const formatMonths = (m) => {
  if (m < 12) return `${m}개월`;
  const y = Math.floor(m / 12);
  const rest = m % 12;
  return rest ? `${y}년 ${rest}개월` : `${y}년`;
};

// 더보기 > 생활 데이터 수정
export default function LifeDataScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { lifeData, updateLifeData } = useAppData();
  const d = lifeDataForm;

  const [months, setMonths] = useState(lifeData.months);
  const [goal, setGoal] = useState(lifeData.goal);
  const [tools, setTools] = useState(lifeData.tools); // 도구 id 목록, 없으면 ['none'], 아무것도 안 골랐으면 []
  const [cookDays, setCookDays] = useState(lifeData.cookDays);

  // "없음"을 고르면 다른 도구가 모두 해제되고, 도구를 고르면 "없음"이 해제됩니다.
  const toggleTool = (id) => {
    setTools((prev) => {
      const base = prev.filter((t) => t !== 'none');
      return base.includes(id) ? base.filter((t) => t !== id) : [...base, id];
    });
  };
  const toggleNone = () => setTools((prev) => (prev.includes('none') ? [] : ['none']));

  const handleSave = () => {
    if (tools.length === 0) {
      showNotice('입력을 확인해 주세요', d.toolsEmptyNotice);
      return;
    }
    updateLifeData({ months, goal, tools, cookDays });
    navigation.goBack();
  };

  // 조리 도구를 두 개씩 한 줄로 묶습니다.
  const toolRows = [];
  for (let i = 0; i < d.tools.length; i += 2) toolRows.push(d.tools.slice(i, i + 2));

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: spacing.screenX,
          paddingBottom: 24,
        }}
      >
        <BackHeader title={d.title} subtitle={d.subtitle} onBack={() => navigation.goBack()} />

        <Text style={[styles.label, styles.firstLabel]}>{d.monthsLabel}</Text>
        <StepperField
          label="자취 기간"
          value={months}
          onChange={setMonths}
          min={0}
          max={d.maxMonths}
          format={formatMonths}
        />

        <Text style={styles.label}>{d.goalLabel}</Text>
        <Text style={styles.hint}>{d.goalHint}</Text>
        <View style={styles.stack}>
          {d.goals.map((g) => (
            <OptionCard
              key={g.id}
              icon={g.icon}
              title={g.title}
              description={g.description}
              selected={goal === g.id}
              onPress={() => setGoal(g.id)}
            />
          ))}
        </View>

        <Text style={styles.label}>{d.toolsLabel}</Text>
        <Text style={styles.hint}>{d.toolsHint}</Text>
        <View style={styles.stack}>
          {toolRows.map((row, i) => (
            <View key={i} style={styles.toolRow}>
              {row.map((t) => (
                <ToolTile
                  key={t.id}
                  icon={t.icon}
                  label={t.label}
                  selected={tools.includes(t.id)}
                  onPress={() => toggleTool(t.id)}
                />
              ))}
            </View>
          ))}
          <OptionCard
            compact
            icon={d.noneTool.icon}
            title={d.noneTool.title}
            description={d.noneTool.description}
            selected={tools.includes('none')}
            onPress={toggleNone}
          />
        </View>

        <Text style={styles.label}>{d.cookDaysLabel}</Text>
        <StepperField
          label="요리 일수"
          value={cookDays}
          onChange={setCookDays}
          min={0}
          max={7}
          format={(v) => `주 ${v}일`}
        />
        <Text style={styles.centerHint}>{d.cookDaysHint}</Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton label={d.saveLabel} onPress={handleSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  label: {
    marginTop: 32,
    marginBottom: 12,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  firstLabel: {
    marginTop: 4,
  },
  hint: {
    marginTop: -6,
    marginBottom: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  centerHint: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  stack: {
    gap: 10,
  },
  toolRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: spacing.screenX,
    backgroundColor: colors.background,
  },
});
