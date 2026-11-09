import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Linking, StyleSheet } from 'react-native';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../store/AuthContext';
import { colors, fonts, spacing } from '../theme';

// 회원 탈퇴 (AC-11): Google 재인증(비밀번호 다시 입력) 후에만 탈퇴를 확정합니다. 앱 비밀번호는 따로 없습니다.
// 진행 단계와 결과를 화면에 보여 주고, 끝나면 기기의 로그인 정보도 지웁니다.
const DELETED = ['닉네임·거주 지역', '30초 자취 진단 결과', '가계부·냉장고·할 일·루틴 데이터', '알림 설정', '모든 기기의 로그인'];

export default function WithdrawalScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { session, startWithdrawal, confirmWithdrawal, finishWithdrawal } = useAuth();
  const [step, setStep] = useState('intro'); // intro | waiting | done | error
  const [message, setMessage] = useState('');
  const active = useRef(true);
  useEffect(() => () => { active.current = false; }, []);
  const googleAccount = !!session?.userId?.startsWith('google:');

  const run = async () => {
    setStep('waiting'); setMessage('브라우저에서 Google 계정 비밀번호를 다시 입력해 주세요. 인증이 끝나면 앱으로 돌아오세요.');
    try {
      const started = await startWithdrawal();
      await Linking.openURL(started.authorization_url);
      const deadline = Date.now() + 300000;
      while (active.current && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (!active.current) return;
        const result = await confirmWithdrawal(started.state, started.secret);
        if (result.status === 'deleted') { setStep('done'); setMessage(result.message); return; }
        if (result.status === 'failed') throw new Error(result.message);
      }
      throw new Error('재인증 시간이 지났어요. 처음부터 다시 시도해 주세요.');
    } catch (e) {
      if (active.current) { setStep('error'); setMessage(`탈퇴하지 않았어요. ${e.message}`); }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: spacing.screenX, paddingBottom: 24 }}>
        {step !== 'done' && <BackHeader title="회원 탈퇴" subtitle="탈퇴하면 되돌릴 수 없어요." onBack={() => navigation.goBack()} />}
        {step === 'done' && <Text style={styles.title}>탈퇴 완료</Text>}

        {step === 'intro' && (
          <View>
            <Text style={styles.body}>탈퇴하면 아래 정보를 서버에서 바로 삭제해요.</Text>
            {DELETED.map((item) => <Text key={item} style={styles.item}>· {item}</Text>)}
            <Text style={styles.body}>본인 확인을 위해 Google 로그인 화면에서 비밀번호를 다시 입력해야 해요.</Text>
            {!googleAccount && (
              <Text style={[styles.body, { color: colors.warnText }]}>
                지금은 {session?.demo ? '시연 모드' : '개발 계정'}라서 탈퇴 대상이 아니에요. Google 계정으로 로그인했을 때만 탈퇴할 수 있어요.
              </Text>
            )}
          </View>
        )}
        {step !== 'intro' && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
        {step === 'waiting' && <Text style={styles.item}>진행 중: Google 재인증 확인 → 계정·데이터 삭제</Text>}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {step === 'intro' && googleAccount && <PrimaryButton label="Google로 다시 인증하고 탈퇴" onPress={run} />}
        {step === 'error' && <PrimaryButton label="다시 시도" onPress={run} />}
        {step === 'done' && <PrimaryButton label="확인" onPress={finishWithdrawal} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  footer: { paddingHorizontal: spacing.screenX, paddingTop: 12 },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.textPrimary, marginTop: 12 },
  body: { marginTop: 20, fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.textPrimary },
  item: { marginTop: 8, fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary },
});
