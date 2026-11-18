import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';

// 단계별로 화면을 바꿔 주는 틀 (화면 자체는 UI 담당이 만들어 넘겨 줍니다).
//
//   <AuthGate screens={{ Login: 로그인화면, Onboarding: 온보딩화면, Loading: 로딩화면, Error: 오류화면 }}>
//     <앱 화면 />
//   </AuthGate>
//
// 로그인 화면이 아직 없으면(screens.Login 없음) 로그인 없이 바로 앱 화면을 보여 줍니다.
export default function AuthGate({ screens = {}, children }) {
  return (
    <AuthProvider>
      <Gate screens={screens}>{children}</Gate>
    </AuthProvider>
  );
}

function Gate({ screens, children }) {
  const { stage } = useAuth();
  const { Login, Onboarding, Loading, Error: ErrorScreen } = screens;
  if (!Login) return children; // 화면 연결 전: 기존 앱 그대로
  if (stage === 'loading') return Loading ? <Loading /> : null;
  if (stage === 'error') return ErrorScreen ? <ErrorScreen /> : null;
  if (stage === 'login') return <Login />;
  if (stage === 'onboarding') return Onboarding ? <Onboarding /> : children;
  return children;
}
