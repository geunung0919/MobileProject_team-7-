import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, Pressable, Linking, Switch, View, StyleSheet } from 'react-native';
import Text from '../components/AppText';
import { useAuth } from '../store/AuthContext';
import { request } from '../services/client';
import { loadRecentAccount, saveRecentAccount, clearRecentAccount, maskEmail } from '../services/recentAccount';
import AuthField from '../components/AuthField';
import SignupScreen from './SignupScreen';
import { signInWithId } from '../services/firebaseAccount';
import { normalizeLoginId, authErrorMessage } from '../utils/authRules';
export default function LoginScreen() {
  const [mode, setMode] = useState('login'); // login | signup
  if (mode === 'signup') return <SignupScreen onBack={() => setMode('login')} />;
  return <LoginForm onSignup={() => setMode('signup')} />;
}

// 아이디·비밀번호 로그인. 틀리면 입력 칸 바로 아래에 오류를 보여 주고(인라인 에러), 아이디와 비밀번호 중 무엇이 틀렸는지는 알려 주지 않습니다.
function IdLogin({ disabled, onSignup }) {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const edit = (setter) => (value) => { setter(value); setErrors({}); };
  const submit = async () => {
    const id = normalizeLoginId(loginId);
    const found = { loginId: loginId.trim() ? '' : '아이디를 입력해 주세요.', password: password ? '' : '비밀번호를 입력해 주세요.' };
    // 아이디 형식이 틀려도 "없는 아이디"라고 따로 알리지 않고 로그인 실패와 같은 문구를 씁니다.
    if (!found.loginId && !id.id) found.password = authErrorMessage('auth/invalid-credential').message;
    if (found.loginId || found.password) { setErrors(found); return; }
    setBusy(true);
    try {
      await login(await signInWithId({ loginId: id.id, password }));
    } catch (e) {
      const { field, message } = authErrorMessage(e.code);
      setErrors({ [field === 'loginId' ? 'loginId' : 'password']: message });
    } finally { setBusy(false); }
  };
  return <View>
    <AuthField testID="login-id" label="아이디" value={loginId} onChangeText={edit(setLoginId)} placeholder="아이디" error={errors.loginId}
      autoComplete="username" textContentType="username" maxLength={20} />
    <AuthField testID="login-password" label="비밀번호" value={password} onChangeText={edit(setPassword)} placeholder="비밀번호" error={errors.password}
      secure autoComplete="current-password" textContentType="password" maxLength={64} />
    <Pressable testID="login-submit" disabled={disabled || busy} style={[styles.button, {marginTop:20}]} onPress={submit} accessibilityRole="button">
      <Text style={styles.white}>{busy ? '로그인 중…' : '로그인'}</Text>
    </Pressable>
    <Pressable testID="go-signup" onPress={onSignup} accessibilityRole="button" style={{alignItems:'center',paddingVertical:12}}>
      <Text>계정이 없나요? <Text style={{fontWeight:'700',textDecorationLine:'underline'}}>회원가입</Text></Text>
    </Pressable>
  </View>;
}

function LoginForm({ onSignup }) {
  const { login, restoreError, canRetryRestore, retryRestore } = useAuth();
  const [base, setBase] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(restoreError || '');
  const active = useRef(true);
  useEffect(() => () => { active.current = false; }, []);
  // AC-04: 동의한 경우에만 마스킹한 최근 로그인 이메일을 보여 줌. 표시만으로는 로그인되지 않음.
  const [recent, setRecent] = useState({ enabled: false, masked: '' });
  useEffect(() => { loadRecentAccount().then((value) => { if (active.current) setRecent(value); }); }, []);
  const toggleRecent = async (enabled) => {
    const next = enabled ? { ...recent, enabled } : { enabled: false, masked: '' };
    setRecent(next); await saveRecentAccount(next);
  };
  const forgetRecent = async () => { await clearRecentAccount(recent.enabled); setRecent({ ...recent, masked: '' }); };
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
        if (recent.enabled) await saveRecentAccount({ enabled: true, masked: maskEmail(result.email) });
        await login({ base: base.trim(), token: result.access_token, userId: result.user_id, email: result.email, name: result.name }); return;
      }
    }
    throw new Error('로그인 시간이 만료되었습니다.');
  };
  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>자취메이트</Text><Text style={styles.copy}>나에게 맞는 자취 생활을 시작해요</Text>
    <IdLogin disabled={busy} onSignup={onSignup} />
    <Text style={{color:'#5F6F68', textAlign:'center'}}>또는</Text>
    <Text>서버 주소</Text><TextInput style={styles.input} value={base} onChangeText={setBase} autoCapitalize="none" placeholder="https://서버주소" />
    {recent.enabled && recent.masked ? (
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
        <Text>최근 로그인: {recent.masked}</Text>
        <Pressable accessibilityRole="button" onPress={forgetRecent}><Text style={{textDecorationLine:'underline'}}>기록 지우기</Text></Pressable>
      </View>
    ) : null}
    <Pressable disabled={busy} style={styles.button} onPress={() => run(google)}><Text style={styles.white}>Google 계정으로 로그인</Text></Pressable>
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
      <Text style={{flex:1}}>이 기기에 최근 로그인 계정 표시 (이메일 일부만 저장)</Text>
      <Switch value={recent.enabled} onValueChange={toggleRecent} accessibilityLabel="최근 로그인 계정 표시" />
    </View>
    <Text style={{color:'#5F6F68'}}>계정 선택과 인증은 항상 Google 로그인 화면에서 해요.</Text>
    <Text accessibilityLiveRegion="polite" style={styles.copy}>{message}</Text>
    {canRetryRestore && <Pressable disabled={busy} style={styles.input} onPress={retryRestore}><Text>저장된 로그인으로 다시 시도</Text></Pressable>}
    {busy && <Text>로그인 확인 중… 브라우저를 닫고 앱으로 돌아와 주세요.</Text>}
    <TextInput style={styles.input} value={token} onChangeText={setToken} secureTextEntry placeholder="팀 개발 토큰 (선택)" autoCapitalize="none" />
    <Pressable disabled={busy} style={styles.button} onPress={() => run(() => login({base: base.trim(), token, userId: 'developer'}))}><Text style={styles.white}>개발 서버 연결</Text></Pressable>
    <Pressable disabled={busy} style={styles.input} onPress={() => run(() => login({demo:true, userId:'demo'}))}><Text>서버 없이 UI·온보딩 시연</Text></Pressable>
    <Text>시연 데이터와 실제 계정 데이터는 분리됩니다. OCR 분석은 서버 연결이 필요해요.</Text>
  </ScrollView>;
}
export const styles = StyleSheet.create({page:{padding:24,paddingTop:70,gap:16,backgroundColor:'#F7FAF8',flexGrow:1},title:{fontSize:30,fontWeight:'700',color:'#145E50'},copy:{fontSize:16,lineHeight:25},input:{borderWidth:1,borderColor:'#CBD8D1',borderRadius:14,padding:16,backgroundColor:'white'},button:{backgroundColor:'#145E50',padding:18,borderRadius:18,alignItems:'center'},white:{color:'white',fontWeight:'700',fontSize:16}});
