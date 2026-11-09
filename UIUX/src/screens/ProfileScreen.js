import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Pressable, Platform, StyleSheet } from 'react-native';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import { useAppData } from '../store/AppDataContext';
import { useAuth } from '../store/AuthContext';
import { profileData } from '../data/more/account';
import { normalizeNickname } from '../utils/nickname';
import { searchRegions } from '../utils/regions';
import { colors, fonts, spacing } from '../theme';

// 더보기 > 개인정보 관리 (팀 UI 기반). setup=true 이면 첫 가입 프로필 설정 화면으로 씁니다 (AC-05).
// - 닉네임: 앱·서버 같은 규칙(AC-06), 입력이 멈추면 중복 확인, 저장 때 서버가 다시 유일성 보장(AC-07)
// - 거주 지역: GPS 없이 동 이름 검색 → 시도·시군구까지 붙은 이름에서 선택(AC-08), 법정동 코드로 저장(AC-09)
export default function ProfileScreen({ navigation, setup = false }) {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useAppData();
  const { session, member, checkNickname, saveMember } = useAuth();
  const d = profileData;
  const [nickname, setNickname] = useState(member?.nickname || '');
  const [region, setRegion] = useState(member?.region || null);
  const [query, setQuery] = useState('');
  const [check, setCheck] = useState(null); // { valid, available, message }
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const latest = useRef('');

  // 입력이 0.5초 멈추면 형식·중복 확인
  useEffect(() => {
    latest.current = nickname;
    if (!nickname.trim()) { setCheck(null); return undefined; }
    const local = normalizeNickname(nickname);
    if (!local.nickname) { setCheck({ valid: false, available: false, message: local.message }); return undefined; }
    if (member && local.nickname === member.nickname) { setCheck({ valid: true, available: true, message: '지금 쓰는 닉네임이에요.' }); return undefined; }
    setCheck({ valid: true, available: null, message: '중복 확인 중…' });
    const timer = setTimeout(async () => {
      try {
        const result = await checkNickname(nickname);
        if (latest.current === nickname) setCheck(result);
      } catch (e) {
        if (latest.current === nickname) setCheck({ valid: true, available: null, message: `중복 확인 실패: ${e.message} (저장할 때 다시 확인해요)` });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [nickname]);

  const results = query.trim() ? searchRegions(query) : [];

  const handleSave = async () => {
    setError(''); setNotice('');
    const local = normalizeNickname(nickname);
    if (!local.nickname) { setError(local.message); return; }
    if (check && check.available === false) { setError(check.message); return; }
    setBusy(true);
    try {
      const saved = await saveMember({ nickname: local.nickname, region_code: region?.code ?? null });
      updateProfile({ nickname: saved.nickname, region: saved.region?.label || '' });
      if (setup) return; // 첫 가입: 저장되면 다음 단계(30초 자취 진단)로 넘어갑니다.
      if (saved.region_changed) setNotice('거주 지역을 바꿨어요. 지역에 따른 정보는 이제 새 지역 기준으로 보여 드려요.');
      else navigation.goBack();
    } catch (e) {
      setError(e.status === 409 ? '이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해 주세요.' : e.message);
    } finally {
      setBusy(false);
    }
  };

  const checkColor = check?.available === false || check?.valid === false ? colors.warnText : colors.textSecondary;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: spacing.screenX, paddingBottom: 24 }}
      >
        {setup ? (
          <View>
            <Text style={styles.setupTitle}>프로필 만들기</Text>
            <Text style={styles.setupCopy}>앱에서 쓸 닉네임과 거주 지역을 정해 주세요. 성별·나이는 묻지 않아요.</Text>
          </View>
        ) : (
          <BackHeader title={d.title} subtitle={d.subtitle} onBack={() => navigation.goBack()} />
        )}

        <FormField label={d.nicknameLabel} value={nickname} onChangeText={setNickname} maxLength={20}
          placeholder="한글·영문·숫자 2~10자" />
        {check ? <Text accessibilityLiveRegion="polite" style={[styles.checkText, { color: checkColor }]}>{check.message}</Text> : null}

        {!setup && <FormField label={d.emailLabel} value={session?.email || profile.email} editable={false} hint={d.emailHint} />}

        <FormField label={d.regionLabel} value={query} onChangeText={setQuery}
          placeholder="동·읍·면 이름으로 검색 (예: 청운동)" hint="위치 권한 없이 이름으로 찾아요. 상세 주소는 받지 않아요." />
        {region ? (
          <View style={styles.selected}>
            <Text style={styles.selectedText}>선택: {region.label}</Text>
            <Pressable accessibilityRole="button" onPress={() => setRegion(null)}><Text style={styles.link}>선택 해제</Text></Pressable>
          </View>
        ) : (
          <Text style={styles.checkText}>지역을 고르지 않으면 '미설정'으로 저장돼요.</Text>
        )}
        {results.map((item) => (
          <Pressable key={item.code} accessibilityRole="button" accessibilityLabel={item.label}
            onPress={() => { setRegion(item); setQuery(''); }}
            style={({ pressed }) => [styles.resultRow, pressed && { opacity: 0.7 }]}>
            <Text style={styles.resultDong}>{item.dong}</Text>
            <Text style={styles.resultParent}>{[item.sido, item.sigungu].filter(Boolean).join(' ')}</Text>
          </Pressable>
        ))}
        {query.trim() && results.length === 0 ? <Text style={styles.checkText}>검색 결과가 없어요. 동·읍·면 이름을 확인해 주세요.</Text> : null}

        {error ? <Text accessibilityLiveRegion="assertive" style={[styles.checkText, { color: colors.warnText }]}>{error}</Text> : null}
        {notice ? <Text accessibilityLiveRegion="polite" style={styles.checkText}>{notice}</Text> : null}

        {!setup && (
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Withdrawal')} style={styles.withdrawRow}>
            <Text style={styles.withdrawText}>회원 탈퇴</Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton label={busy ? '저장 중…' : setup ? '저장하고 다음으로' : notice ? '확인' : d.saveLabel}
          onPress={notice ? () => navigation.goBack() : busy ? undefined : handleSave} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  footer: { paddingHorizontal: spacing.screenX, paddingTop: 12 },
  setupTitle: { fontFamily: fonts.bold, fontSize: 24, color: colors.textPrimary, marginTop: 12 },
  setupCopy: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, marginTop: 8 },
  checkText: { marginTop: 8, fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  selected: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedText: { fontFamily: fonts.medium, fontSize: 15, color: colors.green, flex: 1 },
  link: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary, textDecorationLine: 'underline' },
  resultRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  resultDong: { fontFamily: fonts.bold, fontSize: 16, color: colors.textPrimary },
  resultParent: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  withdrawRow: { marginTop: 40, alignSelf: 'flex-start', paddingVertical: 8 },
  withdrawText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, textDecorationLine: 'underline' },
});
