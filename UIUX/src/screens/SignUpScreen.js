
import React, { useState } from 'react';

import {
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

import Text from '../components/AppText';

import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebase/firebaseConfig';

import BackHeader from '../components/BackHeader';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';

import { useAppData } from '../store/AppDataContext';
import { authData } from '../data/auth/auth';
import { showNotice } from '../utils/confirm';
import { colors, fonts, spacing } from '../theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { updateProfile } = useAppData();
  const d = authData.signUp;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  // Firebase 회원가입
  const handleSubmit = async () => {
    if (loading) return;

    const signUpEmail = email.trim();

    const problem = !EMAIL_PATTERN.test(signUpEmail)
      ? authData.invalidEmailNotice
      : password.length < authData.minPasswordLength
        ? authData.shortPasswordNotice
        : password !== confirm
          ? authData.mismatchNotice
          : null;

    if (problem) {
      showNotice(
        '입력을 확인해 주세요',
        problem
      );
      return;
    }

    setLoading(true);

    try {
      // Firebase Authentication 계정 생성
      const credential = await createUserWithEmailAndPassword(
        auth,
        signUpEmail,
        password
      );

      // 생성된 계정의 ID 토큰 확인
      await credential.user.getIdToken(true);

      console.log('[Auth] 회원가입 성공');
      console.log('[Auth] UID:', credential.user.uid);

      updateProfile({
        email: credential.user.email,
      });

      setPassword('');
      setConfirm('');

      // 계정 생성 후 프로필 설정 화면 이동
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'ProfileSetup',
            },
          ],
        })
      );
    } catch (error) {
      console.error(
        '[Auth] 회원가입 실패:',
        error?.code || error?.message
      );

      let message = '회원가입에 실패했습니다.';

      switch (error?.code) {
        case 'auth/email-already-in-use':
          message =
            '이미 가입된 이메일입니다. 로그인해 주세요.';
          break;

        case 'auth/invalid-email':
          message =
            '이메일 주소 형식을 확인해 주세요.';
          break;

        case 'auth/weak-password':
          message =
            '비밀번호가 Firebase 보안 기준을 충족하지 않습니다.';
          break;

        case 'auth/operation-not-allowed':
          message =
            'Firebase에서 이메일 회원가입이 활성화되지 않았습니다.';
          break;

        case 'auth/network-request-failed':
          message =
            'Firebase 서버에 연결하지 못했습니다.';
          break;

        case 'auth/too-many-requests':
          message =
            '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
          break;

        default:
          message = `회원가입 오류: ${
            error?.code || 'unknown'
          }`;
      }

      showNotice('회원가입 실패', message);
    } finally {
      setLoading(false);
    }
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
        <BackHeader
          title={d.title}
          subtitle={d.subtitle}
          onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Login'))}
        />

        <FormField
          label={d.emailLabel}
          value={email}
          onChangeText={setEmail}
          placeholder={d.emailPlaceholder}
          keyboardType="email-address"
          inputProps={{
            autoCapitalize: 'none',
            autoCorrect: false,
            autoComplete: 'email',
            textContentType: 'emailAddress',
            editable: !loading,
          }}
          marginTop={4}
        />

        <FormField
          label={d.passwordLabel}
          value={password}
          onChangeText={setPassword}
          placeholder={d.passwordPlaceholder}
          hint={d.passwordHint}
          inputProps={{
            secureTextEntry: true,
            autoCapitalize: 'none',
            autoCorrect: false,
            textContentType: 'newPassword',
            editable: !loading,
          }}
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
            editable: !loading,
          }}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {d.switchText}
          </Text>

          <Pressable
            onPress={() => {
              if (!loading) {
                navigation.replace('Login');
              }
            }}
            disabled={loading}
            hitSlop={10}
            accessibilityRole="button"
          >
            <Text style={styles.switchAction}>
              {d.switchAction}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <PrimaryButton
          label={
            loading
              ? '가입 중...'
              : d.submitLabel
          }
          onPress={handleSubmit}
          style={loading ? styles.disabledButton : undefined}
        />
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

  disabledButton: {
    opacity: 0.6,
  },
});
