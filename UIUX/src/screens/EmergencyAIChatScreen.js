
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EmergencyAIChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
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
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#222222"
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          AI 생활안전 상담
        </Text>
      </View>

      {/* AI 상담 준비 화면 */}
      <View style={styles.content}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={60}
          color="#4A90E2"
        />

        <Text style={styles.title}>
          AI 상담 기능 준비 중
        </Text>

        <Text style={styles.description}>
          생활안전과 재난 상황에 대해
          {'\n'}
          AI에게 질문할 수 있는 기능을
          {'\n'}
          준비하고 있어요.
        </Text>

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#666666"
          />

          <Text style={styles.noticeText}>
            위급한 상황에서는 AI 상담을 기다리지 말고
            119 또는 112에 신고하세요.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  backButton: {
    marginRight: 16,
    padding: 4,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  title: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
  },

  description: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 25,
    textAlign: 'center',
    color: '#666666',
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    gap: 10,
  },

  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#666666',
  },
});
