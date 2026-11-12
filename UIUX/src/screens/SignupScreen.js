import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import Text from '../components/AppText';
import AuthField from '../components/AuthField';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import BirthDatePicker from '../components/BirthDatePicker';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../store/AuthContext';
import { signUpWithId } from '../services/firebaseAccount';
import {
  normalizeLoginId, validatePassword, validateBirthDate, authErrorMessage, PASSWORD_MIN, MIN_AGE,
} from '../utils/authRules';
import { colors, fonts, spacing } from '../theme';

// 아이디·비밀번호 회원가입. 아이디는 로그인용이고, 닉네임은 가입 후 프로필 화면에서 따로 정합니다.
// - 비밀번호: 입력하는 동안 강도를 보여 주고, '보통' 이상이어야 가입할 수 있습니다.
// - 생년월일: 연도·월·일을 고르는 시트(BirthDatePicker). 만 14세 이상만 가입할 수 있습니다.
// - 오류: 각 칸 바로 아래에 보여 줍니다(인라인 에러). 칸을 떠날 때와 가입하기를 누를 때 검사합니다.
const pretty = (v) => (v ? v.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_, y, m, d) => `${y}년 ${Number(m)}월 ${Number(d)}일`) : '');

export default function SignupScreen({ onBack }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ loginId: '', password: '', confirm: '', birthDate: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = useRef(true);
  useEffect(() => () => { active.current = false; }, []);

  const check = (f) => ({
    loginId: normalizeLoginId(f.loginId).message,
    password: validatePassword(f.password, normalizeLoginId(f.loginId).id),
    confirm: !f.confirm ? '비밀번호를 한 번 더 입력해 주세요.' : f.confirm !== f.password ? '비밀번호가 서로 달라요.' : '',
    birthDate: validateBirthDate(f.birthDate),
    form: '',
  });
  const set = (key) => (value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    // 이미 오류를 보여 준 칸은 고치는 동안 바로 다시 검사해서, 맞게 고치면 오류가 사라지게 합니다.
    const fresh = check(next);
    setErrors((prev) => {
      const out = { ...prev, form: '' };
      for (const k of ['loginId', 'password', 'confirm', 'birthDate']) if (touched[k] || prev[k]) out[k] = fresh[k];
      return out;
    });
  };
  const blur = (key) => () => { setTouched((t) => ({ ...t, [key]: true })); setErrors((e) => ({ ...e, [key]: check(form)[key] })); };

  const submit = async () => {
    const found = check(form);
    setTouched({ loginId: true, password: true, confirm: true, birthDate: true });
    setErrors(found);
    if (found.loginId || found.password || found.confirm || found.birthDate) return;
    setBusy(true);
    try {
      const session = await signUpWithId({ loginId: normalizeLoginId(form.loginId).id, password: form.password, birthDate: form.birthDate });
      await login(session); // 다음 화면: 닉네임·지역(프로필 만들기) → 30초 진단
    } catch (e) {
      const { field, message } = authErrorMessage(e.code);
      if (active.current) setErrors((prev) => ({ ...prev, [field]: message }));
    } finally {
      if (active.current) setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="로그인 화면으로 돌아가기" hitSlop={10}>
          <Text style={styles.back}>‹ 로그인으로</Text>
        </Pressable>
        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.copy}>아이디는 로그인할 때만 써요. 다른 사람에게 보이는 닉네임은 다음 단계에서 따로 정해요.</Text>

        <AuthField testID="signup-id" label="아이디" value={form.loginId} onChangeText={set('loginId')} onBlur={blur('loginId')}
          placeholder="영문 소문자로 시작, 4~20자" error={errors.loginId} hint="영문·숫자·밑줄(_)만 쓸 수 있어요." autoComplete="username"
          textContentType="username" maxLength={20} />

        <AuthField testID="signup-password" label="비밀번호" value={form.password} onChangeText={set('password')} onBlur={blur('password')}
          placeholder={`${PASSWORD_MIN}자 이상`} error={errors.password} secure autoComplete="new-password" textContentType="newPassword" maxLength={64}>
          <PasswordStrengthMeter password={form.password} loginId={normalizeLoginId(form.loginId).id} />
        </AuthField>

        <AuthField testID="signup-confirm" label="비밀번호 확인" value={form.confirm} onChangeText={set('confirm')} onBlur={blur('confirm')}
          placeholder="한 번 더 입력" error={errors.confirm} secure autoComplete="new-password" textContentType="newPassword" maxLength={64} />

        <AuthField testID="signup-birth" label="생년월일" value={pretty(form.birthDate)} placeholder="눌러서 선택"
          error={errors.birthDate} hint={`만 ${MIN_AGE}세 이상부터 가입할 수 있어요.`} onPress={() => setPicker(true)} />

        {errors.form ? <Text style={styles.formError} accessibilityRole="alert" accessibilityLiveRegion="polite">{errors.form}</Text> : null}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label={busy ? '가입하는 중…' : '가입하기'} onPress={busy ? undefined : submit} />
      </View>
      <BirthDatePicker
        visible={picker}
        value={form.birthDate}
        onClose={() => setPicker(false)}
        onConfirm={(value) => {
          setPicker(false);
          setForm((f) => ({ ...f, birthDate: value }));
          setTouched((t) => ({ ...t, birthDate: true }));
          setErrors((e) => ({ ...e, birthDate: validateBirthDate(value), form: '' }));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  page: { paddingHorizontal: spacing.screenX, paddingTop: 60, paddingBottom: 32 },
  back: { fontFamily: fonts.medium, fontSize: 16, color: colors.green },
  title: { marginTop: 16, fontFamily: fonts.bold, fontSize: 28, color: colors.textPrimary },
  copy: { marginTop: 8, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  formError: { marginTop: 20, fontFamily: fonts.medium, fontSize: 15, color: colors.danger },
  footer: { paddingHorizontal: spacing.screenX, paddingTop: 12, paddingBottom: 28 },
});
