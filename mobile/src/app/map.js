
import React from 'react';
import { router } from 'expo-router';

import SurvivalMapScreen from '../../../UIUX/src/screens/SurvivalMapScreen';

export default function MapScreen() {
  const navigation = {
    canGoBack: () => router.canGoBack(),
    goBack: () => router.back(),
    navigate: (screen) => {
      if (screen === 'LifeInfo') {
        router.replace('/home');
      }
    },
  };

  return <SurvivalMapScreen navigation={navigation} />;
}
