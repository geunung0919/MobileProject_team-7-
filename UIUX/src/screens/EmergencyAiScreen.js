
import React, { useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackHeader from '../components/BackHeader';
import IconBox from '../components/IconBox';

import {
  aiEmergencyData,
  getEmergencyReply,
} from '../data/lifeInfo/aiEmergency';

import { emergencyGuides } from '../data/lifeInfo/emergencyGuides';

import {
  askEmergency,
  isAiServerEnabled,
} from '../api/aiManager';

import { toEmergencyMessage } from '../api/aiFormat';
import { colors, fonts, spacing } from '../theme';

export default function EmergencyAiScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const {
    title,
    notice,
    greeting,
    inputPlaceholder,
    suggestionsLabel,
    suggestions,
    contacts,
  } = aiEmergencyData;

  const [messages, setMessages] = useState([
    {
      id: 'greeting',
      from: 'ai',
      text: greeting,
      steps: [],
      question: null,
    },
  ]);

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef(null);
  const timerRef = useRef(null);
  const nextId = useRef(1);
  const sendingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, []);

  // 메시지가 실제로 저장됐는지 확인하는 개발용 로그
  useEffect(() => {
    if (!__DEV__) return;

    console.log(
      '[비상매뉴얼 메시지 목록]',
      messages.map((message) => ({
        id: message.id,
        from: message.from,
        text: String(message.text ?? '').slice(0, 100),
      }))
    );
  }, [messages]);

  const scrollToBottom = (animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
    });
  };

  const appendMessage = (message) => {
    if (!mountedRef.current) return;

    setMessages((prev) => [...prev, message]);
  };

  const finishReply = (reply, question) => {
    if (!mountedRef.current) return;

    appendMessage({
      id: `a${nextId.current++}`,
      from: 'ai',
      text: String(reply?.text ?? '안내를 불러오지 못했어요.'),
      steps: Array.isArray(reply?.steps) ? reply.steps : [],
      call: reply?.call ?? null,
      detail: reply?.detail ?? null,
      question,
    });

    setTyping(false);
    sendingRef.current = false;

    console.log('[비상매뉴얼] 답변 표시 완료');
  };

  const send = (raw = input) => {
    const text = String(raw ?? '').trim();

    if (!text || sendingRef.current) return;

    sendingRef.current = true;

    // 이전 대화만 서버로 전달
    const before = messages.map((message) => ({
      ...message,
    }));

    // 사용자 질문을 AI 호출 전에 먼저 표시
    const userMessage = {
      id: `u${nextId.current++}`,
      from: 'user',
      text,
    };

    appendMessage(userMessage);

    console.log('[비상매뉴얼] 사용자 질문:', text);

    setInput('');
    setTyping(true);
    Keyboard.dismiss();

    // Firebase AI 서버 사용
    if (isAiServerEnabled) {
      const local = getEmergencyReply(text);

      askEmergency(text, before)
        .then((result) => {
          console.log('[비상매뉴얼] Firebase 응답 수신', {
            ai: result?.ai,
            reason: result?.reason,
            faq_ids: result?.faq_ids,
          });

          return toEmergencyMessage(
            result,
            local,
            aiEmergencyData.situations,
            emergencyGuides
          );
        })
        .catch((error) => {
          console.warn(
            '[비상매뉴얼] AI 호출 실패, 로컬 안내 사용:',
            error?.message
          );

          return local;
        })
        .then((reply) => {
          finishReply(reply, text);
        })
        .catch((error) => {
          console.error(
            '[비상매뉴얼] 답변 표시 실패:',
            error?.message
          );

          finishReply(
            {
              text: '현재 안내를 표시할 수 없어요. 다시 질문해 주세요.',
              steps: [],
            },
            text
          );
        });

      return;
    }

    // 서버 미사용 시 기존 로컬 안내
    timerRef.current = setTimeout(() => {
      const reply = getEmergencyReply(text);
      finishReply(reply, text);
    }, 700);
  };

  const handleCall = ({ number, label }) => {
    Alert.alert(`${number}에 전화할까요?`, label, [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '전화 걸기',
        onPress: async () => {
          try {
            await Linking.openURL(`tel:${number}`);
          } catch {
            Alert.alert(
              '전화 연결 실패',
              '이 기기에서 전화 기능을 사용할 수 없습니다.'
            );
          }
        },
      },
    ]);
  };

  const canSend = input.trim().length > 0 && !typing;
  const onlyGreeting = messages.length === 1;

  const renderMessage = (message) => {
    // 사용자 질문: 오른쪽 파란 말풍선
    if (message.from === 'user') {
      return (
        <View
          key={message.id}
          style={styles.userRow}
          testID={`emergency-user-${message.id}`}
        >
          <View style={styles.userBubble}>
            <Text style={styles.userText}>
              {message.text}
            </Text>
          </View>
        </View>
      );
    }

    // AI 답변: 왼쪽 말풍선
    return (
      <View
        key={message.id}
        style={styles.aiRow}
      >
        <IconBox
          name="shield-alert-outline"
          size={36}
          borderRadius={12}
          iconColor={colors.accent}
          backgroundColor={colors.badgeBg}
        />

        <View style={styles.aiCol}>
          {/* 기존 질문 말풍선이 화면 밖으로 나가도
              어떤 질문에 대한 답변인지 확인 가능 */}
          {message.question ? (
            <View style={styles.questionContext}>
              <Ionicons
                name="chatbubble-outline"
                size={13}
                color={colors.accent}
              />

              <Text style={styles.questionContextText}>
                내 질문: {message.question}
              </Text>
            </View>
          ) : null}

          <View style={styles.aiBubble}>
            <Text style={styles.aiText}>
              {message.text}
            </Text>
          </View>

          {message.call ? (
            <Pressable
              onPress={() => handleCall(message.call)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.callButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="call"
                size={18}
                color={colors.white}
              />

              <Text style={styles.callText}>
                {message.call.number} {message.call.label}
              </Text>
            </Pressable>
          ) : null}

          {Array.isArray(message.steps) &&
          message.steps.length > 0 ? (
            <View style={styles.stepCard}>
              {message.steps.map((step, index) => (
                <View
                  key={`${message.id}-step-${index}`}
                  style={[
                    styles.stepRow,
                    index > 0 && styles.stepRowNext,
                  ]}
                >
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>
                      {index + 1}
                    </Text>
                  </View>

                  <View style={styles.stepTexts}>
                    <Text style={styles.stepTitle}>
                      {step.title}
                    </Text>

                    <Text style={styles.stepBody}>
                      {step.body}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {message.detail ? (
            <Pressable
              onPress={() =>
                navigation.navigate(
                  'EmergencyDetail',
                  message.detail
                )
              }
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.detailChip,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.detailText}>
                {message.detail.title} 자세히 보기
              </Text>

              <Ionicons
                name="arrow-forward"
                size={16}
                color={colors.accent}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 상단 헤더 */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 14 },
        ]}
      >
        <BackHeader
          title={title}
          onBack={() => navigation.goBack()}
        />

        <Text style={styles.notice}>
          {notice}
        </Text>

        {/* 긴급 연락처 */}
        <View style={styles.contactRow}>
          {contacts.map((contact) => (
            <Pressable
              key={contact.number}
              onPress={() => handleCall(contact)}
              accessibilityRole="button"
              accessibilityLabel={
                `${contact.number} ${contact.label} 전화`
              }
              style={({ pressed }) => [
                styles.contactButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="call"
                size={16}
                color={colors.danger}
              />

              <Text style={styles.contactNumber}>
                {contact.number}
              </Text>

              <Text style={styles.contactLabel}>
                {contact.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 채팅 목록 */}
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => scrollToBottom()}
      >
        {messages.map(renderMessage)}

        {/* AI 답변 대기 */}
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
              <Text style={styles.typingText}>
                안내를 찾고 있어요…
              </Text>
            </View>
          </View>
        ) : null}

        {/* 추천 질문 */}
        {onlyGreeting ? (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsLabel}>
              {suggestionsLabel}
            </Text>

            <View style={styles.chipWrap}>
              {suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => send(suggestion)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.suggestChip,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.suggestText}>
                    {suggestion}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* 입력창 */}
      <View
        style={[
          styles.inputBar,
          {
            paddingBottom: Math.max(
              insets.bottom,
              12
            ),
          },
        ]}
      >
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
            editable={!typing}
          />
        </View>

        <Pressable
          onPress={() => send(input)}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="보내기"
          style={[
            styles.sendButton,
            !canSend && styles.sendDisabled,
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={24}
            color={colors.white}
          />
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
    flexGrow: 1,
    paddingHorizontal: spacing.screenX,
    paddingTop: 16,
    paddingBottom: 24,
  },

  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  aiCol: {
    flex: 1,
    marginLeft: 10,
    alignItems: 'flex-start',
    minWidth: 0,
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

  // AI 답변 위에 표시되는 원래 질문
  questionContext: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    gap: 6,
    marginBottom: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.badgeBg,
  },

  questionContextText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPrimary,
  },

  // 사용자 질문: 오른쪽 말풍선
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
    marginBottom: 14,
    minHeight: 40,
  },

  userBubble: {
    maxWidth: '82%',
    backgroundColor: '#2563EB',
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  userText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
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
