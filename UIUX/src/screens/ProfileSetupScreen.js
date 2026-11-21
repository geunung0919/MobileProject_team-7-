import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform, BackHandler, StyleSheet } from 'react-native';
import Text from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../components/BackButton';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import IconBox from '../components/IconBox';
import {
  PeriodField,
  GoalField,
  ToolsField,
  CookDaysField,
  BudgetField,
  RegionField,
} from '../components/LifeFields';
import { useAppData } from '../store/AppDataContext';
import { saveProfile, saveOnboarding } from '../../../api/receiptApi';
import { profileSetupData as setup } from '../data/auth/profileSetup';
import { lifeDataForm } from '../data/more/lifeData';
import { getDiagnosis, formatBudget, periodLabel, goalTitle, toolsLabel } from '../utils/diagnosis';
import { showNotice } from '../utils/confirm';
import { colors, fonts, radius, spacing } from '../theme';

// 단계 번호: 1 닉네임 · 2 자취 상태 · 3 요리 환경 · 4 예산/지역 · 5 입력 확인 · 6 진단 결과
const REVIEW = 5;
const RESULT = 6;
const STEP_OF_SECTION = { nickname: 1, status: 2, cooking: 3, budgetRegion: 4 };

// 서버(생활 설정 API)가 받는 값으로 바꿉니다. 더보기 > 내 생활 설정 화면과 같은 저장소예요.
const SERVER_MONTHS = { under1m: 0, '1m': 1, '6m': 6, '1y': 12 };
const SERVER_GOAL = { saving: 'save_money', food: 'reduce_waste', habit: 'build_routine' };
const SERVER_TOOL = { microwave: 'microwave', gas: 'stove', cooker: 'rice_cooker', airfryer: 'air_fryer' };
const toServerOnboarding = ({ period, goal, tools, cookDays, budget }) => ({
  living_months: SERVER_MONTHS[period] ?? null,
  cooking_days_per_week: Number.isInteger(cookDays) ? cookDays : null,
  monthly_budget_krw: budget > 0 ? Math.round(budget) : null,
  priority: SERVER_GOAL[goal] ?? null,
  cooking_tools: [...new Set(tools.map((t) => SERVER_TOOL[t]).filter(Boolean))],
  initial_inventory_state: 'not_entered',
});

// 회원가입 후 나오는 프로필 설정. 끝에서 입력값을 저장소에 넣으면,
// 더보기 > 생활 데이터 수정 / 개인정보 관리 / 소비 예산에 같은 값이 보입니다.
export default function ProfileSetupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, lifeData, updateLifeData, budget: savedBudget, setBudget, sharedReceipts, sharedUid } = useAppData();
  const [saving, setSaving] = useState(false);

  const [step, setStep] = useState(1);
  const [editing, setEditing] = useState(false); // 확인 화면에서 "수정"을 눌러 들어온 상태

  const [nickname, setNickname] = useState(profile.nickname);
  const [period, setPeriod] = useState(lifeData.period);
  const [goal, setGoal] = useState(lifeData.goal);
  const [tools, setTools] = useState(lifeData.tools);
  const [cookDays, setCookDays] = useState(lifeData.cookDays);
  const [budget, setBudgetInput] = useState(savedBudget);
  const [region, setRegion] = useState(profile.region);

  const back = () => {
    if (step <= 1 || step >= RESULT) return;
    setStep(editing ? REVIEW : step - 1);
    setEditing(false);
  };

  // 안드로이드 뒤로 가기 버튼도 같은 동작. (웹에서는 BackHandler 가 오류를 내서 안드로이드에서만 연결)
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 1 && step < RESULT) {
        back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  });

  const problem = () => {
    if (step === 1 && !setup.nickname.pattern.test(nickname.trim())) return setup.nickname.invalidNotice;
    if (step === 3 && tools.length === 0) return lifeDataForm.toolsEmptyNotice;
    if (step === 4 && !budget) return lifeDataForm.budgetEmptyNotice;
    return null;
  };

  const next = async () => {
    if (saving) return;
    const msg = problem();
    if (msg) {
      showNotice('입력을 확인해 주세요', msg);
      return;
    }
    if (editing) {
      setEditing(false);
      setStep(REVIEW);
    } else if (step === REVIEW) {
      // 진단 결과를 보여주기 전에 입력값을 저장합니다. 로그인한 계정이면 서버에도 저장해
      // 새로고침하거나 다른 기기에서 들어와도 닉네임·예산·생활 설정이 남아 있게 해요.
      if (sharedReceipts && sharedUid) {
        setSaving(true);
        try {
          await saveProfile({ nickname: nickname.trim(), region: region.trim() }, sharedUid);
          await saveOnboarding(toServerOnboarding({ period, goal, tools, cookDays, budget }), sharedUid);
        } catch (error) {
          showNotice('저장하지 못했어요', `${error?.message || '네트워크를 확인해 주세요.'}\n다시 "진단 결과 보기"를 눌러 주세요.`);
          return;
        } finally {
          setSaving(false);
        }
      }
      updateProfile({ nickname: nickname.trim(), region: region.trim() });
      updateLifeData({ period, goal, tools, cookDays });
      setBudget(budget);
      setStep(RESULT);
    } else {
      setStep(step + 1);
    }
  };

  const edit = (section) => {
    setEditing(true);
    setStep(STEP_OF_SECTION[section]);
  };

  // 설정을 끝내고 앱으로 들어갑니다. to 가 있으면 그 화면을 바로 열어요.
  const finish = (to) => {
    const routes = [{ name: 'Tabs', params: to?.tab ? { screen: to.tab } : undefined }];
    if (to?.screen) routes.push({ name: to.screen });
    navigation.dispatch(CommonActions.reset({ index: routes.length - 1, routes }));
  };

  if (step === RESULT) {
    return (
      <ResultView
        insets={insets}
        nickname={nickname.trim()}
        diagnosis={getDiagnosis({ period, goal, tools, cookDays, budget })}
        onFinish={finish}
      />
    );
  }

  const titles = {
    1: setup.nickname,
    2: setup.status,
    3: setup.cooking,
    4: setup.budgetRegion,
    5: setup.review,
  }[step];
  const buttonLabel = editing
    ? setup.editDoneLabel
    : step === REVIEW
      ? setup.reviewButtonLabel
      : setup.nextLabel;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
        <View style={styles.topRow}>
          {step > 1 ? <BackButton onPress={back} /> : <View style={styles.backSpacer} />}
          <View style={styles.bar}>
            {Array.from({ length: setup.stepCount }, (_, i) => (
              <View key={i} style={[styles.seg, i < step && styles.segOn]} />
            ))}
          </View>
          <Text style={styles.stepText}>{`${step}/${setup.stepCount}`}</Text>
        </View>

        <Text style={styles.title}>{titles.title}</Text>
        <Text style={styles.subtitle}>{titles.subtitle}</Text>

        {step === 1 && (
          <FormField
            label={setup.nickname.label}
            value={nickname}
            onChangeText={setNickname}
            placeholder={setup.nickname.placeholder}
            hint={setup.nickname.hint}
            maxLength={setup.nickname.maxLength}
            suffix={`${nickname.length}/${setup.nickname.maxLength}`}
            marginTop={28}
          />
        )}
        {step === 2 && (
          <>
            <PeriodField value={period} onChange={setPeriod} marginTop={28} />
            <GoalField value={goal} onChange={setGoal} />
          </>
        )}
        {step === 3 && (
          <>
            <ToolsField value={tools} onChange={setTools} marginTop={28} />
            <CookDaysField value={cookDays} onChange={setCookDays} />
          </>
        )}
        {step === 4 && (
          <>
            <BudgetField value={budget} onChange={setBudgetInput} marginTop={28} />
            <RegionField value={region} onChange={setRegion} />
          </>
        )}
        {step === REVIEW && (
          <ReviewList
            onEdit={edit}
            values={{ nickname: nickname.trim(), period, goal, tools, cookDays, budget, region: region.trim() }}
          />
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton label={saving ? '저장 중…' : buttonLabel} onPress={next} />
      </View>
    </KeyboardAvoidingView>
  );
}

// 5단계: 입력한 내용을 항목별 카드로 보여주고, 카드마다 "수정"으로 해당 단계에 돌아갑니다.
function ReviewList({ values, onEdit }) {
  const r = setup.review;
  const sections = [
    { key: 'nickname', rows: [[r.rows.nickname, values.nickname]] },
    {
      key: 'status',
      rows: [
        [r.rows.period, periodLabel(values.period)],
        [r.rows.goal, goalTitle(values.goal)],
      ],
    },
    {
      key: 'cooking',
      rows: [
        [r.rows.tools, toolsLabel(values.tools)],
        [r.rows.cookDays, `주 ${values.cookDays}일`],
      ],
    },
    {
      key: 'budgetRegion',
      rows: [
        [r.rows.budget, formatBudget(values.budget)],
        [r.rows.region, values.region || r.emptyRegion],
      ],
    },
  ];
  return (
    <View style={{ marginTop: 16 }}>
      {sections.map((s) => (
        <View key={s.key} style={styles.reviewCard}>
          <View style={styles.reviewHead}>
            <Text style={styles.reviewTitle}>{r.sections[s.key]}</Text>
            <Pressable
              onPress={() => onEdit(s.key)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`${r.sections[s.key]} ${r.editLabel}`}
              style={styles.editButton}
            >
              <Text style={styles.editText}>{r.editLabel}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.green} />
            </Pressable>
          </View>
          {s.rows.map(([label, value]) => (
            <View key={label} style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>{label}</Text>
              <Text style={styles.reviewValue}>{value}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// 6단계: 진단 결과와 추천 기능 버튼
function ResultView({ insets, nickname, diagnosis, onFinish }) {
  const r = setup.result;
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 28,
          paddingHorizontal: spacing.screenX,
          paddingBottom: 24,
        }}
      >
        <Text style={styles.title}>{r.title(nickname)}</Text>
        <Text style={styles.subtitle}>{r.subtitle}</Text>

        <View style={styles.hero}>
          <View style={styles.heroHead}>
            <Text style={styles.heroLabel}>{r.typeLabel}</Text>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{r.badge}</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{diagnosis.type}</Text>
          <Text style={styles.heroDesc}>{diagnosis.description}</Text>
          <View style={styles.stats}>
            {diagnosis.stats.map((s) => (
              <View key={s.key} style={styles.stat}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.recTitle}>{r.recTitle}</Text>
        {diagnosis.recommendations.map((rec) => (
          <Pressable
            key={rec.title}
            onPress={() => onFinish(rec.to)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.rec, pressed && styles.pressed]}
          >
            <IconBox name={rec.icon} size={48} iconColor={colors.green} backgroundColor={colors.tabActiveBg} borderRadius={16} />
            <View style={styles.recTexts}>
              <Text style={styles.recName}>{rec.title}</Text>
              <Text style={styles.recDesc}>{rec.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.green} />
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton label={r.startLabel} onPress={() => onFinish(null)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
  },
  backSpacer: {
    width: 24,
  },
  bar: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 12,
  },
  seg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.divider,
  },
  segOn: {
    backgroundColor: colors.green,
  },
  stepText: {
    minWidth: 32,
    textAlign: 'right',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  title: {
    marginTop: 28,
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: spacing.screenX,
    backgroundColor: colors.background,
  },
  pressed: {
    opacity: 0.85,
  },

  reviewCard: {
    marginTop: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: colors.cardBg,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  editText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.green,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    gap: 16,
  },
  reviewLabel: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  reviewValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },

  hero: {
    marginTop: 22,
    backgroundColor: colors.heroBg,
    borderRadius: radius.card,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
  },
  heroHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.green,
  },
  heroBadge: {
    backgroundColor: colors.badgeBg,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  heroBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.green,
  },
  heroTitle: {
    marginTop: 10,
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  heroDesc: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statValue: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textPrimary,
  },

  recTitle: {
    marginTop: 28,
    marginBottom: 2,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  rec: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
  },
  recTexts: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  recName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  recDesc: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
