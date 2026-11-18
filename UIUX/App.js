import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
} from '@expo-google-fonts/noto-sans-kr';
import { RoutineAlerts } from './src/features/routine/RoutineAlerts';
import RootNavigator from './src/navigation/RootNavigator';
import { AppDataProvider } from './src/store/AppDataContext';
import { colors } from './src/theme';
import { useAuth } from '../auth/AuthContext';

// 공유(Firebase) 모드: 로그인 상태에 따라 첫 화면을 정합니다. 인증 확인 중에는 빈 화면.
function StartByAuth() {
  const auth = useAuth();
  const first = React.useRef(null);
  if (!auth) return <RootNavigator />;
  if (first.current == null) {
    if (auth.stage === 'loading') return <View style={{ flex: 1, backgroundColor: colors.background }} />;
    first.current = auth.stage === 'app' ? 'Tabs' : auth.stage === 'onboarding' ? 'ProfileSetup' : 'Welcome';
  }
  return <RootNavigator initialRouteName={first.current} />;
}

export default function App({ sharedReceipts = false }) {
  const [fontsLoaded] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <SafeAreaProvider>
      <AppDataProvider sharedReceipts={sharedReceipts}>
        <RoutineAlerts>
        <NavigationContainer>
          <StatusBar style="dark" />
          {sharedReceipts ? <StartByAuth /> : <RootNavigator />}
        </NavigationContainer>
        </RoutineAlerts>
      </AppDataProvider>
    </SafeAreaProvider>
  );
}
