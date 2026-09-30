import { Stack } from 'expo-router';
import { SessionProvider } from '../state/Session';
export default function Layout(){return <SessionProvider><Stack screenOptions={{headerTintColor:'#166b55',headerTitle:'자취 생존 AI'}}><Stack.Screen name="index" options={{title:'개발 서버 연결'}}/><Stack.Screen name="spending" options={{title:'소비 관리',headerBackVisible:false}}/><Stack.Screen name="onboarding" options={{title:'생활 설정'}}/></Stack></SessionProvider>}
