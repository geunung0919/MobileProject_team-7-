import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import ManualEntryScreen from '../screens/ManualEntryScreen';
import FridgeAddScreen from '../screens/FridgeAddScreen';
import RecipeListScreen from '../screens/RecipeListScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import TodoScreen from '../screens/TodoScreen';
import RoutineScreen from '../screens/RoutineScreen';
import ReceiptResultScreen from '../screens/ReceiptResultScreen';
import SpendingAnalysisScreen from '../screens/SpendingAnalysisScreen';
import SpendingDetailScreen from '../screens/SpendingDetailScreen';
import SpendingAllScreen from '../screens/SpendingAllScreen';
import EmergencyDetailScreen from '../screens/EmergencyDetailScreen';
import AiManagerScreen from '../screens/AiManagerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HelpScreen from '../screens/HelpScreen';

const Stack = createNativeStackNavigator();

// 최상위 스택. 탭 바가 없는 화면(상세, 입력 화면 등)은 여기에 추가합니다.
// 사용 예: navigation.navigate('ManualEntry')
export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="ManualEntry" component={ManualEntryScreen} />
      <Stack.Screen name="FridgeAdd" component={FridgeAddScreen} />
      {/* AI 레시피 추천 (냉장고 탭의 버튼에서 진입) */}
      <Stack.Screen name="RecipeList" component={RecipeListScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="Todo" component={TodoScreen} />
      <Stack.Screen name="Routine" component={RoutineScreen} />
      {/* 영수증 인식 결과. 카메라 화면이 완성되면 navigate('ReceiptResult', { receipt }) 로 연결합니다. */}
      <Stack.Screen name="ReceiptResult" component={ReceiptResultScreen} />
      <Stack.Screen name="SpendingAnalysis" component={SpendingAnalysisScreen} />
      {/* 지출 상세(구매 품목). 사용 예: navigate('SpendingDetail', { id: transaction.id }) */}
      <Stack.Screen name="SpendingDetail" component={SpendingDetailScreen} />
      {/* 소비 전체보기 (모든 지출을 달별로). 소비 탭의 "전체보기" 에서 진입 */}
      <Stack.Screen name="SpendingAll" component={SpendingAllScreen} />
      {/* 비상매뉴얼 상황별 대처. 사용 예: navigate('EmergencyDetail', { id: 'fire', title: '화재·연기' }) */}
      <Stack.Screen name="EmergencyDetail" component={EmergencyDetailScreen} />
      <Stack.Screen name="AiManager" component={AiManagerScreen} />
      {/* 더보기 하위 화면 */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}