
import React from 'react';
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

// AI 상담 임시 화면
import EmergencyAIChatScreen from './UIUX/src/screens/EmergencyAIChatScreen';

const Stack = createNativeStackNavigator();

// 개발할 화면 선택
// 'emergency' 또는 'map'
const DEV_SCREEN = 'emergency';

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

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={
            DEV_SCREEN === 'map'
              ? 'SurvivalMap'
              : 'Emergency'
          }
          screenOptions={{
            headerShown: false,
          }}
        >
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

          {/* AI 상담 임시 화면 */}
          <Stack.Screen
            name="EmergencyAIChat"
            component={EmergencyAIChatScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
