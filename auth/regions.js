// 거주 지역 검색 (AC-08). GPS 없이 이름으로 읍·면·동을 찾습니다. 서버 호출 없이 앱 안 데이터로 검색합니다.
// 데이터: data/legalDong.json (행정안전부 법정동코드 전체자료 2026-09-29 기준, 현재 존재하는 읍·면·동만).
// 주의: 공식 사이트에서 직접 받지 못해 공개 저장소 사본으로 만든 파일입니다. 발표 전 code.go.kr 원본으로
//       jachwi-core/scripts/build_legal_dong.py 를 다시 실행해 이 파일을 바꾸는 것을 권장합니다.
import data from './data/legalDong.json';

let cache = null;
function items() {
  if (cache) return cache;
  cache = new Map();
  for (const [code, dong] of data.emd) {
    const sido = data.sido[code.slice(0, 2)] || '';
    const sigungu = data.sgg[code.slice(0, 5)] || '';
    const label = [sido, sigungu, dong].filter(Boolean).join(' ');
    cache.set(code, { code, sido, sigungu, dong, label });
  }
  return cache;
}

export const regionDataVersion = data.version;
export const regionInfo = (code) => (code ? items().get(code) || null : null);

// 결과의 label 은 '시도 시군구 동' 전체 이름이라 같은 동 이름(예: 여러 지역의 '중앙동')을 구분해 보여 줄 수 있습니다.
// 띄어쓰기로 나눈 단어가 모두 "시도 시군구 동" 이름에 들어 있는 동. 동 이름이 같거나 그 이름으로 시작하는 것을 먼저 보여 줍니다.
export function searchRegions(query, limit = 20) {
  const words = (query || '').normalize('NFC').split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const hits = [];
  for (const item of items().values()) {
    if (words.every((w) => item.label.includes(w))) {
      const exact = words.some((w) => item.dong === w || item.dong.startsWith(w));
      hits.push([exact ? 0 : 1, item.label, item]);
    }
  }
  hits.sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
  return hits.slice(0, limit).map((h) => h[2]);
}
