
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
  "auth/invalid-credential": "solo-living-ai에 등록한 테스트 계정 이메일과 비밀번호를 다시 확인해 주세요.",
  "auth/user-not-found": "solo-living-ai에 등록한 테스트 계정 이메일과 비밀번호를 다시 확인해 주세요.",
  "auth/wrong-password": "solo-living-ai에 등록한 테스트 계정 이메일과 비밀번호를 다시 확인해 주세요.",
  "auth/invalid-email": "이메일 주소 형식을 확인해 주세요.",
  "auth/operation-not-allowed": "Firebase Authentication에서 이메일/비밀번호 로그인 방법을 켜 주세요.",
  "auth/network-request-failed": "Firebase에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.",
  "auth/too-many-requests": "로그인 시도가 너무 많아요. 잠시 뒤 다시 시도해 주세요.",
  "auth/user-disabled": "이 테스트 계정이 비활성화되어 있어요.",
};

function describeAuthError(error, fallback) {
  const code = typeof error?.code === "string" && /^auth\/[a-z0-9-]+$/.test(error.code) ? error.code : null;
  const message = (code && loginErrors[code]) || fallback;
  return code ? `${message} (${code})` : message;
}

export default function AuthTestScreen({ navigation, route }) {
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
      <Text style={styles.title}>Firebase 로그인 테스트</Text>

      {route?.name === "SharedLogin" ? (
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>소비 화면으로 돌아가기</Text>
        </TouchableOpacity>
      ) : null}

      {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}

      {user ? (
        <>
          <Text>로그인 상태: 성공</Text>
          <Text>이메일: {user.email || "익명 사용자"}</Text>
          <Text>UID: {user.uid}</Text>

          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>로그아웃</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="이메일"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "로그인 중..." : "로그인"}
            </Text>
          </TouchableOpacity>
        </>
      )}
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
