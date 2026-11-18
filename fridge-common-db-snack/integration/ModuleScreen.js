import {useIsFocused} from '@react-navigation/native';
import React from 'react';
import {View,Text,Pressable} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Inventory from '../module3/app/(tabs)/inventory';
import Recipe from '../module3/app/(tabs)/recipe';
import Meal from '../module3/app/(tabs)/meal';
import Shopping from '../module3/app/(tabs)/shopping';
import New from '../module3/app/inventory/new';
import Edit from '../module3/app/inventory/[id]';
import Use from '../module3/app/inventory/use/[id]';
import Discard from '../module3/app/inventory/discard/[id]';
import History from '../module3/app/inventory/history';
import Alerts from '../module3/app/inventory/alerts';
import Detail from '../module3/app/recipe/[id]';
import Conditions from '../module3/app/recipe/conditions';
import Reminders from '../module3/app/recipe/reminders';
export default function ModuleScreen({route,navigation}){
 const focused=useIsFocused();
 const inset=useSafeAreaInsets(),p=route.params?.path||'/inventory/new';
 const Screen=p==='/inventory/new'?New:p==='/inventory/manage'?Inventory:p==='/inventory/history'?History:p==='/inventory/alerts'?Alerts:p.startsWith('/inventory/use/')?Use:p.startsWith('/inventory/discard/')?Discard:p.startsWith('/inventory/')?Edit:p==='/(tabs)/recipe'?Recipe:p==='/(tabs)/meal'?Meal:p==='/(tabs)/shopping'?Shopping:p==='/recipe/conditions'?Conditions:p==='/recipe/reminders'?Reminders:Detail;
 return <View style={{flex:1,paddingTop:inset.top,paddingBottom:inset.bottom,backgroundColor:'white'}}><Pressable accessibilityRole="button" onPress={()=>navigation.goBack()} style={{padding:16,borderBottomWidth:1,borderColor:'#edf1ee'}}><Text style={{fontSize:17,color:'#217451'}}>‹ 냉장고 · 뒤로</Text></Pressable>{focused&&<Screen key={p+JSON.stringify(route.params)}/>}</View>;
}
