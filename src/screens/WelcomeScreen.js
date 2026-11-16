import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import { authData } from '../data/auth/auth';
import { colors, fonts, spacing } from '../theme';

// 앱을 처음 켜면 나오는 화면. 위쪽에 로고와 앱 이름, 아래쪽에 로그인 / 회원가입 버튼.
export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const logoSize = Math.min(300, width * 0.77);

  return (
    <View style={styles.container}>
      <View style={[styles.top, { paddingTop: insets.top + 56 }]}>
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
          accessibilityLabel="자취메이트 로고"
        />
        <Text style={[styles.name, { marginTop: -logoSize * 0.15 }]}>{authData.appName}</Text>
      </View>

      <View style={[styles.buttons, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}>
        <PrimaryButton label={authData.loginLabel} onPress={() => navigation.navigate('Login')} />
        <PrimaryButton
          label={authData.signUpLabel}
          variant="soft"
          onPress={() => navigation.navigate('SignUp')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  top: {
    flex: 1,
    alignItems: 'center',
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 34,
    color: colors.textPrimary,
  },
  buttons: {
    paddingHorizontal: spacing.screenX,
    gap: 12,
  },
});
