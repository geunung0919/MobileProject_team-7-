import { Platform } from 'react-native';

export async function recognizeReceiptText(uri) {
  if (!uri) throw new Error('영수증 이미지를 선택해 주세요.');
  if (Platform.OS === 'web') throw new Error('영수증 OCR은 Android/iOS Development Build에서 사용할 수 있어요.');

  let extractor;
  try {
    extractor = await import('@zhanziyang/expo-text-extractor');
  } catch {
    throw new Error('OCR 모듈을 불러오지 못했어요. Expo Go가 아니라 Development Build로 실행해 주세요.');
  }

  if (!extractor.isSupported) {
    throw new Error('이 기기에서는 영수증 OCR을 지원하지 않아요.');
  }

  const options = Platform.OS === 'android'
    ? { script: extractor.TextRecognitionScript.KOREAN }
    : { languages: ['ko-KR', 'en-US'], usesLanguageCorrection: true };

  let lines;
  try {
    lines = await extractor.extractTextFromImage(uri, options);
  } catch {
    throw new Error('영수증 글자를 읽지 못했어요. 영수증을 평평하게 놓고 밝은 곳에서 다시 촬영해 주세요.');
  }

  const text = (Array.isArray(lines) ? lines : [])
    .map(line => String(line || '').trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, 5000);

  if (text.length < 3) {
    throw new Error('인식된 글자가 너무 적어요. 영수증 전체가 선명하게 보이도록 다시 촬영해 주세요.');
  }
  return text;
}
