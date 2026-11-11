// Camera preview and OCR support are separate; preview never claims recognition succeeded.
export function receiptCapability(platform, isExpoGo) {
  if (platform === 'web') return { canRecognize: false, message: '웹에서는 사진 선택 후 서버에서 분석할 수 있어요.' };
  if (isExpoGo) return { canRecognize: false, message: 'Expo Go에서는 촬영·앨범 선택 후 서버 OCR로 분석할 수 있어요. 서버 연결과 OCR 엔진 설정이 필요해요.' };
  return { canRecognize: true, message: '사진 선택 후 기기에서 글자를 읽고 서버에서 금액·날짜·사용처 후보를 분석해요. 저장 전 내용을 확인해 주세요.' };
}

export async function readReceiptImage(result, { canRecognize, recognize, onSelected, onText, analyze }) {
  if (result.canceled || !result.assets?.length) return 'cancelled';
  const uri = result.assets[0].uri;
  if (typeof uri !== 'string' || !uri) throw new Error('선택한 사진을 확인할 수 없어요. 다시 선택해 주세요.');
  onSelected(uri);
  if (!canRecognize) return 'preview';
  const text = await recognize(uri);
  // Keep extracted text even when server parsing fails; retry must not require another photo.
  onText(text);
  if (analyze) await analyze(text);
  return 'recognized';
}

export const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;
export function receiptUploadBody(asset) {
  if (!asset?.base64) throw new Error('사진 데이터를 불러오지 못했어요. 다시 선택해 주세요.');
  if (asset.fileSize > MAX_RECEIPT_BYTES || asset.base64.length > Math.ceil(MAX_RECEIPT_BYTES / 3) * 4)
    throw new Error('사진은 8MB 이하로 선택해 주세요. 영수증 부분만 잘라 다시 선택할 수 있어요.');
  // Native exports JPEG; web may preserve PNG/WebP. Inspect signature instead of filename.
  const mime = asset.base64.startsWith('/9j/') ? 'image/jpeg'
    : asset.base64.startsWith('iVBORw0KGgo') ? 'image/png'
    : asset.base64.startsWith('UklGR') ? 'image/webp' : null;
  if (!mime) throw new Error('JPG·PNG·WebP 영수증 사진을 선택해 주세요. HEIC는 JPG로 변환해 주세요.');
  return { image_base64: asset.base64, mime_type: mime };
}

export function scoreReceiptResult(result) {
  if (!result?.candidate) return -1000;
  let score = 0;
  if (result.candidate.amount_krw != null) score += 30;
  if (result.candidate.title && result.candidate.title !== '사용처 확인 필요') score += 18;
  if (result.candidate.spent_on) score += 6;
  score += Math.min((result.receipt_items || []).length, 30) * 8;
  score += Math.min(
    (result.receipt_items || []).filter(item => item.is_ingredient).length,
    20,
  ) * 2;
  score -= (result.warnings || []).length * 3;
  if (result.receipt_document?.document_type === 'multiple_receipts') score -= 30;
  return score;
}

async function analyzeDeviceReceipt(asset, { api, recognize, signal }) {
  const text = await recognize(asset.uri);
  if (signal?.aborted) throw new Error('분석을 취소했어요.');
  const result = await api(
    'me/spending/imports/preview',
    'POST',
    { raw_text: text, source: 'ocr' },
    { signal },
  );
  return { ...result, raw_text: text, engine: 'device-text-recognizer' };
}

async function analyzeServerReceipt(asset, { api, signal }) {
  const body = receiptUploadBody(asset);
  const result = await api(
    'me/spending/receipts/analyze',
    'POST',
    body,
    { signal, timeoutMs: 45000 },
  );
  if (typeof result?.raw_text !== 'string' || !result.candidate) {
    throw new Error('분석 응답을 확인할 수 없어요. 다시 시도해 주세요.');
  }
  return result;
}

export async function analyzeReceiptPhoto(asset, { mode, api, recognize, onText, onPhase, signal }) {
  const check = () => { if (signal?.aborted) throw new Error('분석을 취소했어요.'); };
  check();
  if (!api) throw new Error('분석·저장에는 서버 연결이 필요해요.');

  if (mode === 'server') {
    onPhase('사진 전송 · 서버 OCR 분석 중');
    const result = await analyzeServerReceipt(asset, { api, signal });
    check();
    onText(result.raw_text);
    return result;
  }

  if (mode === 'hybrid') {
    onPhase('기기 OCR과 서버 OCR을 비교 분석 중');
    const settled = await Promise.allSettled([
      analyzeDeviceReceipt(asset, { api, recognize, signal }),
      analyzeServerReceipt(asset, { api, signal }),
    ]);
    check();

    const candidates = settled
      .filter(entry => entry.status === 'fulfilled')
      .map(entry => entry.value);
    if (!candidates.length) {
      const reasons = settled
        .filter(entry => entry.status === 'rejected')
        .map(entry => entry.reason?.message)
        .filter(Boolean);
      throw new Error(reasons[0] || '영수증을 분석하지 못했어요. 다시 촬영해 주세요.');
    }

    candidates.sort((a, b) => scoreReceiptResult(b) - scoreReceiptResult(a));
    const result = candidates[0];
    onText(result.raw_text);
    return {
      ...result,
      ocr_selection: {
        mode: 'hybrid',
        selected_engine: result.engine || 'unknown',
        compared: candidates.map(candidate => ({
          engine: candidate.engine || 'unknown',
          score: scoreReceiptResult(candidate),
          item_count: (candidate.receipt_items || []).length,
        })),
      },
    };
  }

  onPhase('기기에서 글자 인식 중');
  const result = await analyzeDeviceReceipt(asset, { api, recognize, signal });
  check();
  onText(result.raw_text);
  return result;
}
