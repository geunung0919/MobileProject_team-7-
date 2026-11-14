
import React, { useState } from 'react';
import { router } from 'expo-router';

import EmergencyScreen from '../../../UIUX/src/screens/EmergencyScreen';
import EmergencyDetailScreen from '../../../UIUX/src/screens/EmergencyDetailScreen';
import EmergencyAiScreen from '../../../UIUX/src/screens/EmergencyAiScreen';

export default function EmergencyRoute() {
  const [screen, setScreen] = useState('Emergency');
  const [params, setParams] = useState({});

  const navigation = {
    canGoBack: () => true,

    goBack: () => {
      if (screen === 'Emergency') {
        router.back();
      } else {
        setScreen('Emergency');
      }
    },

    navigate: (name, nextParams = {}) => {
      if (name === 'LifeInfo') {
        router.replace('/home');
        return;
      }

      if (
        name === 'EmergencyDetail' ||
        name === 'EmergencyAi'
      ) {
        setParams(nextParams);
        setScreen(name);
      }
    },
  };

  if (screen === 'EmergencyDetail') {
    return (
      <EmergencyDetailScreen
        navigation={navigation}
        route={{ params }}
      />
    );
  }

  if (screen === 'EmergencyAi') {
    return <EmergencyAiScreen navigation={navigation} />;
  }

  return <EmergencyScreen navigation={navigation} />;
}
