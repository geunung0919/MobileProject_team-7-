import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Page, styles, useTask } from '../components/UI';
import { parseMoney } from '../lib/api';
import { recognizeReceiptText } from '../lib/receiptOcr';
import { useSession } from '../state/Session';
import {
  getPendingNotifications,
  markProcessedNotifications,
} from '../../modules/payment-notifications';

const sources = {
  notification: '카드앱 알림',
  sms: '문자',
  kakao: '카톡·페이',
  ocr: '영수증 OCR',
  commerce: '쇼핑몰',
  unknown: '기타',
};
const categories = {
  food: '외식·배달',
  groceries: '식재료',
  living: '생활용품',
  transport: '교통',
  other: '기타',
};

export default function SpendingImport() {
  const { api } = useSession();
  const params = useLocalSearchParams();
  const routeNotificationId = Array.isArray(params.notificationId)
    ? params.notificationId[0]
    : params.notificationId;
  const { busy, error, run, setError } = useTask();
  const [source, setSource] = useState('notification');
  const [rawText, setRawText] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [review, setReview] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [activeNotificationId, setActiveNotificationId] = useState('');

  async function analyzeText(text, nextSource = source) {
    const normalized = text.trim();
    if (normalized.length < 3) throw new Error('결제 알림이나 OCR 텍스트를 입력해 주세요.');
    const result = await api('me/spending/imports/preview', 'POST', {
      raw_text: normalized,
      source: nextSource,
    });
    setSource(nextSource);
    setRawText(normalized);
    setReview(result);
    setCandidate({
      ...result.candidate,
      amount_krw: result.candidate.amount_krw == null ? '' : String(result.candidate.amount_krw),
    });
  }

  useEffect(() => {
    if (!api || !routeNotificationId) return;
    let cancelled = false;
    (async () => {
      try {
        const item = getPendingNotifications().find(value => value.id === routeNotificationId);
        if (!item) throw new Error('자동수집함에서 해당 알림을 찾지 못했어요.');
        const result = await api('me/spending/imports/preview', 'POST', {
          raw_text: item.rawText,
          source: 'notification',
        });
        if (cancelled) return;
        setImageUri('');
        setSource('notification');
        setRawText(item.rawText);
        setReview(result);
        setCandidate({
          ...result.candidate,
          amount_krw: result.candidate.amount_krw == null ? '' : String(result.candidate.amount_krw),
        });
        setActiveNotificationId(item.id);
      } catch (e) {
        if (!cancelled) setError(e.message || '자동수집 알림을 불러오지 못했어요.');
      }
    })();
    return () => { cancelled = true; };
  }, [api, routeNotificationId, setError]);

  if (!api) return <Redirect href="/" />;

  const change = (key, value) => setCandidate(current => ({ ...current, [key]: value }));
  const preview = () => run(() => analyzeText(rawText, source));

  const handlePickedImage = async result => {
    if (result.canceled || !result.assets?.length) return;
    const uri = result.assets[0].uri;
    setActiveNotificationId('');
    setImageUri(uri);
    setSource('ocr');
    setReview(null);
    setCandidate(null);
    setError('');
    const text = await recognizeReceiptText(uri);
    await analyzeText(text, 'ocr');
  };

  const takeReceiptPhoto = () => run(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('영수증 촬영을 위해 카메라 권한이 필요해요.');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    await handlePickedImage(result);
  });

  const pickReceiptImage = () => run(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    await handlePickedImage(result);
  });

  const confirm = () => run(async () => {
    if (!candidate) throw new Error('먼저 자동 추출을 실행해 주세요.');
    const title = candidate.title.trim();
    if (!title || title === '사용처 확인 필요') throw new Error('사용처를 확인해서 입력해 주세요.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate.spent_on)) throw new Error('날짜를 YYYY-MM-DD 형식으로 입력해 주세요.');
    await api('me/spending/imports/confirm', 'POST', {
      raw_text: rawText.trim(),
      source,
      title,
      amount_krw: parseMoney(candidate.amount_krw, false),
      spent_on: candidate.spent_on,
      category: candidate.category,
    });
    if (activeNotificationId) {
      try {
        markProcessedNotifications([activeNotificationId]);
      } catch {
        // 서버 저장 성공을 로컬 수집함 정리 실패 때문에 취소하지 않는다.
      }
    }
    router.replace('/spending');
  });

  return <Page title="결제 자동입력">
    {!!activeNotificationId && <Card>
      <Text style={styles.text}>✓ Android 자동수집함에서 가져온 결제 알림이에요.</Text>
      <Text style={styles.small}>내용을 확인하거나 고친 뒤 저장하면 수집함에서도 자동으로 제거돼요.</Text>
    </Card>}

    <Card>
      <Text style={styles.title}>영수증 사진 OCR</Text>
      <Text style={styles.text}>영수증을 촬영하거나 앨범에서 고르면 한국어 OCR 후 금액·날짜·사용처까지 자동 분석해요.</Text>
      <View style={styles.row}>
        <Button title={busy ? '처리 중…' : '영수증 촬영'} disabled={busy} onPress={takeReceiptPhoto} />
        <Button title="앨범에서 선택" disabled={busy} onPress={pickReceiptImage} />
      </View>
      {!!imageUri && <Image source={{ uri: imageUri }} style={{ width: '100%', height: 320, borderRadius: 12, backgroundColor: '#eef3f0' }} resizeMode="contain" />}
      <Text style={styles.small}>Android는 Google ML Kit 한국어 모델, iOS는 Apple Vision 한국어 인식을 사용해요. OCR 자체는 기기에서 처리됩니다.</Text>
      <Text style={styles.small}>OCR 네이티브 모듈은 Expo Go에 포함되지 않으므로 Development Build가 필요해요.</Text>
    </Card>

    <Card>
      <Text style={styles.title}>결제 원문 직접 입력</Text>
      <Text style={styles.text}>카드 알림·문자·카톡 결제내역·쇼핑몰 텍스트도 같은 파이프라인으로 분석할 수 있어요.</Text>
      <View style={styles.row}>
        {Object.entries(sources).map(([key, label]) => <Button
          key={key}
          title={(source === key ? '✓ ' : '') + label}
          disabled={busy}
          onPress={() => {
            setSource(key);
            setActiveNotificationId('');
            setImageUri('');
            setReview(null);
            setCandidate(null);
          }}
        />)}
      </View>
      <Field
        label="결제 / OCR 원문"
        value={rawText}
        editable={!busy}
        multiline
        numberOfLines={8}
        maxLength={5000}
        placeholder={'예) [KB국민] 12,300원 승인 10/22 13:15 스타벅스 아산점'}
        onChangeText={value => {
          setRawText(value);
          setReview(null);
          setCandidate(null);
          setError('');
        }}
      />
      <Button title={busy ? '분석 중…' : '자동 추출'} disabled={busy} onPress={preview} />
      <Text style={styles.small}>자동수집/OCR 결과도 원문 칸에 들어오므로 잘못 읽힌 내용을 고친 뒤 다시 분석할 수 있어요.</Text>
    </Card>

    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

    {candidate && <Card>
      <Text style={styles.title}>추출 결과 확인</Text>
      <Text style={styles.small}>신뢰도 {Math.round((review?.confidence || 0) * 100)}% · {review?.needs_review ? '확인 필요' : '자동 추출 양호'}</Text>
      {review?.warnings?.map((warning, index) => <Text key={index} style={styles.error}>• {warning}</Text>)}
      <Field label="사용처·내용" value={candidate.title} editable={!busy} maxLength={100} onChangeText={value => change('title', value)} />
      <Field label="금액 (원)" value={candidate.amount_krw} editable={!busy} keyboardType="number-pad" onChangeText={value => change('amount_krw', value)} />
      <Field label="날짜 (YYYY-MM-DD)" value={candidate.spent_on} editable={!busy} onChangeText={value => change('spent_on', value)} />
      <Text style={styles.text}>카테고리</Text>
      <View style={styles.row}>
        {Object.entries(categories).map(([key, label]) => <Button
          key={key}
          title={(candidate.category === key ? '✓ ' : '') + label}
          disabled={busy}
          onPress={() => change('category', key)}
        />)}
      </View>
      <Button title={busy ? '저장 중…' : '확인하고 소비내역 저장'} disabled={busy} onPress={confirm} />
      <Button title="원문 다시 분석" disabled={busy} onPress={preview} />
    </Card>}

    <Card>
      <Text style={styles.title}>자동수집 연결 상태</Text>
      <Text style={styles.text}>Android에서는 결제성 알림을 백그라운드에서 로컬 수집함에 모으고, 검토 후 소비내역에 저장할 수 있어요.</Text>
      <Text style={styles.small}>iOS는 다른 앱의 문자·알림을 직접 읽지 않고 공유/복사/OCR 경로를 사용합니다.</Text>
    </Card>
  </Page>;
}
