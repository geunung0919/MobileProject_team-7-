
import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import AiManagerScreen from '../../../UIUX/src/screens/AiManagerScreen';
import { AppDataProvider } from '../../../UIUX/src/store/AppDataContext';

export default function AiManagerRoute() {
  const navigation = {
    goBack: () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/home');
      }
    },

    navigate: (screen, params = {}) => {
      if (screen === 'ReportDetail' || screen === 'ReportList') {
        Alert.alert(
          'AI 리포트',
          '리포트 화면을 통합한 후 이용할 수 있습니다.'
        );
        return;
      }

      if (screen === 'Tabs') {
        const routes = {
          Home: '/home',
          Spending: '/spending',
          Fridge: '/fridge',
          LifeInfo: '/home',
        };

        const target = routes[params.screen];

        if (target) {
          router.push(target);
        }
        return;
      }

      const routes = {
        Spending: '/spending',
        Fridge: '/fridge',
        Emergency: '/emergency',
        SurvivalMap: '/map',
        AiManager: '/ai-manager',
      };

      if (routes[screen]) {
        router.push(routes[screen]);
      } else {
        Alert.alert(
          '화면 연결 준비 중',
          '해당 기능은 아직 통합되지 않았습니다.'
        );
      }
    },
  };

  return (
    <AppDataProvider>
      <AiManagerScreen navigation={navigation} />
    </AppDataProvider>
  );
}
