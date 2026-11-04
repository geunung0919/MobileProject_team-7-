// Camera preview and OCR support are separate; preview never claims recognition succeeded.
export function receiptCapability(platform, isExpoGo) {
  if (platform === 'web') return { canRecognize: false, message: '웹에서는 사진 선택·미리보기와 원문 입력만 지원해요. 기기 OCR은 Android/iOS 개발 빌드가 필요해요.' };
  if (isExpoGo) return { canRecognize: false, message: 'Expo Go에서는 촬영·앨범 선택·사진 확인을 할 수 있어요. 글자 자동 인식은 개발 빌드가 필요해요. 지금은 원문을 직접 입력해 분석할 수 있어요.' };
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
