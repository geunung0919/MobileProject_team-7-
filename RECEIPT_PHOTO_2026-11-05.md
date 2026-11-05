# 영수증 촬영·사진첩 분석 고도화 (2026-11-05)

## 사용 흐름
촬영 또는 사진첩 선택 → 사진 미리보기 → 분석 버튼 → 금액·날짜·상호·분류 확인 및 수정 → 저장.
Expo Go는 서버 OCR을 사용하고 개발 빌드는 기기 OCR과 서버 OCR을 선택한다. 사진 선택만으로 전송하거나 지출을 저장하지 않는다.

## 코드 설명
- `mobile/src/app/spending-import.js`: 카메라/사진첩 권한, 사진 선택, 미리보기, 처리 단계, 취소와 재시도를 담당한다. Android는 자르기/회전을 허용하고 iOS는 긴 영수증을 강제로 정사각형으로 자르지 않는다.
- `mobile/src/lib/receiptFlow.mjs`의 `receiptUploadBody`: 이미지 형식과 8MB 제한을 검사한다. `analyzeReceiptPhoto`는 서버/기기 OCR 경로를 선택하고 취소된 결과가 화면에 반영되지 않게 한다.
- `mobile/src/lib/api.js`: 요청별 제한시간과 AbortSignal을 지원한다. 분석은 최대 45초 기다리고 취소와 시간 초과를 구별한다.
- `jachwi-core/app/receipt_ocr.py`의 `decode_image`: 실제 이미지 형식·크기·픽셀 수를 검증하고 방향 보정, 축소, 메타데이터 제거를 수행한다. `recognize`는 Tesseract를 최대 25초 실행하고 임시 파일을 삭제한다.
- `/api/v1/me/spending/receipts/analyze`: 인증된 사용자의 사진을 받아 기존 파서로 지출 후보를 만든다. 실제 저장은 기존 확인 API에서만 수행하므로 잘못 읽힌 내용을 수정할 수 있다.

## 확인한 결과
- 서버 테스트 71개, 모바일 테스트 107개 통과.
- Expo lint, JavaScript 타입 검사, Android/iOS/Web 번들 생성 통과.
- 실제 Tesseract + 한국어 언어팩으로 합성 영수증을 분석해 금액 12,300원과 날짜를 추출했다. 분석 시 미저장, 사용자 확인 후 저장, 중복 저장 거절까지 확인했다.
- 상호의 ‘천안점’을 ‘전안점’으로 읽는 오인식이 있었다. OCR 결과는 반드시 확인·수정해야 하며 정확도를 보장하지 않는다.

## 실행 및 남은 검증
서버 의존성 설치 외에 Tesseract와 kor/eng 언어팩이 필요하다. 설치 방법은 `jachwi-core/docs/RECEIPT_OCR.md` 참고.
실제 휴대폰 권한·사진첩·카메라와 다양한 실물 영수증 검증은 남아 있다. 공개 서비스 배포, 운영용 인증/HTTPS, 사용자별 제한과 Firebase 저장 연동은 이번 변경에 포함되지 않는다. 원본 사진은 영구 저장하지 않는다.
