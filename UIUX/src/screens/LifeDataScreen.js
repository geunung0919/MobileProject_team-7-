import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import PrimaryButton from '../components/PrimaryButton';
import {
  PeriodField,
  GoalField,
  ToolsField,
  CookDaysField,
  BudgetField,
  RegionField,
} from '../components/LifeFields';
import { useAppData } from '../store/AppDataContext';
import { useAuth } from '../../../auth/AuthContext';
import { toProfile } from '../../../auth/uiMapping';
import { lifeDataForm } from '../data/more/lifeData';
import { showNotice } from '../utils/confirm';
import { colors, spacing } from '../theme';

// 더보기 > 생활 데이터 수정. 프로필 설정에서 입력한 값을 같은 모양으로 보여주고 고칠 수 있습니다.
// (닉네임은 "개인정보 관리"에서 고칩니다.)
export default function LifeDataScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { lifeData, updateLifeData, budget, setBudget, profile, updateProfile, sharedReceipts } = useAppData();
  const auth = useAuth();
  const d = lifeDataForm;

  const [period, setPeriod] = useState(lifeData.period);
  const [goal, setGoal] = useState(lifeData.goal);
  const [tools, setTools] = useState(lifeData.tools);
  const [cookDays, setCookDays] = useState(lifeData.cookDays);
  const [budgetInput, setBudgetInput] = useState(budget);
  const [region, setRegion] = useState(profile.region);

  const handleSave = () => {
    if (tools.length === 0) {
      showNotice('입력을 확인해 주세요', d.toolsEmptyNotice);
      return;
    }
    if (!budgetInput) {
      showNotice('입력을 확인해 주세요', d.budgetEmptyNotice);
      return;
    }
    if (sharedReceipts && auth?.stage === 'app') {
      auth.updateProfile(toProfile({ period, goal, tools, cookDays, budget: budgetInput }))
        .catch((e) => showNotice('저장하지 못했어요', e.message));
    }
    updateLifeData({ period, goal, tools, cookDays });
    setBudget(budgetInput);
    updateProfile({ region: region.trim() });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: spacing.screenX,
          paddingBottom: 24,
        }}
      >
        <BackHeader title={d.title} subtitle={d.subtitle} onBack={() => navigation.goBack()} />
        <PeriodField value={period} onChange={setPeriod} marginTop={4} />
        <GoalField value={goal} onChange={setGoal} />
        <ToolsField value={tools} onChange={setTools} />
        <CookDaysField value={cookDays} onChange={setCookDays} />
        <BudgetField value={budgetInput} onChange={setBudgetInput} />
        <RegionField value={region} onChange={setRegion} />
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
  footer: {
    paddingTop: 12,
    paddingHorizontal: spacing.screenX,
    backgroundColor: colors.background,
  },
});
