// 영수증 촬영/앨범 선택 -> 서버 OCR 분석. Expo Go 에서도 동작합니다 (글자 인식은 서버의 Tesseract/PaddleOCR).
import * as ImagePicker from 'expo-image-picker';

const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;

// mode: 'camera' | 'gallery'. 취소하면 null.
export async function pickReceiptPhoto(mode) {
  const permission =
    mode === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      mode === 'camera'
        ? '카메라 권한이 필요해요. 휴대폰 설정에서 카메라 권한을 허용해 주세요.'
        : '사진 접근 권한이 필요해요. 휴대폰 설정에서 사진 권한을 허용해 주세요.'
    );
  }
  const options = { mediaTypes: ['images'], quality: 0.7, base64: true, exif: false };
  const result =
    mode === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0];
}

function uploadBody(asset) {
  if (!asset?.base64) throw new Error('사진 데이터를 불러오지 못했어요. 다시 선택해 주세요.');
  if (asset.base64.length > Math.ceil(MAX_RECEIPT_BYTES / 3) * 4) {
    throw new Error('사진은 8MB 이하로 선택해 주세요. 영수증 부분만 잘라 다시 선택할 수 있어요.');
  }
  // 파일 이름 대신 내용의 앞부분으로 형식을 확인합니다.
  const mime = asset.base64.startsWith('/9j/')
    ? 'image/jpeg'
    : asset.base64.startsWith('iVBORw0KGgo')
      ? 'image/png'
      : asset.base64.startsWith('UklGR')
        ? 'image/webp'
        : null;
  if (!mime) throw new Error('JPG·PNG·WebP 영수증 사진을 선택해 주세요.');
  return { image_base64: asset.base64, mime_type: mime, use_ai_fallback: true };
}

// 서버 OCR 분석 결과 (candidate, receipt_items, raw_text, warnings ...)
export async function analyzeReceiptPhoto(api, asset) {
  const result = await api('me/spending/receipts/analyze', 'POST', uploadBody(asset), { timeoutMs: 60000 });
  if (typeof result?.raw_text !== 'string' || !result.candidate) {
    throw new Error('영수증 분석 결과를 확인할 수 없어요. 다시 촬영해 주세요.');
  }
  if (result.raw_text.trim().length < 3) {
    throw new Error('영수증 글자를 거의 읽지 못했어요. 밝은 곳에서 영수증만 크게 다시 촬영해 주세요.');
  }
  return result;
}
