# 모바일SW프로젝트

A minimal JavaScript project initialized for Node.js.

## Run

```bash
npm start
```

This will execute the script in `test.js`.

## 팀 개발 환경

모바일 앱은 **React Native + JavaScript + Expo**로 개발합니다.
[모바일 앱 실행 안내](mobile/README.md)를 먼저 확인하세요.
`mobile/`은 앱, `jachwi-core/`는 온보딩·소비 관리 FastAPI 서버입니다.
루트의 기존 Node 테스트는 앱 실행 명령이 아닙니다. 앱은 `cd mobile` 후 `npm ci`, `npx expo start`로 실행합니다.
