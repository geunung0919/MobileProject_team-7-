"""Bounded, authenticated receipt image recognition; no image persistence or remote OCR provider."""
import base64
import binascii
import io
import json
import os
import re
from pathlib import Path
import subprocess
import tempfile
import threading
import warnings

from fastapi import Depends, HTTPException, Request
from PIL import Image, ImageFilter, ImageOps, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool
from .fintech import parse_import_candidate

MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_REQUEST_BYTES = 12 * 1024 * 1024
MAX_PIXELS = 20_000_000
SLOTS = threading.BoundedSemaphore(2)
FORMATS = {'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/webp': 'WEBP'}


def decode_image(payload):
    if not isinstance(payload, dict) or set(payload) != {'image_base64', 'mime_type'}:
        raise HTTPException(422, '사진과 파일 형식을 확인해 주세요.')
    mime, encoded = payload['mime_type'], payload['image_base64']
    if not isinstance(mime, str) or mime not in FORMATS:
        raise HTTPException(415, 'JPG·PNG·WebP 사진을 선택해 주세요. HEIC는 JPG로 변환해 주세요.')
    if not isinstance(encoded, str) or not encoded or len(encoded) > (MAX_IMAGE_BYTES + 2) // 3 * 4:
        raise HTTPException(413, '사진은 8MB 이하로 선택해 주세요.')
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error):
        raise HTTPException(422, '사진 데이터를 읽을 수 없어요. 다시 선택해 주세요.') from None
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(413, '사진은 8MB 이하로 선택해 주세요.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(raw)) as source:
                if source.format != FORMATS[mime]:
                    raise HTTPException(415, '사진의 실제 형식과 확장 정보가 달라요. JPG·PNG·WebP로 다시 선택해 주세요.')
                if source.width * source.height > MAX_PIXELS or getattr(source, 'n_frames', 1) != 1:
                    raise HTTPException(413, '사진 크기가 너무 크거나 여러 프레임이에요. 한 장의 영수증으로 잘라 주세요.')
                source.load()
                image = ImageOps.exif_transpose(source).convert('RGB')
                image.thumbnail((2600, 3600))
                prepared = ImageOps.grayscale(image)
                if prepared.width < 1600:
                    scale = min(2.5, 1600 / max(prepared.width, 1))
                    prepared = prepared.resize(
                        (max(1, round(prepared.width * scale)), max(1, round(prepared.height * scale))),
                        Image.Resampling.LANCZOS,
                    )
                prepared = ImageOps.autocontrast(prepared, cutoff=1)
                prepared = prepared.filter(ImageFilter.SHARPEN)
                prepared.info.clear()
                return prepared
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(422, '손상되었거나 지원하지 않는 사진이에요. 다시 선택해 주세요.') from None


def _receipt_text_score(text):
    """Prefer OCR output that keeps receipt rows, amounts and Korean product names."""
    if not text:
        return -1
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    amount_lines = sum(
        bool(re.search(r'\d[\d,]{2,}\s*원?\Z', line))
        for line in lines
    )
    receipt_words = sum(
        bool(re.search(r'합\s*계|금액|수량|상품|품목|결제|영수증', line))
        for line in lines
    )
    korean_chars = len(re.findall(r'[가-힣]', text))
    return amount_lines * 8 + receipt_words * 3 + min(len(lines), 30) + min(korean_chars // 8, 20)


def recognize(image):
    executable = os.getenv('TESSERACT_CMD', 'tesseract')
    languages = os.getenv('OCR_LANGUAGES', 'kor+eng')
    best_text = ''
    best_score = -1
    engine_started = False
    engine_success = False
    try:
        # PSM 6 treats the receipt as one block; PSM 4 is often better for columns.
        # Keep whichever output preserves more receipt structure.
        with tempfile.TemporaryDirectory(prefix='receipt-ocr-') as directory:
            path = Path(directory) / 'image.png'
            image.save(path, format='PNG')
            for psm in ('6', '4'):
                result = subprocess.run(
                    [executable, str(path), 'stdout', '-l', languages, '--psm', psm],
                    capture_output=True,
                    timeout=18,
                    check=False,
                    env={**os.environ, 'OMP_THREAD_LIMIT': '1'},
                )
                engine_started = True
                if result.returncode:
                    continue
                engine_success = True
                text = result.stdout.decode('utf-8', errors='replace').strip()
                score = _receipt_text_score(text)
                if score > best_score:
                    best_text, best_score = text, score
    except FileNotFoundError:
        raise HTTPException(503, '서버에 Tesseract OCR이 설치되지 않았어요. 서버 설정 후 재시도하거나 직접 입력해 주세요.') from None
    except subprocess.TimeoutExpired:
        raise HTTPException(504, '사진 인식 시간이 초과됐어요. 영수증 부분만 잘라 다시 시도해 주세요.') from None
    if not engine_started:
        raise HTTPException(503, '서버 OCR 엔진을 시작하지 못했어요. 직접 입력도 가능해요.')
    if not engine_success:
        raise HTTPException(503, '서버 OCR 엔진과 한국어 언어팩 설정을 확인해 주세요. 직접 입력도 가능해요.')
    if len(best_text) < 3:
        raise HTTPException(422, '글자를 충분히 읽지 못했어요. 밝고 선명한 사진으로 다시 시도해 주세요.')
    return best_text


def process_image(payload):
    image = decode_image(payload)
    try:
        text = recognize(image)
    finally:
        image.close()
    truncated = len(text) > 5000
    raw_text = text[:5000]
    result = parse_import_candidate(raw_text, source='ocr')
    result['needs_review'] = True
    if truncated:
        result['warnings'].append('인식 원문이 5,000자를 넘어 일부만 분석했어요. 긴 영수증은 나눠 확인해 주세요.')
    return {'raw_text': raw_text, 'engine': 'tesseract', 'image_retained': False, 'text_truncated': truncated, **result}


def register_receipt_ocr(app, current_user):
    @app.post('/api/v1/me/spending/receipts/analyze', tags=['2번 영수증 OCR'])
    async def analyze(request: Request, user=Depends(current_user)):
        if request.headers.get('content-type', '').split(';')[0].strip().lower() != 'application/json':
            raise HTTPException(415, '사진 요청 형식이 올바르지 않아요.')
        if not SLOTS.acquire(blocking=False):
            raise HTTPException(429, '사진 분석 요청이 많아요. 잠시 뒤 다시 시도해 주세요.')
        try:
            content = bytearray()
            async for chunk in request.stream():
                content.extend(chunk)
                if len(content) > MAX_REQUEST_BYTES:
                    raise HTTPException(413, '사진 요청이 너무 커요. 8MB 이하 사진을 선택해 주세요.')
            try:
                payload = json.loads(content)
            except (ValueError, UnicodeDecodeError):
                raise HTTPException(422, '사진 요청을 읽을 수 없어요.') from None
            return await run_in_threadpool(process_image, payload)
        finally:
            SLOTS.release()
