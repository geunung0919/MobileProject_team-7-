"""법정동 코드 원본 → 앱·서버용 legal_dong.json 생성.

원본: 행정안전부 행정표준코드관리시스템(code.go.kr) '법정동코드 전체자료'
  - 공식 txt(탭 구분, CP949) 또는 같은 열(법정동코드, 법정동명, 폐지여부)의 UTF-8 CSV
사용: python scripts/build_legal_dong.py <원본파일> <기준일 YYYYMMDD>
결과: app/data/legal_dong.json, ../UIUX/src/data/regions/legalDong.json (같은 내용)
현재 존재하는 시도·시군구·읍면동만 담는다(리 제외). 행정구역 개편이 있으면 다시 실행한다.
"""
import csv, io, json, sys
from pathlib import Path

def read_rows(path):
    raw = Path(path).read_bytes()
    for enc in ('utf-8-sig', 'cp949'):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    delimiter = '\t' if '\t' in text.splitlines()[0] else ','
    return [r for r in csv.DictReader(io.StringIO(text), delimiter=delimiter) if r['폐지여부'].strip() == '존재']

def build(rows, version):
    name = {r['법정동코드'].strip(): r['법정동명'].strip() for r in rows}
    sido = {c[:2]: n for c, n in name.items() if c[2:] == '00000000'}
    sgg = {}
    for c, n in name.items():
        if c[5:] == '00000' and c[2:] != '00000000':
            p = sido.get(c[:2], '')
            sgg[c[:5]] = n[len(p):].strip() if p and n.startswith(p) else n
    emd = []
    for c, n in sorted(name.items()):
        if c[8:] == '00' and c[5:] != '00000':
            parent = name[c[:5] + '00000']
            emd.append([c, n[len(parent):].strip()])
    for k, v in list(sgg.items()):  # 세종처럼 시도 행 없이 시군구 단계에 있는 경우
        if k[:2] not in sido:
            sido[k[:2]], sgg[k] = v, ''
    return {'version': version, 'source': f'행정안전부 법정동코드 전체자료 ({version[:4]}-{version[4:6]}-{version[6:]} 기준)',
            'sido': sido, 'sgg': sgg, 'emd': emd}

if __name__ == '__main__':
    data = build(read_rows(sys.argv[1]), sys.argv[2])
    text = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    root = Path(__file__).resolve().parents[1]
    for out in (root / 'app/data/legal_dong.json', root.parent / 'UIUX/src/data/regions/legalDong.json'):
        out.write_text(text, encoding='utf-8')
    print(f"시도 {len(data['sido'])}, 시군구 {len(data['sgg'])}, 읍면동 {len(data['emd'])}")
