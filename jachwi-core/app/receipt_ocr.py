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
from PIL import Image, ImageFilter, ImageOps, ImageStat, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool
from .fintech import LedgerRow, apply_learned_receipt_items, parse_import_candidate

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


def _otsu_binarize(image):
    """Global Otsu threshold using Pillow only; keeps server dependencies small."""
    histogram = image.histogram()
    total = sum(histogram)
    if total <= 0:
        return image.copy()

    weighted_sum = sum(index * count for index, count in enumerate(histogram))
    background_weight = 0
    background_sum = 0
    best_threshold = 127
    best_variance = -1.0

    for threshold, count in enumerate(histogram):
        background_weight += count
        if background_weight == 0:
            continue
        foreground_weight = total - background_weight
        if foreground_weight == 0:
            break

        background_sum += threshold * count
        background_mean = background_sum / background_weight
        foreground_mean = (weighted_sum - background_sum) / foreground_weight
        between = background_weight * foreground_weight * (background_mean - foreground_mean) ** 2
        if between > best_variance:
            best_variance = between
            best_threshold = threshold

    return image.point(lambda pixel: 255 if pixel > best_threshold else 0).convert('L')


def _ocr_variants(image):
    """Create a small ensemble for thermal receipts, shadows and low contrast."""
    contrast = ImageOps.autocontrast(image, cutoff=1)
    strong = contrast.filter(ImageFilter.UnsharpMask(radius=1.2, percent=190, threshold=3))
    binary = _otsu_binarize(contrast)
    return (
        ('contrast', contrast),
        ('unsharp', strong),
        ('binary', binary),
    )


def _receipt_text_score(text):
    """Prefer OCR output that is both readable and useful to the receipt parser."""
    if not text:
        return -1
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    amount_lines = sum(
        bool(re.search(r'\d[\d,]{2,}\s*원?\Z', line))
        for line in lines
    )
    item_like_lines = sum(
        bool(
            re.search(r'[가-힣A-Za-z]', line)
            and re.search(r'\d[\d,]{2,}', line)
        )
        for line in lines
    )
    receipt_words = sum(
        bool(re.search(r'합\s*계|총\s*액|금액|수량|상품|품목|결제|영수증|TOTAL', line, re.I))
        for line in lines
    )
    korean_chars = len(re.findall(r'[가-힣]', text))
    noisy_symbols = len(re.findall(r'[|{}_~^]{2,}', text))
    score = (
        amount_lines * 10
        + item_like_lines * 6
        + receipt_words * 3
        + min(len(lines), 35)
        + min(korean_chars // 8, 20)
        - noisy_symbols * 2
    )

    # Select the OCR pass that helps our actual downstream task, not merely the
    # pass that returns the most characters.
    try:
        parsed = parse_import_candidate(text[:5000], source='ocr')
        score += len(parsed.get('receipt_items') or []) * 12
        candidate = parsed.get('candidate') or {}
        if candidate.get('amount_krw') is not None:
            score += 18
        if candidate.get('title') not in (None, '', '사용처 확인 필요'):
            score += 8
        if parsed.get('receipt_document', {}).get('document_type') == 'multiple_receipts':
            score -= 20
    except Exception:
        score -= 10
    return score


def _image_quality(image):
    """Cheap quality signals for user guidance; never claims an accuracy probability."""
    stat = ImageStat.Stat(image)
    contrast = float(stat.stddev[0]) if stat.stddev else 0.0
    edges = image.filter(ImageFilter.FIND_EDGES)
    try:
        edge_mean = float(ImageStat.Stat(edges).mean[0])
    finally:
        edges.close()
    return {
        'contrast': round(contrast, 2),
        'edge_mean': round(edge_mean, 2),
        'low_contrast': contrast < 24,
        'possibly_blurred': edge_mean < 9,
    }


def recognize(image):
    executable = os.getenv('TESSERACT_CMD', 'tesseract')
    languages = os.getenv('OCR_LANGUAGES', 'kor+eng')
    best_text = ''
    best_score = -1
    best_variant = None
    best_psm = None
    engine_started = False
    engine_success = False

    try:
        with tempfile.TemporaryDirectory(prefix='receipt-ocr-') as directory:
            psm_plan = {
                'contrast': ('4', '6'),
                'unsharp': ('6',),
                'binary': ('4', '6', '11'),
            }
            for variant_name, variant in _ocr_variants(image):
                path = Path(directory) / f'{variant_name}.png'
                variant.save(path, format='PNG')
                try:
                    for psm in psm_plan[variant_name]:
                        result = subprocess.run(
                            [
                                executable, str(path), 'stdout',
                                '-l', languages,
                                '--oem', '1',
                                '--psm', psm,
                                '-c', 'preserve_interword_spaces=1',
                            ],
                            capture_output=True,
                            timeout=6,
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
                            best_text = text
                            best_score = score
                            best_variant = variant_name
                            best_psm = psm
                finally:
                    variant.close()
    except FileNotFoundError:
        raise HTTPException(
            503,
            '서버에 Tesseract OCR이 설치되지 않았어요. 서버 설정 후 재시도하거나 직접 입력해 주세요.',
        ) from None
    except subprocess.TimeoutExpired:
        raise HTTPException(
            504,
            '사진 인식 시간이 초과됐어요. 영수증 부분만 잘라 다시 시도해 주세요.',
        ) from None

    if not engine_started:
        raise HTTPException(503, '서버 OCR 엔진을 시작하지 못했어요. 직접 입력도 가능해요.')
    if not engine_success:
        raise HTTPException(
            503,
            '서버 OCR 엔진과 한국어 언어팩 설정을 확인해 주세요. 직접 입력도 가능해요.',
        )
    if len(best_text) < 3:
        raise HTTPException(
            422,
            '글자를 충분히 읽지 못했어요. 밝고 선명한 사진으로 다시 시도해 주세요.',
        )
    return best_text, {
        'variant': best_variant,
        'psm': best_psm,
        'quality_score': best_score,
    }


def process_image(payload):
    image = decode_image(payload)
    try:
        image_quality = _image_quality(image)
        text, ocr_meta = recognize(image)
    finally:
        image.close()
    truncated = len(text) > 5000
    raw_text = text[:5000]
    result = parse_import_candidate(raw_text, source='ocr')
    result['needs_review'] = True
    if image_quality['low_contrast']:
        result['warnings'].append(
            '사진 대비가 낮아 글자를 놓칠 수 있어요. 밝은 곳에서 영수증만 크게 다시 촬영하면 더 정확해져요.'
        )
    if image_quality['possibly_blurred']:
        result['warnings'].append(
            '사진이 흐리거나 글자 경계가 약할 수 있어요. 카메라 초점을 맞춘 뒤 다시 촬영해 주세요.'
        )
    if truncated:
        result['warnings'].append('인식 원문이 5,000자를 넘어 일부만 분석했어요. 긴 영수증은 나눠 확인해 주세요.')
    return {
        'raw_text': raw_text,
        'engine': 'tesseract-ensemble',
        'ocr_meta': {**ocr_meta, 'image_quality': image_quality},
        'image_retained': False,
        'text_truncated': truncated,
        **result,
    }


def register_receipt_ocr(app, current_user, db):
    @app.post('/api/v1/me/spending/receipts/analyze', tags=['2번 영수증 OCR'])
    async def analyze(
        request: Request,
        user=Depends(current_user),
        session=Depends(db),
    ):
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
            result = await run_in_threadpool(process_image, payload)
            return apply_learned_receipt_items(
                result,
                session.get(LedgerRow, user),
            )
        finally:
            SLOTS.release()
