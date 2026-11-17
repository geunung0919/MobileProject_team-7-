# 영수증 사진 분석

`POST /api/v1/me/spending/receipts/analyze`는 개발 인증 토큰을 확인하고 사진에서 원문과 거래 후보를 반환한다. 분석 자체는 지출/재고를 저장하지 않는다. 기존 `/imports/confirm`에서 사용자가 수정·확인한 거래를 저장한다.

## 서버 설치

Python 의존성: `python -m pip install -r requirements.txt`.
별도 Tesseract 5 실행 파일과 한국어·영어 traineddata가 필요하다. Firebase는 이번 변경에서 사용하지 않으며 외부 유료 OCR API 호출도 없다.

Ubuntu/Debian 예:

```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-kor tesseract-ocr-eng
tesseract --list-langs
```

Windows는 Tesseract 공식 문서 https://tesseract-ocr.github.io/tessdoc/Installation.html 의 Windows 설치 안내에 따라 설치하고 한국어/영어 데이터를 준비한다. `tesseract --list-langs`에서 `kor`, `eng` 확인. PATH에 없으면 서버 `.env`에 `TESSERACT_CMD=C:/Program Files/Tesseract-OCR/tesseract.exe`를 설정한다. `OCR_LANGUAGES=kor+eng`가 기본이며 언어팩 누락은 503으로 안내한다. 모델을 임의 예시 데이터로 대체하지 않는다.

## 요청·결과

JSON `{ "image_base64": "...", "mime_type": "image/jpeg" }`, `Authorization: Bearer ...` 필요. 앱은 네이티브/웹 선택 결과의 이미지 signature로 MIME을 정하고 서버에서 실제 decode/형식을 다시 검증한다.

응답은 `raw_text`, `candidate`, `warnings`, `needs_review:true`, `fingerprint`, `engine`, `image_retained:false`, `text_truncated` 포함. 신뢰 점수는 규칙 점수이며 실제 확률이 아니다. 자동 확정/품목별 수량·단가 추출은 하지 않는다.

## 실패·처리 범위

- 사진 8MiB, JSON 요청 12MiB, 원본 20메가픽셀, 단일 프레임만 허용.
- EXIF 회전 반영, 2400×3200 내 축소·회색조 변환. 임시 PNG에서 메타데이터 제거.
- 원본/임시 사진을 DB나 저장소에 보관하지 않고 TemporaryDirectory 종료 시 정리. 인식 원문은 반환하고 사용자가 저장을 확정하면 기존 지출 파이프라인으로 전달.
- 프로세스당 분석 슬롯 2개, 초과 429. Tesseract 실행 25초 후 중단, 클라이언트 요청 45초 제한. 분산된 사용자별 과금/요청 제한은 별도 운영 작업.
- 413 용량/픽셀 초과, 415 파일 형식, 422 손상/인식 부족, 503 엔진 미설치/실행 실패, 504 인식 제한시간.
- 앱의 취소는 응답 반영/네트워크 대기를 중단한다. 서버 인식은 이미 시작되면 최대 25초까지 계속될 수 있다.
- 서버 기존 개발 토큰 인증 유지. 공개 배포 시 운영 인증·HTTPS·프록시 본문 크기/전송시간 제한이 필요하다. 실제 인터넷 배포 완료를 의미하지 않는다.

재현 예: `python examples/check_receipt_photo.py --font /path/to/korean-font.otf`. Tesseract 언어팩 설치가 필요하며 synthetic 영수증을 생성해 실제 엔진·API·확인 저장·중복 차단까지 검사한다. 촬영 사진 정확도 평가가 아니다.
