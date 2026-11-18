import React, { useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Text from '../components/AppText';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import { useAppData } from '../store/AppDataContext';
import { authData } from '../data/auth/auth';
import { showNotice } from '../utils/confirm';
import { colors, fonts, spacing } from '../theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 회원가입. 지금은 형식만 확인하고 통과합니다. (실제 가입은 handleSubmit 에서 연결)
export default function SignUpScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { updateProfile } = useAppData();
  const d = authData.signUp;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = () => {
    const problem = !EMAIL_PATTERN.test(email.trim())
      ? authData.invalidEmailNotice
      : password.length < authData.minPasswordLength
        ? authData.shortPasswordNotice
        : password !== confirm
          ? authData.mismatchNotice
          : null;
    if (problem) {
      showNotice('입력을 확인해 주세요', problem);
      return;
    }
    // TODO: 여기서 서버 회원가입을 호출하세요. 성공하면 아래 줄이 실행되면 됩니다.
    updateProfile({ email: email.trim() });
    // 가입이 끝나면 프로필 설정으로. 이전 화면들을 비워서 뒤로 가기로 첫 화면에 돌아오지 않게 함
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] }));
  };

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
        <BackHeader title={d.title} subtitle={d.subtitle} onBack={() => navigation.goBack()} />

        <FormField
          label={d.emailLabel}
          value={email}
          onChangeText={setEmail}
          placeholder={d.emailPlaceholder}
          keyboardType="email-address"
          inputProps={{ autoCapitalize: 'none', autoCorrect: false, autoComplete: 'email', textContentType: 'emailAddress' }}
          marginTop={4}
        />
        <FormField
          label={d.passwordLabel}
          value={password}
          onChangeText={setPassword}
          placeholder={d.passwordPlaceholder}
          hint={d.passwordHint}
          inputProps={{ secureTextEntry: true, autoCapitalize: 'none', autoCorrect: false, textContentType: 'newPassword' }}
        />
        <FormField
          label={d.confirmLabel}
          value={confirm}
          onChangeText={setConfirm}
          placeholder={d.confirmPlaceholder}
          inputProps={{
            secureTextEntry: true,
            autoCapitalize: 'none',
            autoCorrect: false,
            textContentType: 'newPassword',
            returnKeyType: 'done',
            onSubmitEditing: handleSubmit,
          }}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{d.switchText}</Text>
          <Pressable
            onPress={() => navigation.replace('Login')}
            hitSlop={10}
            accessibilityRole="button"
          >
            <Text style={styles.switchAction}>{d.switchAction}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton label={d.submitLabel} onPress={handleSubmit} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  switchRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  switchText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  switchAction: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.green,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: spacing.screenX,
    backgroundColor: colors.background,
  },
});
