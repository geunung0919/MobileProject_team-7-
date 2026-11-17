# 모바일SW프로젝트

A minimal JavaScript project initialized for Node.js.

## Run

```bash
npm start
```

This will execute the script in `test.js`.

## 팀 개발 환경

모바일 앱은 **React Native + JavaScript + Expo**로 개발합니다.

| 폴더 | 역할 |
| --- | --- |
| `UIUX/` | **최종 앱.** 디자인 화면 + 서버 연결 (소비·예산·냉장고·영수증 OCR) |
| `jachwi-core/` | FastAPI 서버. OCR 분석, 예산 계산, 통합 현황. 데이터는 Firebase(Firestore)에 저장 ([설정](jachwi-core/docs/FIRESTORE.md)) |
| `mobile/` | 기능 개발용 이전 앱 (개발용 화면). 새 기능은 `UIUX/`에 붙입니다 |

### 실행 순서
1. 서버: `jachwi-core/README.md`대로 실행 (`.env`의 `DATABASE_URL=firestore://`면 Firestore 저장)
2. 앱: `cd UIUX` → `.env.example`을 `.env.local`로 복사해 PC IP와 개발 토큰 입력 → `npm ci` → `npx expo start`
   - `.env.local`이 없으면 더미 데이터로 화면만 확인할 수 있어요.

루트의 기존 Node 테스트는 앱 실행 명령이 아닙니다.
