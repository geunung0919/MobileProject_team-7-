"""휴대폰 영수증 사진 대응: 파서(주소·일시 줄, 수량 칸, 체인 이름 오인식)와 사진 전처리."""
import pytest
from PIL import Image, ImageDraw, ImageFilter

from app import receipt_preprocess
from app.fintech import parse_import_candidate
from app.receipt_items import extract_receipt_items

RECEIPT = """6525 천안두정점
충남 천안시 서북구 두정동 123
사업자 312-81-12345 대표 김가나
2026-11-19 20:41 POS:01-0057
상품명 수량 금액
서울우유 1L      1    2,980
국산콩 두부 300g  1    1,600
신라면 5입        1    4,480
삼각김밥 참치마요 2    2,400
비닐봉투 20L      1      100
합계                  11,560
카드결제              11,560
"""


def test_address_and_datetime_lines_are_not_items():
    items = extract_receipt_items(RECEIPT)
    names = [item["raw_name"] for item in items]
    assert names == ["서울우유 1L", "국산콩 두부 300g", "신라면 5입", "삼각김밥 참치마요", "비닐봉투 20L"]
    assert sum(item["item_amount_krw"] for item in items) == 11560


def test_quantity_column_is_split_from_name():
    items = {item["raw_name"]: item for item in extract_receipt_items(RECEIPT)}
    assert items["삼각김밥 참치마요"]["quantity"] == 2
    assert items["서울우유 1L"]["quantity"] == 1


def test_common_chain_ocr_mistake_is_fixed_for_merchant():
    candidate = parse_import_candidate(RECEIPT, source="ocr")["candidate"]
    assert candidate["title"] == "GS25 천안두정점"
    assert candidate["amount_krw"] == 11560
    assert candidate["spent_on"] == "2026-11-19"


def test_header_glued_to_first_item_is_removed():
    items = extract_receipt_items("상품명 수량 금액 서울우유 1L 1 2,980\n두부 1 1,600\n합계 4,580")
    assert items[0]["raw_name"] == "서울우유 1L"


@pytest.mark.skipif(not receipt_preprocess.available(), reason="opencv 미설치")
def test_preprocess_finds_receipt_on_table_and_removes_shadow():
    # 갈색 책상 위에 기울어진 흰 영수증 + 오른쪽 아래 그림자
    photo = Image.new("RGB", (1200, 1600), (140, 95, 55))
    paper = Image.new("RGB", (600, 900), (242, 240, 232))
    draw = ImageDraw.Draw(paper)
    for row in range(12):
        draw.rectangle([40, 60 + row * 65, 520, 80 + row * 65], fill=(40, 40, 40))
    paper = paper.rotate(8, expand=True, fillcolor=(140, 95, 55))
    photo.paste(paper, (250, 300))
    shade = Image.new("L", photo.size, 255)
    ImageDraw.Draw(shade).ellipse([700, 1000, 1500, 1900], fill=130)
    shade = shade.filter(ImageFilter.GaussianBlur(120))
    photo = Image.composite(photo, Image.new("RGB", photo.size, (0, 0, 0)), shade)
    gray = photo.convert("L")
    gray.receipt_color = photo

    variants = dict(receipt_preprocess.prepare(gray))
    assert set(variants) == {"paper_flat", "paper_binary"}
    flat = variants["paper_flat"]
    # 영수증만 잘라서 폭을 맞춤 (책상이 거의 남지 않음)
    assert abs(flat.width - receipt_preprocess.TARGET_WIDTH) <= 2
    assert flat.height > flat.width
    # 그림자 진 아래쪽 배경도 위쪽만큼 밝아짐
    top = flat.crop((0, 0, flat.width, flat.height // 6)).resize((1, 1)).getpixel((0, 0))
    bottom = flat.crop((0, flat.height * 5 // 6, flat.width, flat.height)).resize((1, 1)).getpixel((0, 0))
    assert abs(top - bottom) < 40


def test_preprocess_without_opencv_returns_nothing(monkeypatch):
    monkeypatch.setattr(receipt_preprocess, "cv2", None)
    assert receipt_preprocess.prepare(Image.new("L", (100, 100), 255)) == []
