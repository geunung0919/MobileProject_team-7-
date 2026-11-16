import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Alert, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import { useAppData } from '../store/AppDataContext';
import { profileData } from '../data/more/account';
import { colors, spacing } from '../theme';

// 더보기 > 개인정보 관리
export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useAppData();
  const d = profileData;
  const [nickname, setNickname] = useState(profile.nickname);
  const [region, setRegion] = useState(profile.region);

  const handleSave = () => {
    if (!nickname.trim()) {
      Alert.alert('입력을 확인해 주세요', '닉네임을 입력해 주세요.');
      return;
    }
    updateProfile({ nickname: nickname.trim(), region: region.trim() });
    navigation.goBack();
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

        <FormField label={d.nicknameLabel} value={nickname} onChangeText={setNickname} maxLength={12} />
        <FormField label={d.emailLabel} value={profile.email} editable={false} hint={d.emailHint} />
        <FormField
          label={d.regionLabel}
          value={region}
          onChangeText={setRegion}
          placeholder={d.regionPlaceholder}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton label={d.saveLabel} onPress={handleSave} />
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
