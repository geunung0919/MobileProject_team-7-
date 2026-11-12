import InventoryNotificationObserver from './integration/InventoryNotificationObserver';
import React from 'react';
import {useFonts,NotoSansKR_400Regular,NotoSansKR_500Medium,NotoSansKR_700Bold} from '@expo-google-fonts/noto-sans-kr';
import {View,ActivityIndicator,StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppProvider} from './module3/state/AppProvider';
import {AppDataProvider} from './src/store/AppDataContext';
import RootNavigator from './src/navigation/RootNavigator';
import {navigationRef,flushPendingNavigation} from './integration/router';
export default function App(){const [loaded,error]=useFonts({NotoSansKR_400Regular,NotoSansKR_500Medium,NotoSansKR_700Bold});if(!loaded&&!error)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'white'}}><ActivityIndicator color="#2F8A5B"/></View>;return <SafeAreaProvider><StatusBar barStyle="dark-content"/><AppProvider><AppDataProvider><NavigationContainer ref={navigationRef} onReady={flushPendingNavigation}><RootNavigator/><InventoryNotificationObserver/></NavigationContainer></AppDataProvider></AppProvider></SafeAreaProvider>;}
