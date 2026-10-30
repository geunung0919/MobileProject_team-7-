import React from 'react';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import ReminderObserver from '../components/ReminderObserver';
import {AppProvider} from '../state/AppProvider';
export default function Root(){return <AppProvider><StatusBar style="dark"/><ReminderObserver/><Stack screenOptions={{headerTintColor:'#217451'}}><Stack.Screen name="(tabs)" options={{headerShown:false}}/><Stack.Screen name="inventory/new" options={{title:'재고 등록'}}/><Stack.Screen name="inventory/[id]" options={{title:'재고 수정'}}/><Stack.Screen name="inventory/discard/[id]" options={{title:'일부 수량 폐기'}}/><Stack.Screen name="recipe/reminders" options={{title:'레시피 알림'}}/><Stack.Screen name="recipe/[id]" options={{title:'레시피 상세'}}/></Stack></AppProvider>;}
