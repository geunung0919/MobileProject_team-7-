import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Page,Card,Field,Button,styles,useTask } from '../components/UI';
import { useSession } from '../state/Session';
import { createApi,normalizeUrl } from '../lib/api';
export default function Connect(){
 const [url,setUrl]=useState(process.env.EXPO_PUBLIC_API_URL||''),[token,setToken]=useState('');
 const {setSession}=useSession(),{busy,error,run}=useTask();
 return <Page title="자취메이트 로그인"><Text style={styles.text}>서버 주소와 개발 토큰으로 로그인해요.</Text><Card><Field label="서버 주소" placeholder="http://192.168.0.10:8000" value={url} onChangeText={setUrl} editable={!busy} keyboardType="url"/><Field label="개발 토큰" value={token} onChangeText={setToken} secureTextEntry editable={!busy}/><Text style={styles.small}>휴대폰에서는 PC의 Wi-Fi IPv4 주소를 입력하세요. 토큰은 앱 메모리에만 보관해요.</Text><Button title={busy?'로그인 중…':'개발용 로그인'} disabled={busy} onPress={()=>run(async()=>{const api=createApi(url,token);const identity=await api('me/identity');if(!identity.user_id)throw new Error('서버의 사용자 정보를 확인하지 못했어요.');let target='/dashboard';try{await api('me/onboarding')}catch(e){if(e.status!==404)throw e;target='/onboarding'}setSession({url:normalizeUrl(url),token:token.trim(),userId:identity.user_id});router.replace(target==='/onboarding'?{pathname:target,params:{returnTo:'dashboard'}}:target)})}/>{!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}</Card></Page>
}
