import React from 'react';
import { AuthProvider, useAuth } from './src/store/AuthContext';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
} from '@expo-google-fonts/noto-sans-kr';
import RootNavigator from './src/navigation/RootNavigator';
import { AppDataProvider } from './src/store/AppDataContext';
import { colors } from './src/theme';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 24 }}><ActivityIndicator /><Text>{fontError ? "글꼴을 불러오지 못했습니다. 네트워크 연결을 확인하고 다시 실행해 주세요." : "자취메이트 화면 준비 중…"}</Text></View>;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
      <AccountData>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AccountData>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AccountData({children}) {
  const {session} = useAuth();
  return <AppDataProvider key={session?.token || session?.userId || "guest"}>{children}</AppDataProvider>;
}
