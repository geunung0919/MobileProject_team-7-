import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, Pressable, Linking, StyleSheet } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { request } from '../services/client';
export default function LoginScreen() {
  const { login } = useAuth();
  const [base, setBase] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const active = useRef(true);
  useEffect(() => () => { active.current = false; }, []);
  const run = async (fn) => { setBusy(true); setMessage(''); try { await fn(); } catch(e) { if(active.current) setMessage(e.message); } finally { if(active.current) setBusy(false); } };
  const google = async () => {
    if (!/^https:\/\//.test(base.trim())) throw new Error('Google 로그인은 공개 HTTPS 서버 주소를 입력해 주세요.');
    const data = await request(base.trim(), '', '/api/v1/auth/google/start', 'POST');
    await Linking.openURL(data.authorization_url);
    setMessage('브라우저에서 Google 로그인 후 앱으로 돌아오세요.');
    const deadline = Date.now() + 300000;
    while (active.current && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 1800));
      if (!active.current) return;
      const result = await request(base.trim(), '', '/api/v1/auth/google/poll', 'POST', { state: data.state, secret: data.secret });
      if (result.status === 'failed') throw new Error('로그인이 취소되었어요. 다시 시도하세요.');
      if (result.status === 'complete') {
        await login({ base: base.trim(), token: result.access_token, userId: result.user_id, email: result.email, name: result.name }); return;
      }
    }
    throw new Error('로그인 시간이 만료되었습니다.');
  };
  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>자취메이트</Text><Text style={styles.copy}>나에게 맞는 자취 생활을 시작해요</Text>
    <Text>서버 주소</Text><TextInput style={styles.input} value={base} onChangeText={setBase} autoCapitalize="none" placeholder="https://서버주소" />
    <Pressable disabled={busy} style={styles.button} onPress={() => run(google)}><Text style={styles.white}>Google 계정으로 로그인</Text></Pressable>
    <Text accessibilityLiveRegion="polite" style={styles.copy}>{message}</Text>
    {busy && <Text>로그인 확인 중… 브라우저를 닫고 앱으로 돌아와 주세요.</Text>}
    <TextInput style={styles.input} value={token} onChangeText={setToken} secureTextEntry placeholder="팀 개발 토큰 (선택)" autoCapitalize="none" />
    <Pressable disabled={busy} style={styles.button} onPress={() => run(() => login({base: base.trim(), token, userId: 'developer'}))}><Text style={styles.white}>개발 서버 연결</Text></Pressable>
    <Pressable disabled={busy} style={styles.input} onPress={() => run(() => login({demo:true, userId:'demo'}))}><Text>서버 없이 UI·온보딩 시연</Text></Pressable>
    <Text>시연 데이터와 실제 계정 데이터는 분리됩니다. OCR 분석은 서버 연결이 필요해요.</Text>
  </ScrollView>;
}
export const styles = StyleSheet.create({page:{padding:24,paddingTop:70,gap:16,backgroundColor:'#F7FAF8',flexGrow:1},title:{fontSize:30,fontWeight:'700',color:'#145E50'},copy:{fontSize:16,lineHeight:25},input:{borderWidth:1,borderColor:'#CBD8D1',borderRadius:14,padding:16,backgroundColor:'white'},button:{backgroundColor:'#145E50',padding:18,borderRadius:18,alignItems:'center'},white:{color:'white',fontWeight:'700',fontSize:16}});
