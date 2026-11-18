import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import ChoiceGrid from './ChoiceGrid';
import OptionCard from './OptionCard';
import ToolTile from './ToolTile';
import StepperField from './StepperField';
import FormField from './FormField';
import { lifeDataForm } from '../data/more/lifeData';
import { formatNumber } from '../utils/format';
import { colors, fonts } from '../theme';

// 프로필 설정과 "더보기 > 생활 데이터 수정"이 함께 쓰는 입력 묶음입니다.
// 같은 컴포넌트를 쓰기 때문에 두 화면의 모양과 선택지가 항상 똑같이 보입니다.
// 모든 필드는 marginTop(위쪽 간격, 기본 32)을 받습니다.

function Section({ label, hint, marginTop = 32, children }) {
  return (
    <View style={{ marginTop }}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

// 자취 기간 (value: periods 의 id)
export function PeriodField({ value, onChange, marginTop }) {
  const d = lifeDataForm;
  return (
    <Section label={d.monthsLabel} marginTop={marginTop}>
      <ChoiceGrid options={d.periods} value={value} onChange={onChange} />
    </Section>
  );
}

// 가장 중요한 목표 (value: goals 의 id, 하나만 선택)
export function GoalField({ value, onChange, marginTop }) {
  const d = lifeDataForm;
  return (
    <Section label={d.goalLabel} hint={d.goalHint} marginTop={marginTop}>
      <View style={styles.stack}>
        {d.goals.map((g) => (
          <OptionCard
            key={g.id}
            icon={g.icon}
            title={g.title}
            description={g.description}
            selected={value === g.id}
            onPress={() => onChange(g.id)}
          />
        ))}
      </View>
    </Section>
  );
}

// 조리 도구 (value: 도구 id 목록, "없음"이면 ['none'], 아무것도 안 골랐으면 [])
// "없음"을 고르면 다른 도구가 모두 해제되고, 도구를 고르면 "없음"이 해제됩니다.
export function ToolsField({ value, onChange, marginTop }) {
  const d = lifeDataForm;
  const toggleTool = (id) => {
    const base = value.filter((t) => t !== 'none');
    onChange(base.includes(id) ? base.filter((t) => t !== id) : [...base, id]);
  };
  const toggleNone = () => onChange(value.includes('none') ? [] : ['none']);

  const rows = [];
  for (let i = 0; i < d.tools.length; i += 2) rows.push(d.tools.slice(i, i + 2));

  return (
    <Section label={d.toolsLabel} hint={d.toolsHint} marginTop={marginTop}>
      <View style={styles.stack}>
        {rows.map((row, i) => (
          <View key={i} style={styles.toolRow}>
            {row.map((t) => (
              <ToolTile
                key={t.id}
                icon={t.icon}
                label={t.label}
                selected={value.includes(t.id)}
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
          selected={value.includes('none')}
          onPress={toggleNone}
        />
      </View>
    </Section>
  );
}

// 일주일 요리 일수 (value: 0~7)
export function CookDaysField({ value, onChange, marginTop }) {
  const d = lifeDataForm;
  return (
    <Section label={d.cookDaysLabel} marginTop={marginTop}>
      <StepperField
        label="요리 일수"
        value={value}
        onChange={onChange}
        min={0}
        max={7}
        format={(v) => `주 ${v}일`}
      />
      <Text style={styles.centerHint}>{d.cookDaysHint}</Text>
    </Section>
  );
}

// 월 예산 (value: 원 단위 숫자). 숫자만 입력되고 천 단위 쉼표가 붙습니다.
export function BudgetField({ value, onChange, marginTop = 32 }) {
  const d = lifeDataForm;
  return (
    <View>
      <FormField
        label={d.budgetLabel}
        value={value ? formatNumber(value) : ''}
        onChangeText={(text) => onChange(Number(text.replace(/[^0-9]/g, '').slice(0, 9)) || 0)}
        placeholder="0"
        keyboardType="number-pad"
        suffix="원"
        marginTop={marginTop}
      />
      <View style={styles.chips}>
        {d.budgetPresets.map((amount) => {
          const selected = value === amount;
          return (
            <Pressable
              key={amount}
              onPress={() => onChange(amount)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {amount / 10000}만원
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.hint, { marginTop: 10, marginBottom: 0 }]}>{d.budgetHint}</Text>
    </View>
  );
}

// 거주 지역 (value: 글자)
export function RegionField({ value, onChange, marginTop = 32 }) {
  const d = lifeDataForm;
  return (
    <FormField
      label={d.regionLabel}
      value={value}
      onChangeText={onChange}
      placeholder={d.regionPlaceholder}
      hint={d.regionHint}
      marginTop={marginTop}
    />
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 12,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
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
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.tabActiveBg,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    fontFamily: fonts.bold,
    color: colors.green,
  },
});
