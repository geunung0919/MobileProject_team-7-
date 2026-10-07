# 자취 생존 AI 모바일 앱

**React Native + JavaScript + Expo** 팀 프로젝트입니다. 화면 코드는 `.js`이며 Expo Router로 이동합니다.
현재 blank 공식 템플릿 기반 Expo SDK 57 / React Native 0.86 / React 19.2를 사용합니다.
Node.js 22.13 이상이 필요합니다. `package-lock.json`으로 팀 설치 버전을 고정합니다.

## 실행: 터미널 2개

### 1. Python API 서버 (저장소 루트, PowerShell)

```powershell
cd jachwi-core
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python -m uvicorn app.main:create_app --factory --reload --host 0.0.0.0 --port 8000
```

### 2. Expo 앱 (새 터미널, 저장소 루트)

```powershell
cd mobile
npm ci
npx expo start
```

휴대폰과 PC를 같은 Wi-Fi에 연결하고 SDK 57과 호환되는 Expo Go에서 QR을 여세요.
기기 Expo Go가 SDK 57을 지원하지 않는다면 SDK를 임의로 섞지 말고 호환 버전 또는 development build를 사용하세요.
`ipconfig`에서 Wi-Fi IPv4를 확인한 뒤 앱의 서버 주소에 `http://PC_IP:8000`을 입력합니다.
PC 방화벽은 신뢰하는 사설 네트워크에서만 Python 8000 포트 접근을 허용합니다.

- 실제 휴대폰의 localhost/127.0.0.1은 PC가 아니라 휴대폰 자신입니다.
- Android 에뮬레이터는 보통 `http://10.0.2.2:8000` 사용.
- 기본 .env.example을 복사한 서버의 개발 토큰: `local-demo-token-user-a`.
- 토큰은 앱 메모리에만 보관하며 앱 재시작 시 다시 입력합니다. 실제 로그인은 별도 작업.
- 인터넷에 공개 배포하는 구성은 아닙니다. 현재 개발용 인증을 그대로 공개하지 마세요.

## 확인 순서

연결하기 → 생활 설정 → 입력 → 미리보기 → 확인하고 저장 →
온보딩 예산 불러오기 → 예산 저장 → 지출 등록/수정/삭제.
월별 조회, 예산 80%/소진/초과 표시, 서버 DB 저장을 지원합니다.
온보딩은 서버의 form 규격을 읽고 기존 값을 유지합니다. 예산 적용은 별도 확인 동작입니다.
날짜·월은 현재 텍스트 입력입니다. 지역은 법정동 코드 입력이며 지역 검색은 후속 작업입니다.

## 폴더

- `src/app/`: Expo Router 화면 (index, onboarding, spending)
- `src/components/UI.js`: 공통 컴포넌트·스타일·요청 중복 방지
- `src/lib/api.js`: 서버 API·금액 입력 검증
- `src/state/Session.js`: 연결 상태 (개발 토큰)
- `../jachwi-core/`: 기존 Python API. 앱 언어와 별개로 재사용

새 팀 기능은 이 앱에 화면과 API를 추가하세요. 별도 앱 프로젝트나 WebView로 복제하지 않습니다.
기존 `jachwi-core/app/spending.html`은 보조 웹 확인 도구이며 모바일 앱 화면이 아닙니다.
Flutter를 전제로 한 이전 계약 문서의 화면 target은 이제 Expo Router 경로로 연결합니다.
OCR/결제 문자 자동 읽기/기기 푸시/재고 전달은 아직 구현 전입니다.

## 개발 검사

```sh
npm test
npx expo lint
npx tsc -p jsconfig.json --noEmit
npx expo install --check
npx expo export --platform android --platform ios
```

JavaScript 프로젝트이므로 TypeScript 소스는 작성하지 않습니다. tsc는 JS 프로젝트 구문 확인용이며 checkJs는 꺼져 있습니다.
번들 생성 성공은 실제 Android/iOS 기기 테스트 완료를 의미하지 않습니다.

검증 결과: API 유틸 테스트 2개, ESLint, JS 프로젝트 구문 검사 통과.
Expo SDK 내장 버전표 기준 의존성 검사 통과(외부 호환성 서버는 연결 제한으로 미조회).
Android·iOS Metro/Hermes 번들 export 성공. 실제 휴대폰 터치 동작은 아직 검증하지 않았습니다.

## 냉장고·식사 연결 (module3 통합)

이 브랜치에서는 서버도 함께 갱신해야 합니다. 연결 시 `GET /api/v1/me/identity`로
개발 토큰의 사용자 ID를 확인합니다. `mobile` 폴더에서 `npm ci` 후 실행하세요.

1. 서버에 연결하고 **소비 관리 → 냉장고·식사**를 누릅니다.
2. 재고 등록·수정·삭제, 레시피 추천, 부족한 재료 장보기, 식사 기록을 사용할 수 있습니다.
3. 식료품 지출은 **식재료** 분류로 저장합니다. 소비 내역의 **냉장고에 등록**을 누릅니다.
4. 한 지출에서 구매한 재료를 여러 줄로 입력하고 수량·단위·제품의 소비기한을 확인합니다.
5. 저장 후 재고 목록으로 이동합니다. 동일 지출은 같은 기기의 같은 서버·계정에서 다시 등록되지 않습니다.
6. 재고가 충분한 레시피에서 식사를 기록하면 소비기한이 가까운 재료부터 차감됩니다.

재고·식사·장보기는 AsyncStorage에 **서버 주소 + 인증된 사용자 ID**별로 저장합니다.
토큰은 저장하지 않습니다. 새 계정은 빈 재고로 시작하며 팀원의 샘플 재고를 자동 주입하지 않습니다.
기기 저장이 실패하면 성공 처리하지 않고 기존 데이터를 유지합니다.
앱 삭제/앱 데이터 초기화 시 재고와 중복 등록 기록도 없어집니다. 다른 기기와는 동기화되지 않습니다.
같은 서버라도 IP/도메인을 바꾸면 별도 저장 공간으로 취급합니다.
지출을 수정·삭제해도 이미 등록된 재고는 자동 변경되지 않으며 재고 화면에서 직접 수정합니다.

### 팀원 코드 출처와 남은 연결

- `feature/module3` 커밋 `6812ae0a984503674f572d1cc79b3a85ec3e5d73`의
  `module3-expo-router` 재고 계산·레시피·화면을 `src/features/fridge`와 `src/app/fridge`에 가져와 연결했습니다.
- 원본 팀원 브랜치는 수정하지 않습니다. 이후 module3 변경은 이 통합본과 함께 조정해야 합니다.
- 원본의 전역 로컬 키를 계정별 키로 교체하고, 저장을 직렬 처리하며 영속 저장 성공 후 화면을 갱신합니다.
- 서버 재고 규격은 `g/ml/piece/pack`, module3는 `개/공기/모` 등 자유 단위이므로
  서버 재고 스냅샷에 자동 전송하지 않습니다. 단위 변환·저장 위치·소비기한 출처 규격을 합의한 뒤 연결해야 합니다.
- 모바일 JavaScript 검사(`checkJs: false`)는 정적 타입 검증 전체를 보장하지 않습니다.

검증 명령:

```bash
npm test
npx expo lint
npx tsc -p jsconfig.json --noEmit
npx expo export --platform android --platform ios
```

휴대폰에서는 계정 A에서 재고 등록 → 연결 종료 → 계정 B가 빈 재고인지 확인 →
계정 A 재연결 후 유지 확인, 동일 지출 재등록 차단, 식사 기록/재고 차감을 확인하세요.
