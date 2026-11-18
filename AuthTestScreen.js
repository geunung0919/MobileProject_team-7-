
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "./firebase/firebaseConfig";

const loginErrors = {
  "auth/invalid-credential": "이메일과 비밀번호를 다시 확인해 주세요.",
  "auth/user-not-found": "이메일과 비밀번호를 다시 확인해 주세요.",
  "auth/wrong-password": "이메일과 비밀번호를 다시 확인해 주세요.",
  "auth/invalid-email": "이메일 주소 형식을 확인해 주세요.",
  "auth/operation-not-allowed": "Firebase Authentication에서 이메일/비밀번호 로그인 방법을 켜 주세요.",
  "auth/network-request-failed": "Firebase에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.",
  "auth/too-many-requests": "로그인 시도가 너무 많아요. 잠시 뒤 다시 시도해 주세요.",
  "auth/user-disabled": "이 계정은 사용이 중지되어 있어요.",
};

function describeAuthError(error, fallback) {
  const code = typeof error?.code === "string" && /^auth\/[a-z0-9-]+$/.test(error.code) ? error.code : null;
  const message = (code && loginErrors[code]) || fallback;
  return code ? `${message} (${code})` : message;
}

export default function AuthTestScreen({ navigation, route }) {
  // 통합 앱(SharedLogin)에서는 실제 로그인 화면으로 쓰이므로 앱 디자인으로 보여 주고, 로그인되면 원래 화면으로 돌아갑니다.
  const shared = route?.name === "SharedLogin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    setErrorMessage("");
    if (!email.trim() || !password) {
      setErrorMessage("이메일과 비밀번호를 모두 입력해 주세요.");
      return;
    }
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword("");
      if (shared && navigation?.canGoBack?.()) navigation.goBack();
    } catch (error) {
      setErrorMessage(describeAuthError(error, "로그인하지 못했어요."));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setErrorMessage("");
    try {
      await signOut(auth);
    } catch (error) {
      setErrorMessage(describeAuthError(error, "로그아웃하지 못했어요."));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, shared && styles.sharedTitle]}>{shared ? "로그인" : "Firebase 로그인 테스트"}</Text>
      {shared ? <Text style={styles.subtitle}>로그인하면 소비·냉장고·루틴 기록이 내 계정에 저장돼요.</Text> : null}

      {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}

      {user ? (
        <>
          <Text>로그인 상태: 성공</Text>
          <Text>이메일: {user.email || "익명 사용자"}</Text>
          {shared ? (
            <TouchableOpacity style={[styles.button, styles.sharedButton]} onPress={() => navigation.navigate('SharedOnboarding')}>
              <Text style={styles.buttonText}>내 생활 설정</Text>
            </TouchableOpacity>
          ) : <Text>UID: {user.uid}</Text>}

          <TouchableOpacity style={[styles.button, shared && styles.sharedButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>로그아웃</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={[styles.input, shared && styles.sharedInput]}
            placeholder="이메일"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={[styles.input, shared && styles.sharedInput]}
            placeholder="비밀번호"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, shared && styles.sharedButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "로그인 중..." : "로그인"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {shared ? (
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>이전 화면으로 돌아가기</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  error: { color: "#b91c1c", marginVertical: 12 },
  sharedTitle: { color: "#1F3A30", marginBottom: 8 },
  subtitle: { color: "#7B817E", marginBottom: 24, lineHeight: 20 },
  sharedInput: { borderColor: "#E3E7E4", backgroundColor: "#F5F6F4", borderRadius: 14 },
  sharedButton: { backgroundColor: "#2F8A5B", borderRadius: 14 },
  backButton: { padding: 16, marginTop: 8, alignItems: "center" },
  backText: { color: "#2F8A5B", fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    marginBottom: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
