# 냉장고 한 끼 · Module 3
React Native + JavaScript + Expo Router 팀 프로젝트. TypeScript 미사용.

## 처음 실행 (VS Code)
1. Node.js LTS를 설치하세요.
2. 압축을 풀고 **package.json이 있는 폴더**를 VS Code로 여세요.
3. 터미널에서 아래 명령을 실행하세요.

```sh
npm ci
npm start
```

이 프로젝트는 공식 Expo blank 템플릿의 Expo 57 / React Native 0.86으로 구성했습니다. package-lock.json으로 버전을 고정했습니다. SDK를 새로 구성할 때만 `npm run setup`을 사용하세요. `setup`은 공식 Expo blank 템플릿의 현재 SDK/React/React Native 버전을 가져오고 `expo install`로 Router 및 저장소 의존성을 맞춥니다. 인터넷이 필요합니다. 처음 한 번 담당자가 실행한 후 생성된 package.json과 package-lock.json을 함께 커밋하세요. 팀원들은 `npm ci` → `npm start`를 사용하세요. 팀원이 setup을 다시 실행하면 SDK가 바뀔 수 있습니다.

Android는 Expo Go로 QR 코드를 스캔하세요. iPhone은 카메라로 스캔하세요. 같은 Wi-Fi를 사용하세요. 설치한 SDK가 Expo Go와 맞지 않으면 해당 SDK를 지원하는 Expo Go 또는 개발 빌드가 필요합니다. Windows에서 iOS 시뮬레이터는 실행할 수 없습니다. 웹은 `npm run web`으로 실행합니다.

## 구현 기능
- 홈 요약 / 5개 탭 / 재고 및 레시피 상세 라우트
- 재고 등록, 수정, 삭제, 검색, 소비기한 D-Day
- 규칙 기반 레시피 추천 및 부족 재료 장보기 추가
- 식사 기록과 재고 차감을 한 상태 변경으로 처리
- 소비기한 가까운 배치부터 사용, 만료 재료 제외, 음수 재고 방지
- 장보기 수동 추가 / 구매 체크 / 삭제
- AsyncStorage 기기 저장; 초기 예시 데이터는 첫 실행에만 제공

재료명과 단위가 정확히 일치해야 매칭됩니다. 예: 달걀/개, 밥/공기, 김치/g, 두부/모. 별칭/단위 변환은 아직 없습니다. 기름과 소금 등 기본 양념은 차감하지 않습니다. 장보기 체크는 재고 구매 등록과 별개입니다. AI 모델, 로그인, 서버 동기화, 소비량 예측은 미구현입니다. 각 기기의 데이터는 따로 저장되며 앱 삭제 시 사라질 수 있습니다. 중복 탭 방지는 현재 상세 화면에 적용되며 서버 수준 idempotency는 아닙니다.

## 폴더
- src/app: Expo Router 화면 및 레이아웃
- src/components: 공통 UI, 재고 폼
- src/state: 공유 상태 및 저장
- src/domain: 재고 차감, 소비기한, 추천 규칙
- src/data: 예시 재고 및 레시피
- src/services/api.js: 이후 서버 연결용 함수 (현재 미사용)
- tests: 재고 규칙 검증

## 검증
```sh
npm test
npx expo-doctor
npx expo export --platform web
```
작성 환경에서 의존성 설치, 테스트 4개, JavaScript/JSX 구문 검사, 웹 번들 내보내기가 통과했습니다. Android/iOS 기기 실행은 아직 확인하지 않았습니다.

## Git 공유
GitHub에 빈 저장소를 만든 후:
```sh
git init
git add .
git commit -m "feat: add module3 Expo Router app"
git branch -M main
git remote add origin <저장소주소>
git push -u origin main
```
이후 각자 `git switch -c feature/기능명`으로 작업하고 PR로 합치세요. .env에는 비밀키를 넣지 마세요. EXPO_PUBLIC_ 값은 앱 사용자에게 공개됩니다.
