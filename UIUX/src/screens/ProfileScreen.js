import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../../firebase/firebaseConfig';
import { loadProfile, saveProfile } from '../../../api/receiptApi';
import BackHeader from '../components/BackHeader';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import { useAppData } from '../store/AppDataContext';
import { profileData } from '../data/more/account';
import { colors, spacing } from '../theme';

// 더보기 > 개인정보 관리
export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, sharedReceipts, sharedUid } = useAppData();
  const d = profileData;
  const [nickname, setNickname] = useState(sharedReceipts ? '' : profile.nickname);
  const [region, setRegion] = useState(sharedReceipts ? '' : profile.region);
  const [loadedUid, setLoadedUid] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const canEdit = !sharedReceipts || (!!sharedUid && loadedUid === sharedUid);
  useEffect(() => {
    if (!sharedReceipts) return;
    let active = true;
    setLoadedUid(null);
    setNickname('');
    setRegion('');
    setMessage('');
    if (sharedUid) loadProfile(sharedUid).then(({ profile: row }) => {
      if (!active) return;
      setNickname(row?.nickname ?? '');
      setRegion(row?.region ?? '');
      setLoadedUid(sharedUid);
    }).catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [sharedReceipts, sharedUid]);

  const handleSave = async () => {
    if (busy || !canEdit) return;
    if (!nickname.trim()) {
      setMessage('닉네임을 입력해 주세요.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const values = { nickname: nickname.trim(), region: region.trim() };
      if (sharedReceipts) await saveProfile(values, sharedUid);
      else updateProfile(values);
      if ((!sharedReceipts || auth.currentUser?.uid === sharedUid) && navigation.isFocused()) navigation.goBack();
    } catch (error) {
      setMessage(error.message || '프로필을 저장하지 못했어요.');
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: spacing.screenX,
          paddingBottom: 24,
        }}
      >
        <BackHeader title={d.title} subtitle={d.subtitle} onBack={() => navigation.goBack()} />

        {message ? <Text accessibilityRole="alert">{message}</Text> : null}
        {sharedReceipts && !sharedUid ? <PrimaryButton label="로그인" onPress={() => navigation.navigate('SharedLogin')} /> : null}
        <FormField editable={canEdit && !busy} label={d.nicknameLabel} value={canEdit ? nickname : ''} onChangeText={setNickname} maxLength={12} />
        <FormField label={d.emailLabel} value={sharedReceipts ? (sharedUid && auth.currentUser?.uid === sharedUid ? auth.currentUser.email || '' : '') : profile.email} editable={false} hint={d.emailHint} />
        <FormField
          editable={canEdit && !busy}
          maxLength={100}
          label={d.regionLabel}
          value={canEdit ? region : ''}
          onChangeText={setRegion}
          placeholder={d.regionPlaceholder}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {canEdit ? <PrimaryButton label={busy ? '저장 중…' : d.saveLabel} onPress={handleSave} /> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  footer: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
  },
});
