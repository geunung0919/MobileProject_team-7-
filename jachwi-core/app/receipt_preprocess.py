"""휴대폰으로 찍은 영수증 사진 다듬기 (OpenCV 가 있을 때만).

실제 휴대폰 사진은 책상 배경, 기울임·원근, 손·휴대폰 그림자, 흐림 때문에
Tesseract 가 글자(특히 그림자 진 금액 숫자)를 거의 못 읽습니다. 그래서 OCR 전에
1) 사진에서 영수증 종이만 찾아 잘라내고 반듯하게 펴고(원근 보정)
2) 조명·그림자를 평평하게 만들고(배경 밝기로 나누기)
3) 글자 크기가 Tesseract 가 잘 읽는 크기가 되도록 맞춥니다.

opencv-python-headless 가 설치되어 있지 않으면 아무것도 하지 않고(None),
receipt_ocr.py 는 기존 Pillow 전처리만 사용합니다.
"""
from __future__ import annotations

try:  # 선택 의존성
    import cv2
    import numpy as np
except Exception:  # pragma: no cover - 설치 안 된 환경
    cv2 = None
    np = None

from PIL import Image

TARGET_WIDTH = 1500  # 잘라낸 영수증 폭 (감열지 한 줄 30~45자 → 글자 높이 약 30px)


def available() -> bool:
    return cv2 is not None


def _order(points):
    pts = points.reshape(4, 2).astype('float32')
    s = pts.sum(axis=1)
    d = np.diff(pts, axis=1).ravel()
    return np.array([pts[np.argmin(s)], pts[np.argmin(d)], pts[np.argmax(s)], pts[np.argmax(d)]], dtype='float32')


def _quad_from_mask(mask, scale, total):
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    contour = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(contour)
    # 너무 작으면 종이가 아님, 거의 전체면 이미 영수증만 찍은 사진
    if area < total * 0.08 or area > total * 0.95:
        return None
    hull = cv2.convexHull(contour)
    peri = cv2.arcLength(hull, True)
    quad = None
    for eps in (0.02, 0.03, 0.04, 0.06):
        approx = cv2.approxPolyDP(hull, eps * peri, True)
        if len(approx) == 4 and cv2.contourArea(approx) > area * 0.85:
            quad = approx
            break
    if quad is None:
        quad = cv2.boxPoints(cv2.minAreaRect(hull)).reshape(4, 1, 2)
    return _order(quad / scale)


def _find_paper(gray, color=None):
    """사진에서 영수증 종이의 네 꼭짓점. 못 찾으면 None.

    그림자가 진 부분도 종이로 잡히도록 '밝기'보다 '색이 없는(흰·회색) 부분'을 먼저 봅니다.
    책상이 흰색이라 색으로 구분이 안 되면 밝기(Otsu)로 한 번 더 찾아봅니다.
    """
    h, w = gray.shape
    scale = 1000.0 / max(h, w)
    size = (max(1, int(w * scale)), max(1, int(h * scale)))
    total = size[0] * size[1]
    close = cv2.getStructuringElement(cv2.MORPH_RECT, (31, 31))
    opening = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
    masks = []
    if color is not None:
        rgb = cv2.resize(np.array(color.convert('RGB')), size, interpolation=cv2.INTER_AREA)
        hsv = cv2.cvtColor(cv2.GaussianBlur(rgb, (7, 7), 0), cv2.COLOR_RGB2HSV)
        sat, val = hsv[:, :, 1].astype('float32'), hsv[:, :, 2].astype('float32')
        # 그림자(넓고 완만한 어둠)를 빼고 보면 종이는 주변보다 밝고 색이 없음
        light = cv2.GaussianBlur(val, (0, 0), max(size) / 6) + 1
        rel = val / light
        sat_rel = sat / (val + 1)  # 어두워도 색이 있으면(나무 책상 등) 비율이 큼
        paper = ((sat_rel < 0.28) & (rel > 0.85) & (val > 20)).astype('uint8') * 255
        masks.append(paper)
    small = cv2.GaussianBlur(cv2.resize(gray, size, interpolation=cv2.INTER_AREA), (7, 7), 0)
    _, bright = cv2.threshold(small, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    masks.append(bright)
    for mask in masks:
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, close)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, opening)
        quad = _quad_from_mask(mask, scale, total)
        if quad is not None:
            return quad
    return None


def _warp(gray, quad):
    tl, tr, br, bl = quad
    width = int(max(np.linalg.norm(tr - tl), np.linalg.norm(br - bl)))
    height = int(max(np.linalg.norm(bl - tl), np.linalg.norm(br - tr)))
    if width < 50 or height < 50:
        return None
    dst = np.array([[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]], dtype='float32')
    matrix = cv2.getPerspectiveTransform(quad, dst)
    warped = cv2.warpPerspective(gray, matrix, (width, height), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    margin = max(2, int(min(width, height) * 0.01))  # 가장자리 그림자·배경 한 줄 정리
    return warped[margin:height - margin, margin:width - margin]


def _flatten_light(gray):
    """그림자·조명 차이를 없앰: 글자를 지운 배경 밝기로 나눔."""
    k = max(15, (min(gray.shape) // 25) | 1)
    background = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    background = cv2.GaussianBlur(background, (0, 0), k / 3)
    flat = cv2.divide(gray, background, scale=255)
    return cv2.normalize(flat, None, 0, 255, cv2.NORM_MINMAX)


def prepare(image: Image.Image):
    """Pillow 이미지 → [(이름, Pillow 회색조 이미지)] OCR 후보. OpenCV 없으면 []."""
    if not available():
        return []
    gray = np.array(image.convert('L'))
    variants = []
    quad = _find_paper(gray, getattr(image, 'receipt_color', None))
    cropped = _warp(gray, quad) if quad is not None else None
    base = cropped if cropped is not None else gray
    # 세로로 긴 영수증이 가로로 찍혔으면 세움 (가로가 세로보다 1.3배 넘게 길면)
    if cropped is not None and base.shape[1] > base.shape[0] * 1.3:
        base = cv2.rotate(base, cv2.ROTATE_90_CLOCKWISE)
    scale = TARGET_WIDTH / max(base.shape[1], 1)
    if 0.6 < scale < 1.05:
        scale = 1.0
    base = cv2.resize(base, (int(base.shape[1] * scale), int(base.shape[0] * scale)),
                      interpolation=cv2.INTER_CUBIC if scale > 1 else cv2.INTER_AREA)
    flat = _flatten_light(base)
    flat = cv2.fastNlMeansDenoising(flat, None, 7, 7, 21)
    sharp = cv2.addWeighted(flat, 1.6, cv2.GaussianBlur(flat, (0, 0), 2), -0.6, 0)
    binary = cv2.adaptiveThreshold(flat, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 12)
    prefix = 'paper' if cropped is not None else 'flat'
    variants.append((f'{prefix}_flat', Image.fromarray(sharp)))
    variants.append((f'{prefix}_binary', Image.fromarray(binary)))
    return variants
