
import React from 'react';
import './firebase/firebaseConfig';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import {
  useFonts,
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
} from '@expo-google-fonts/noto-sans-kr';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 기존 화면
import SurvivalMapScreen from './UIUX/src/screens/SurvivalMapScreen';
import EmergencyScreen from './UIUX/src/screens/EmergencyScreen';
import EmergencyDetailScreen from './UIUX/src/screens/EmergencyDetailScreen';
import EmergencyAIChatScreen from './UIUX/src/screens/EmergencyAIChatScreen';

// Firebase 로그인 테스트 화면
import AuthTestScreen from './AuthTestScreen';

const Stack = createNativeStackNavigator();

// 개발 화면 선택: 'auth', 'map', 'emergency'
const DEV_SCREEN = 'auth';

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
        }}
      />
    );
  }

  const initialScreen =
    DEV_SCREEN === 'auth'
      ? 'AuthTest'
      : DEV_SCREEN === 'map'
      ? 'SurvivalMap'
      : 'Emergency';

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialScreen}
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Firebase 인증 테스트 */}
          <Stack.Screen
            name="AuthTest"
            component={AuthTestScreen}
          />

          {/* 지도 화면 */}
          <Stack.Screen
            name="SurvivalMap"
            component={SurvivalMapScreen}
          />

          {/* 생활안전 메인 화면 */}
          <Stack.Screen
            name="Emergency"
            component={EmergencyScreen}
          />

          {/* 생활안전 상세 화면 */}
          <Stack.Screen
            name="EmergencyDetail"
            component={EmergencyDetailScreen}
          />

          {/* AI 상담 화면 */}
          <Stack.Screen
            name="EmergencyAIChat"
            component={EmergencyAIChatScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
