
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

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebase/firebaseConfig';

import BackHeader from '../components/BackHeader';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';

import { useAppData } from '../store/AppDataContext';
import { authData } from '../data/auth/auth';
import { showNotice } from '../utils/confirm';
import { colors, fonts, spacing } from '../theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { updateProfile } = useAppData();
  const d = authData.login;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Firebase 로그인
  const handleSubmit = async () => {
    if (loading) return;

    const loginEmail = email.trim();

    if (!EMAIL_PATTERN.test(loginEmail)) {
      showNotice(
        '입력을 확인해 주세요',
        authData.invalidEmailNotice
      );
      return;
    }

    if (!password) {
      showNotice(
        '입력을 확인해 주세요',
        authData.emptyPasswordNotice
      );
      return;
    }

    setLoading(true);

    try {
      // 실제 Firebase Authentication 로그인
      const credential = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        password
      );

      // 서버 API 인증에 사용할 ID 토큰 확인
      await credential.user.getIdToken(true);

      console.log('[Auth] 로그인 성공');
      console.log('[Auth] UID:', credential.user.uid);

      // 기존 UIUX 프로필에 이메일 반영
      updateProfile({
        email: credential.user.email,
      });

      setPassword('');

      // 로그인 성공 후 메인 홈 화면 이동
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Tabs',
            },
          ],
        })
      );
    } catch (error) {
      console.error(
        '[Auth] 로그인 실패:',
        error?.code || error?.message
      );

      let message = '로그인에 실패했습니다.';

      switch (error?.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          message = '이메일 또는 비밀번호를 확인해 주세요.';
          break;

        case 'auth/invalid-email':
          message = '올바른 이메일 주소를 입력해 주세요.';
          break;

        case 'auth/invalid-refresh-token':
        case 'auth/user-token-expired':
          message =
            '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.';
          break;

        case 'auth/network-request-failed':
          message =
            'Firebase 서버에 연결할 수 없습니다.';
          break;

        case 'auth/too-many-requests':
          message =
            '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.';
          break;

        case 'auth/user-disabled':
          message =
            '사용이 중지된 계정입니다.';
          break;

        default:
          message = `로그인 오류: ${
            error?.code || 'unknown'
          }`;
      }

      showNotice('로그인 실패', message);
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
          onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
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
          inputProps={{
            secureTextEntry: true,
            autoCapitalize: 'none',
            autoCorrect: false,
            autoComplete: 'password',
            textContentType: 'password',
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
                navigation.replace('SignUp');
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
              ? '로그인 중...'
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
