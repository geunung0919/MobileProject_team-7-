
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { askEmergencyManual } from '../../../api/aiApi';

// 미리 선택할 수 있는 질문
const EXAMPLE_QUESTIONS = [
  '집에서 갑자기 물이 새요',
  '가스 냄새가 나면 어떻게 하나요?',
  '화재가 발생하면 어떻게 대피하나요?',
  '정전이 발생했어요',
];

const INITIAL_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    '안녕하세요! 생활안전 도우미입니다.\n\n' +
    '집에서 발생할 수 있는 안전 문제나 재난 상황에 대해 질문해 주세요.\n\n' +
    '위급한 상황이라면 AI 답변을 기다리지 말고 119 또는 112에 신고하세요.',
};

export default function EmergencyAIChatScreen({
  navigation,
}) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const requestIdRef = useRef(0);
  const sendingRef = useRef(false);

  const [messages, setMessages] = useState([
    INITIAL_MESSAGE,
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  const sendMessage = async (questionText = input) => {
    const question = String(questionText ?? '').trim();

    if (!question || sendingRef.current) {
      return;
    }

    sendingRef.current = true;
    setLoading(true);
    setErrorMessage('');
    setInput('');
    Keyboard.dismiss();

    // 서버에 전달할 이전 대화
    // 최초 안내 메시지는 제외
    const history = messages
      .filter((item) => item.id !== 'welcome')
      .map((item) => ({
        role: item.role,
        content: item.content,
      }))
      .slice(-10);

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    const requestId = ++requestIdRef.current;

    try {
      const result = await askEmergencyManual(
        question,
        history
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      const aiMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        safety: result.safety,
        ai: result.ai,
      };

      setMessages((prev) => [
        ...prev,
        aiMessage,
      ]);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setErrorMessage(
        error?.message ||
        '답변을 가져오지 못했습니다.'
      );
    } finally {
      if (requestId === requestIdRef.current) {
        sendingRef.current = false;
        setLoading(false);
      }
    }
  };

  const renderMessage = (message) => {
    const isUser = message.role === 'user';

    return (
      <View
        key={message.id}
        style={[
          styles.messageRow,
          isUser
            ? styles.userMessageRow
            : styles.aiMessageRow,
        ]}
      >
        {!isUser && (
          <View style={styles.avatar}>
            <Ionicons
              name="sparkles"
              size={17}
              color="#2563EB"
            />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser
              ? styles.userBubble
              : styles.aiBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser && styles.userMessageText,
            ]}
          >
            {message.content}
          </Text>

          {!isUser && message.safety && (
            <View style={styles.safetyLabel}>
              <Ionicons
                name="warning-outline"
                size={14}
                color="#B45309"
              />
              <Text style={styles.safetyLabelText}>
                안전 우선 안내
              </Text>
            </View>
          )}
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
          { paddingTop: insets.top + 12 },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#1F2937"
          />
        </Pressable>

        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>
            AI 생활안전 상담
          </Text>
          <Text style={styles.headerSubtitle}>
            상황별 대처 방법 안내
          </Text>
        </View>

        <Ionicons
          name="shield-checkmark-outline"
          size={24}
          color="#2563EB"
        />
      </View>

      {/* 긴급 안내 */}
      <View style={styles.warningBanner}>
        <Ionicons
          name="warning-outline"
          size={19}
          color="#B45309"
        />
        <Text style={styles.warningText}>
          위급한 상황에서는 AI 답변을 기다리지 말고
          119 또는 112에 신고하세요.
        </Text>
      </View>

      {/* 대화 영역 */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          scrollRef.current?.scrollToEnd({
            animated: true,
          });
        }}
      >
        {messages.map(renderMessage)}

        {messages.length === 1 && (
          <View style={styles.examples}>
            <Text style={styles.exampleTitle}>
              이런 질문을 할 수 있어요
            </Text>

            {EXAMPLE_QUESTIONS.map((question) => (
              <Pressable
                key={question}
                onPress={() => sendMessage(question)}
                disabled={loading}
                style={styles.exampleButton}
              >
                <Text style={styles.exampleText}>
                  {question}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#2563EB"
                />
              </Pressable>
            ))}
          </View>
        )}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator
              size="small"
              color="#2563EB"
            />
            <Text style={styles.loadingText}>
              답변을 확인하고 있어요...
            </Text>
          </View>
        )}

        {Boolean(errorMessage) && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {errorMessage}
            </Text>

            <Pressable
              onPress={() => {
                setErrorMessage('');
                setInput(
                  messages[messages.length - 1]?.role ===
                    'user'
                    ? messages[messages.length - 1].content
                    : ''
                );
              }}
            >
              <Text style={styles.retryText}>
                질문 다시 입력하기
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* 메시지 입력 영역 */}
      <View
        style={[
          styles.inputContainer,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="생활안전 상황을 질문해 주세요..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={1000}
          editable={!loading}
          style={styles.input}
          accessibilityLabel="AI 상담 질문 입력"
        />

        <Pressable
          onPress={() => sendMessage()}
          disabled={loading || !input.trim()}
          accessibilityRole="button"
          accessibilityLabel="질문 전송"
          style={[
            styles.sendButton,
            (loading || !input.trim()) &&
              styles.sendButtonDisabled,
          ]}
        >
          <Ionicons
            name="send"
            size={19}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  backButton: {
    padding: 6,
    marginRight: 12,
  },

  headerTextWrap: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#111827',
  },

  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },

  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: '#92400E',
  },

  chatArea: {
    flex: 1,
  },

  chatContent: {
    padding: 16,
    paddingBottom: 28,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },

  userMessageRow: {
    justifyContent: 'flex-end',
  },

  aiMessageRow: {
    justifyContent: 'flex-start',
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  messageBubble: {
    maxWidth: '83%',
    padding: 13,
    borderRadius: 16,
  },

  userBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },

  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#1F2937',
  },

  userMessageText: {
    color: '#FFFFFF',
  },

  safetyLabel: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    marginTop: 10,
  },

  safetyLabelText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: 'bold',
  },

  examples: {
    marginTop: 10,
    marginLeft: 38,
  },

  exampleTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 10,
  },

  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 9,
  },

  exampleText: {
    flex: 1,
    fontSize: 13,
    color: '#2563EB',
    marginRight: 8,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginLeft: 38,
    marginTop: 5,
  },

  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },

  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },

  errorText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#B91C1C',
  },

  retryText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563EB',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },

  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'center',
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },

  sendButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
});
