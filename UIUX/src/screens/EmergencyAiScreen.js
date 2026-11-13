import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import IconBox from '../components/IconBox';
import { aiEmergencyData, getEmergencyReply } from '../data/lifeInfo/aiEmergency';
import { emergencyGuides } from '../data/lifeInfo/emergencyGuides';
import { askEmergency, isAiServerEnabled } from '../api/aiManager';
import { toEmergencyMessage } from '../api/aiFormat';
import { colors, fonts, spacing } from '../theme';

// 생활정보 > 비상매뉴얼 > AI 비상 매뉴얼 (AI 자취 매니저와는 별도의 채팅 화면)
export default function EmergencyAiScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { title, notice, greeting, inputPlaceholder, suggestionsLabel, suggestions, contacts } =
    aiEmergencyData;
  const [messages, setMessages] = useState([{ id: 'greeting', from: 'ai', text: greeting, steps: [] }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);
  const nextId = useRef(1);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const send = (raw) => {
    const text = raw.trim();
    if (!text || typing) return;
    const before = messages; // 서버에 보낼 이전 대화
    setMessages((prev) => [...prev, { id: `u${nextId.current++}`, from: 'user', text }]);
    setInput('');
    setTyping(true);

    // AI 서버가 설정돼 있으면 검증된 FAQ 기반 AI 답변 + 화면의 전화 버튼·'자세히 보기'.
    // 서버 호출이 실패하면 기존 안내(키워드로 찾은 대처 방법)를 그대로 보여 줍니다. 비상 상황이라 빈 답을 두지 않습니다.
    if (isAiServerEnabled) {
      const local = getEmergencyReply(text);
      askEmergency(text, before)
        .then((res) => toEmergencyMessage(res, local, aiEmergencyData.situations, emergencyGuides))
        .catch(() => local)
        .then((reply) => {
          setMessages((prev) => [...prev, { id: `a${nextId.current++}`, from: 'ai', ...reply }]);
          setTyping(false);
        });
      return;
    }

    timerRef.current = setTimeout(() => {
      const reply = getEmergencyReply(text);
      setMessages((prev) => [...prev, { id: `a${nextId.current++}`, from: 'ai', ...reply }]);
      setTyping(false);
    }, 700);
  };

  // 실수로 눌러 119/112 에 걸리지 않도록 한 번 확인합니다.
  const handleCall = ({ number, label }) => {
    Alert.alert(`${number}에 전화할까요?`, label, [
      { text: '취소', style: 'cancel' },
      { text: '전화 걸기', onPress: () => Linking.openURL(`tel:${number}`) },
    ]);
  };

  const canSend = input.trim().length > 0 && !typing;
  const onlyGreeting = messages.length === 1;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <BackHeader title={title} onBack={() => navigation.goBack()} />
        <Text style={styles.notice}>{notice}</Text>
        <View style={styles.contactRow}>
          {contacts.map((contact) => (
            <Pressable
              key={contact.number}
              onPress={() => handleCall(contact)}
              accessibilityRole="button"
              accessibilityLabel={`${contact.number} ${contact.label} 전화`}
              style={({ pressed }) => [styles.contactButton, pressed && styles.pressed]}
            >
              <Ionicons name="call" size={16} color={colors.danger} />
              <Text style={styles.contactNumber}>{contact.number}</Text>
              <Text style={styles.contactLabel}>{contact.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m) =>
          m.from === 'user' ? (
            <View key={m.id} style={styles.userRow}>
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{m.text}</Text>
              </View>
            </View>
          ) : (
            <View key={m.id} style={styles.aiRow}>
              <IconBox
                name="shield-alert-outline"
                size={36}
                borderRadius={12}
                iconColor={colors.accent}
                backgroundColor={colors.badgeBg}
              />
              <View style={styles.aiCol}>
                <View style={styles.aiBubble}>
                  <Text style={styles.aiText}>{m.text}</Text>
                </View>

                {m.call ? (
                  <Pressable
                    onPress={() => handleCall(m.call)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.callButton, pressed && styles.pressed]}
                  >
                    <Ionicons name="call" size={18} color={colors.white} />
                    <Text style={styles.callText}>
                      {m.call.number} {m.call.label}
                    </Text>
                  </Pressable>
                ) : null}

                {m.steps.length > 0 ? (
                  <View style={styles.stepCard}>
                    {m.steps.map((step, i) => (
                      <View key={step.title} style={[styles.stepRow, i > 0 && styles.stepRowNext]}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{i + 1}</Text>
                        </View>
                        <View style={styles.stepTexts}>
                          <Text style={styles.stepTitle}>{step.title}</Text>
                          <Text style={styles.stepBody}>{step.body}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                {m.detail ? (
                  <Pressable
                    onPress={() => navigation.navigate('EmergencyDetail', m.detail)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.detailChip, pressed && styles.pressed]}
                  >
                    <Text style={styles.detailText}>{m.detail.title} 자세히 보기</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.accent} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ),
        )}

        {typing ? (
          <View style={styles.aiRow}>
            <IconBox
              name="shield-alert-outline"
              size={36}
              borderRadius={12}
              iconColor={colors.accent}
              backgroundColor={colors.badgeBg}
            />
            <View style={[styles.aiBubble, styles.aiCol]}>
              <Text style={styles.typingText}>안내를 찾고 있어요…</Text>
            </View>
          </View>
        ) : null}

        {onlyGreeting ? (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsLabel}>{suggestionsLabel}</Text>
            <View style={styles.chipWrap}>
              {suggestions.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.suggestChip, pressed && styles.pressed]}
                >
                  <Text style={styles.suggestText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.inputBox}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={inputPlaceholder}
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
            accessibilityLabel="상황 입력"
          />
        </View>
        <Pressable
          onPress={() => send(input)}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="보내기"
          style={[styles.sendButton, !canSend && styles.sendDisabled]}
        >
          <Ionicons name="arrow-up" size={24} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: 10,
  },
  notice: {
    marginTop: -12,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  contactRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
  },
  contactNumber: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.danger,
  },
  contactLabel: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.75,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 16,
    paddingBottom: 16,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  aiCol: {
    flex: 1,
    marginLeft: 10,
    alignItems: 'flex-start',
  },
  aiBubble: {
    maxWidth: '92%',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderTopLeftRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  aiText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  typingText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  callButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.danger,
  },
  callText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.white,
  },
  stepCard: {
    alignSelf: 'stretch',
    marginTop: 8,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.white,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepRowNext: {
    marginTop: 14,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.accent,
  },
  stepTexts: {
    flex: 1,
    marginLeft: 12,
  },
  stepTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  stepBody: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  detailChip: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.tabActiveBg,
  },
  detailText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.accent,
  },
  userRow: {
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: colors.accent,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  },
  suggestions: {
    marginTop: 10,
  },
  suggestionsLabel: {
    marginBottom: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },
  suggestText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenX,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: colors.divider,
    backgroundColor: colors.white,
  },
  inputBox: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  input: {
    padding: 0,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 50,
    height: 50,
    marginLeft: 10,
    borderRadius: 25,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    backgroundColor: colors.checkboxBorder,
  },
});
