import React from 'react';import {Tabs} from 'expo-router';import {Text} from 'react-native';
const screens=[['index','홈','⌂'],['inventory','재고','▣'],['recipe','레시피','♧'],['meal','식사','◷'],['shopping','장보기','▤']];
export default function Layout(){return <Tabs screenOptions={{headerTitle:'냉장고 한 끼',tabBarActiveTintColor:'#217451',tabBarStyle:{height:65,paddingBottom:8}}}>{screens.map(([name,title,icon])=><Tabs.Screen key={name} name={name} options={{title,tabBarIcon:({color})=><Text style={{fontSize:23,color}}>{icon}</Text>}}/>)}</Tabs>;}
