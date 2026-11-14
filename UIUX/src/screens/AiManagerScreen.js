
import React, { useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackHeader from '../components/BackHeader';
import IconBox from '../components/IconBox';

import {
  aiManagerData,
  getReply,
} from '../data/lifeInfo/aiManager';

// Firebase AI 서버 연결
import {
  sendChat,
  isAiServerEnabled,
} from '../api/aiManager';

import { colors, fonts, spacing } from '../theme';

// 생활정보 > AI 자취 매니저
export default function AiManagerScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const {
    title,
    notice,
    greeting,
    inputPlaceholder,
    suggestionsLabel,
    suggestions,
  } = aiManagerData;

  const [messages, setMessages] = useState([
    {
      id: 'greeting',
      from: 'ai',
      text: greeting,
    },
  ]);

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef(null);
  const timerRef = useRef(null);
  const nextId = useRef(1);
  const requestPending = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      clearTimeout(timerRef.current);
    };
  }, []);

  // AI 채팅 메시지 전송
  const send = async (raw) => {
    const text = raw.trim();

    if (!text || requestPending.current) {
      return;
    }

    requestPending.current = true;

    // 서버에 전달할 기존 대화 기록
    const history = messages;

    // 사용자 메시지 표시
    setMessages((prev) => [
      ...prev,
      {
        id: `u${nextId.current++}`,
        from: 'user',
        text,
      },
    ]);

    setInput('');
    setTyping(true);

    // Firebase AI 서버 호출
    if (isAiServerEnabled) {
      try {
        console.log('[AI 자취 매니저] 질문 전송:', text);

        const reply = await sendChat(text, history);

        console.log('[AI 자취 매니저] 서버 응답 성공');

        if (!mounted.current) return;

        setMessages((prev) => [
          ...prev,
          {
            id: `a${nextId.current++}`,
            from: 'ai',
            text: reply.text || '답변을 받지 못했어요.',
            action: reply.action || null,
          },
        ]);
      } catch (error) {
        console.error(
          '[AI 자취 매니저] Firebase 호출 실패:',
          error?.code || error?.message
        );

        if (!mounted.current) return;

        setMessages((prev) => [
          ...prev,
          {
            id: `a${nextId.current++}`,
            from: 'ai',
            text:
              '현재 AI 서버에서 답변을 받지 못했어요. ' +
              '잠시 후 다시 질문해 주세요.',
            action: null,
          },
        ]);
      } finally {
        requestPending.current = false;

        if (mounted.current) {
          setTyping(false);
        }
      }

      return;
    }

    // AI 서버 미설정 시에만 기존 키워드 기반 답변 사용
    timerRef.current = setTimeout(() => {
      const reply = getReply(text);

      if (mounted.current) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a${nextId.current++}`,
            from: 'ai',
            ...reply,
          },
        ]);

        setTyping(false);
      }

      requestPending.current = false;
    }, 700);
  };

  // 답변에 포함된 바로가기 처리
  const handleAction = (action) => {
    if (!action) return;

    if (action.tab) {
      navigation.navigate('Tabs', {
        screen: action.tab,
      });
    } else if (action.screen) {
      navigation.navigate(
        action.screen,
        action.params
      );
    }
  };

  const canSend = input.trim().length > 0 && !typing;
  const onlyGreeting = messages.length === 1;

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
      </View>

      {/* 채팅 메시지 */}
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({
            animated: true,
          })
        }
      >
        {messages.map((m) =>
          m.from === 'user' ? (
            <View key={m.id} style={styles.userRow}>
              <View style={styles.userBubble}>
                <Text style={styles.userText}>
                  {m.text}
                </Text>
              </View>
            </View>
          ) : (
            <View key={m.id} style={styles.aiRow}>
              <IconBox
                name="forum-outline"
                size={36}
                borderRadius={12}
                iconColor={colors.green}
                backgroundColor={colors.badgeBg}
              />

              <View style={styles.aiCol}>
                <View style={styles.aiBubble}>
                  <Text style={styles.aiText}>
                    {m.text}
                  </Text>
                </View>

                {m.action ? (
                  <Pressable
                    onPress={() =>
                      handleAction(m.action)
                    }
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.actionChip,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.actionText}>
                      {m.action.label}
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={colors.green}
                    />
                  </Pressable>
                ) : null}
              </View>
            </View>
          )
        )}

        {/* AI 답변 대기 */}
        {typing ? (
          <View style={styles.aiRow}>
            <IconBox
              name="forum-outline"
              size={36}
              borderRadius={12}
              iconColor={colors.green}
              backgroundColor={colors.badgeBg}
            />

            <View
              style={[
                styles.aiBubble,
                styles.aiCol,
              ]}
            >
              <Text style={styles.typingText}>
                답변을 준비하고 있어요…
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
              {suggestions.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.suggestChip,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.suggestText}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* 메시지 입력 */}
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
            accessibilityLabel="매니저에게 보낼 질문"
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
    paddingBottom: 4,
  },

  notice: {
    marginTop: -12,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
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

  actionChip: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.tabActiveBg,
  },

  actionText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.green,
  },

  userRow: {
    alignItems: 'flex-end',
    marginBottom: 14,
  },

  userBubble: {
    maxWidth: '82%',
    backgroundColor: colors.green,
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
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendDisabled: {
    backgroundColor: colors.checkboxBorder,
  },
});
