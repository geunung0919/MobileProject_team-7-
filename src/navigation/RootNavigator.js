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
import EmergencyAiScreen from '../screens/EmergencyAiScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import ReportListScreen from '../screens/ReportListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HelpScreen from '../screens/HelpScreen';

const Stack = createNativeStackNavigator();

// 탭 바가 없는 화면(상세, 입력 등)은 여기에 등록합니다.
export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="ManualEntry" component={ManualEntryScreen} />
      <Stack.Screen name="FridgeAdd" component={FridgeAddScreen} />
      <Stack.Screen name="RecipeList" component={RecipeListScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="Todo" component={TodoScreen} />
      <Stack.Screen name="Routine" component={RoutineScreen} />
      {/* 카메라 화면이 완성되면 navigate('ReceiptResult', { receipt }) 로 연결 */}
      <Stack.Screen name="ReceiptResult" component={ReceiptResultScreen} />
      <Stack.Screen name="SpendingAnalysis" component={SpendingAnalysisScreen} />
      {/* params: { id: 소비 내역 id } */}
      <Stack.Screen name="SpendingDetail" component={SpendingDetailScreen} />
      <Stack.Screen name="SpendingAll" component={SpendingAllScreen} />
      {/* params: { id, title } */}
      <Stack.Screen name="EmergencyDetail" component={EmergencyDetailScreen} />
      <Stack.Screen name="AiManager" component={AiManagerScreen} />
      <Stack.Screen name="EmergencyAi" component={EmergencyAiScreen} />
      {/* params: { reportId } (없으면 이번 달 리포트) */}
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="ReportList" component={ReportListScreen} />
      {/* 더보기 하위 화면 */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}
