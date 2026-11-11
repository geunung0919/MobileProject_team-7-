import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Platform, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Page, styles, useTask } from '../components/UI';
import { parseMoney } from '../lib/api';
import { recognizeReceiptText, receiptSupport } from '../lib/receiptOcr';
import { analyzeReceiptPhoto } from '../lib/receiptFlow.mjs';
import { registerReceiptIngredients } from '../features/fridge/state/AppProvider';
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
const receiptDocumentLabels = {
  purchase_receipt: '구매 영수증',
  food_service: '카페·음식점·배달 주문',
  payment_detail: '카드 승인 상세',
  multiple_receipts: '여러 영수증이 섞인 이미지',
};

export default function SpendingImport() {
  const { api, storageScope } = useSession();
  return <SpendingImportContent key={storageScope || 'disconnected'} api={api} storageScope={storageScope} />;
}

function SpendingImportContent({ api, storageScope }) {
  const [pendingInventory, setPendingInventory] = useState(null);
  const [savedInventoryCount, setSavedInventoryCount] = useState(null);
  const params = useLocalSearchParams();
  const routeNotificationId = Array.isArray(params.notificationId)
    ? params.notificationId[0]
    : params.notificationId;
  const { busy, error, run, setError } = useTask();
  const [source, setSource] = useState('notification');
  const [rawText, setRawText] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoMode, setPhotoMode] = useState(receiptSupport.canRecognize ? 'device' : 'server');
  const [phase, setPhase] = useState('');
  const photoRequest = useRef(null);
  useEffect(() => () => { photoRequest.current?.abort(); }, []);
  const [review, setReview] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [receiptItems, setReceiptItems] = useState([]);
  const [activeNotificationId, setActiveNotificationId] = useState('');

  async function analyzeText(text, nextSource = source) {
    const normalized = text.trim();
    if (normalized.length < 3) throw new Error('결제 알림이나 OCR 텍스트를 입력해 주세요.');
    if (!api) throw new Error('사진 확인은 가능해요. 금액 분석·저장은 서버 연결 후 사용할 수 있어요.');
    setReview(null);
    setCandidate(null);
    setReceiptItems([]);
    const result = await api('me/spending/imports/preview', 'POST', {
      raw_text: normalized,
      source: nextSource,
    });
    setSource(nextSource);
    setRawText(normalized);
    setReview(result);
    setReceiptItems((result.receipt_items || []).map(item => ({
      ...item,
      selected: !!item.suggested_for_inventory,
    })));
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
        setReceiptItems([]);
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


  const change = (key, value) => setCandidate(current => ({ ...current, [key]: value }));
  const preview = () => run(() => analyzeText(rawText, source));

  const handlePickedImage = result => {
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (!asset.uri) throw new Error('사진을 확인할 수 없어요. 다시 선택해 주세요.');
    setPhoto(asset); setImageUri(asset.uri); setSource('ocr');
    setRawText(''); setReview(null); setCandidate(null); setReceiptItems([]); setActiveNotificationId('');
    setPhase('사진 준비 완료 · 내용을 확인한 뒤 분석해 주세요.');
  };

  const analyzePhoto = () => run(async () => {
    const controller = new AbortController(); photoRequest.current = controller;
    setReview(null); setCandidate(null);
    try {
      const result = await analyzeReceiptPhoto(photo, {
        mode: photoMode, api, recognize: recognizeReceiptText, onText: setRawText,
        onPhase: setPhase, signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setReview(result);
      setReceiptItems((result.receipt_items || []).map(item => ({
        ...item,
        selected: !!item.suggested_for_inventory,
      })));
      setCandidate({ ...result.candidate, amount_krw: result.candidate.amount_krw == null ? '' : String(result.candidate.amount_krw) });
      setPhase('분석 완료 · 아래 결과를 확인하고 저장해 주세요.');
    } catch (e) {
      setPhase(controller.signal.aborted ? '분석 취소 · 사진을 유지했어요.' : '분석 실패 · 사진을 다시 분석하거나 원문을 입력해 주세요.');
      throw e;
    } finally { if (photoRequest.current === controller) photoRequest.current = null; }
  });

  const takeReceiptPhoto = () => run(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error(permission.canAskAgain ? '영수증 촬영을 위해 카메라 권한이 필요해요. 다시 촬영을 누르거나 앨범에서 선택해 주세요.' : '카메라 권한이 꺼져 있어요. 기기 설정에서 허용하거나 사진첩에서 선택해 주세요.');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS === 'android',
      base64: true,
      exif: false,
      quality: 0.85,
    });
    await handlePickedImage(result);
  });

  const pickReceiptImage = () => run(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS === 'android',
      base64: true,
      exif: false,
      quality: 0.85,
    });
    await handlePickedImage(result);
  });

  const addReceiptInventory = async ({ expense, items }) => {
    await registerReceiptIngredients(storageScope, expense, items);
    setPendingInventory(null);
    setSavedInventoryCount(items.length);
  };

  const changeReceiptItem = (index, patch) => setReceiptItems(items =>
    items.map((item, current) => current === index ? { ...item, ...patch } : item));
  const inventoryAllowed = source === 'ocr'
    ? review?.receipt_document?.allow_inventory !== false
    : false;
  const ingredients = candidate && source === 'ocr' && inventoryAllowed
    ? receiptItems.filter(item => item.selected).map(item => ({
        name: (item.normalized_name || item.raw_name).trim(),
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        unit: item.unit || '개',
        dateType: 'unknown',
        expiresAt: '',
      }))
    : [];
  const confirm = () => run(async () => {
    if (!api) throw new Error('소비내역 저장에는 서버 연결이 필요해요.');
    if (!candidate) throw new Error('먼저 자동 추출을 실행해 주세요.');
    const title = candidate.title.trim();
    if (!title || title === '사용처 확인 필요') throw new Error('사용처를 확인해서 입력해 주세요.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate.spent_on)) throw new Error('날짜를 YYYY-MM-DD 형식으로 입력해 주세요.');
    if (source === 'ocr' && receiptItems.some(item =>
      item.selected && (!item.normalized_name?.trim() || item.normalized_name.trim() === '상품명 확인 필요')
    )) {
      throw new Error('바코드만 인식된 품목은 냉장고에 넣기 전에 상품명을 입력해 주세요.');
    }
    const saved = await api('me/spending/imports/confirm', 'POST', {
      raw_text: rawText.trim(),
      source,
      title,
      amount_krw: parseMoney(candidate.amount_krw, false),
      spent_on: candidate.spent_on,
      category: candidate.category,
      receipt_items: source === 'ocr' ? receiptItems.map(item => ({
        raw_name: item.raw_name,
        normalized_name: item.normalized_name || item.raw_name,
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        unit: item.unit || '개',
        item_amount_krw: item.item_amount_krw || null,
        product_code: item.product_code || null,
        item_type: item.selected
          ? 'ingredient'
          : (item.item_type === 'ingredient' ? 'unknown' : (item.item_type || 'unknown')),
        is_ingredient: !!item.selected,
        ingredient_confidence: Number(item.ingredient_confidence) || 0,
        match_method: item.match_method || null,
        matched_alias: item.matched_alias || null,
        suggested_for_inventory: !!item.selected,
      })) : [],
    });
    if (activeNotificationId) {
      try {
        markProcessedNotifications([activeNotificationId]);
      } catch {
        // 서버 저장 성공을 로컬 수집함 정리 실패 때문에 취소하지 않는다.
      }
    }
    if (saved.import_source === 'ocr' && ingredients.length) {
      const job = { expense: saved, items: ingredients };
      setPendingInventory(job);
      await addReceiptInventory(job);
    } else {
      router.replace('/spending');
    }
  });

  if (pendingInventory || savedInventoryCount !== null) return <Page title="소비 내역 저장 완료">
    {pendingInventory ? <>
      <Text style={styles.text}>결제는 저장됐어요. 식재료만 냉장고에 등록하고 있어요.</Text>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Button title="냉장고 등록만 다시 시도" disabled={busy} onPress={() => run(() => addReceiptInventory(pendingInventory))} />
    </> : <Text style={styles.text}>식재료 {savedInventoryCount}개 품목을 냉장고에 등록했어요.</Text>}
    <Button title="소비 내역 보기" disabled={busy} onPress={() => router.replace('/spending')} />
    <Button title="냉장고 보기" disabled={busy} onPress={() => router.replace('/fridge/inventory')} />
  </Page>;

  return <Page title="영수증 · 결제 자동입력">
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {!api && <Card><Text style={styles.text}>서버 연결 없이 촬영·사진 확인을 할 수 있어요. 분석·저장은 연결 후 사용할 수 있어요. 이 화면의 사진·입력은 임시이며 화면을 나가면 유지되지 않을 수 있어요.</Text><Button title="서버 연결 화면" disabled={busy} onPress={() => router.replace('/')} /></Card>}
    {!!activeNotificationId && <Card>
      <Text style={styles.text}>✓ Android 자동수집함에서 가져온 결제 알림이에요.</Text>
      <Text style={styles.small}>내용을 확인하거나 고친 뒤 저장하면 수집함에서도 자동으로 제거돼요.</Text>
    </Card>}

    <Card>
      <Text style={styles.title}>영수증 사진 OCR</Text>
      <Text style={styles.text}>{receiptSupport.message}</Text>
      <View style={styles.row}>
        <Button title={busy ? '처리 중…' : '영수증 촬영'} disabled={busy} onPress={takeReceiptPhoto} />
        <Button title="사진첩에서 영수증 업로드" disabled={busy} onPress={pickReceiptImage} />
      </View>
      {!!imageUri && <Image source={{ uri: imageUri }} style={{ width: '100%', height: 320, borderRadius: 12, backgroundColor: '#eef3f0' }} resizeMode="contain" />}
      {!!photo && <>
        <Text style={styles.small}>사진 확인 → 분석 → 결과 수정 → 저장</Text>
        {!!phase && <Text accessibilityLiveRegion="polite" style={styles.text}>{phase}</Text>}
        <Text style={styles.small}>한 번에 영수증 한 장만, 글자와 합계가 선명하게 보이도록 확인해 주세요. 여러 영수증이 겹치면 한 장만 남도록 잘라 주세요. 분석 전에는 지출이나 재고에 저장되지 않아요.</Text>
        {receiptSupport.canRecognize && <View style={styles.row}>
          <Button title={(photoMode === 'device' ? '✓ ' : '') + '기기 인식'} disabled={busy} onPress={() => setPhotoMode('device')} />
          <Button title={(photoMode === 'hybrid' ? '✓ ' : '') + '정확도 우선'} disabled={busy} onPress={() => setPhotoMode('hybrid')} />
          <Button title={(photoMode === 'server' ? '✓ ' : '') + '서버 인식'} disabled={busy} onPress={() => setPhotoMode('server')} />
        </View>}
        <Text style={styles.small}>{photoMode === 'server'
          ? '선택한 사진을 서버로 보내 여러 전처리 방식의 OCR 결과를 비교해요. 사진은 분석용 임시 파일로만 처리하고 분석 후 삭제해요.'
          : photoMode === 'hybrid'
            ? '기기 OCR과 서버 OCR을 동시에 비교해 품목·총액·사용처 추출이 더 좋은 결과를 사용해요. 이 모드에서는 사진이 연결된 서버로 전송돼요.'
            : '사진은 기기에서 인식하고 추출한 글자만 연결된 서버로 전송해요.'}</Text>
        <Button
          title={busy
            ? '분석 중…'
            : photoMode === 'hybrid'
              ? '사진 전송에 동의하고 정확도 우선 분석'
              : photoMode === 'server'
                ? '사진 전송에 동의하고 서버 분석'
                : '이 사진 분석하기'}
          disabled={busy || !api}
          onPress={analyzePhoto}
        />
        {busy && <Button title="사진 분석 취소" onPress={() => photoRequest.current?.abort()} />}
        <Button title="선택한 사진 지우기" disabled={busy} onPress={() => {
          setPhoto(null); setImageUri(''); setRawText(''); setReview(null); setCandidate(null); setReceiptItems([]); setPhase(''); setError('');
        }} />
      </>}
      <Text style={styles.small}>JPG·PNG 사진을 권장해요. 서버 전송은 8MB 이하이며 PDF·여러 장 일괄 분석은 아직 지원하지 않아요.</Text>
      {!!error && <Button title="카메라 권한 설정 열기" disabled={busy} onPress={() => run(() => Linking.openSettings())} />}
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
            setPhoto(null);
            setImageUri('');
            setReview(null);
            setCandidate(null);
            setReceiptItems([]);
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
          setReceiptItems([]);
          setError('');
        }}
      />
      <Button title={busy ? '분석 중…' : '자동 추출'} disabled={busy || !api} onPress={preview} />
      <Text style={styles.small}>추출 점수는 규칙의 충족 정도이며 실제 정확도 확률이 아니에요.</Text>
      <Text style={styles.small}>자동수집/OCR 결과도 원문 칸에 들어오므로 잘못 읽힌 내용을 고친 뒤 다시 분석할 수 있어요.</Text>
    </Card>

    {candidate && <Card>
      <Text style={styles.title}>추출 결과 확인</Text>
      <Text style={styles.small}>규칙 기반 추출 점수 {Math.round((review?.confidence || 0) * 100)}점 · {review?.needs_review ? '확인 필요' : '자동 추출 양호'}</Text>
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
      {source === 'ocr' && <Card>
        <Text style={styles.title}>영수증 품목 확인</Text>
        <Text style={styles.small}>
          {receiptDocumentLabels[review?.receipt_document?.document_type] || '영수증'} · 품목 {receiptItems.length}개 · 냉장고 등록 {ingredients.length}개
        </Text>
        {!!review?.learned_item_count && <Text style={styles.small}>
          ✓ 이전에 직접 확인한 상품 {review.learned_item_count}개를 자동 적용했어요.
        </Text>}
        {review?.ai_fallback?.status === 'applied' && <Text style={styles.small}>
          AI 보조 분류 {review.ai_fallback.classified_count}개 · 자동 냉장고 후보 {review.ai_fallback.auto_selected_count}개
        </Text>}
        {inventoryAllowed
          ? <Text style={styles.small}>자동 판별이 틀리면 직접 냉장고 포함 여부를 바꿀 수 있어요.</Text>
          : <Text style={styles.error}>이 문서는 소비 확인용으로만 처리해요. 음식점·카페·카드 승인 상세·여러 영수증 이미지는 냉장고 자동등록 대상이 아니에요.</Text>}
        {!receiptItems.length && <Text style={styles.error}>개별 품목을 분리하지 못했어요. 원문을 수정해 다시 분석하거나 소비만 저장할 수 있어요.</Text>}
        {receiptItems.map((item, index) => <View key={`${item.raw_name}-${index}`} style={{ gap: 8, borderTopWidth: index ? 1 : 0, borderTopColor: '#e1eae5', paddingTop: index ? 10 : 0 }}>
          <Text style={styles.text}>{item.raw_name}</Text>
          {!!item.product_code && <Text style={styles.small}>바코드 {item.product_code}</Text>}
          <Text style={styles.small}>
            {item.item_amount_krw ? Number(item.item_amount_krw).toLocaleString('ko-KR') + '원 · ' : ''}
            {item.item_type === 'ingredient' ? '식재료 후보' : item.item_type === 'living' ? '생활용품' : item.item_type === 'food' ? '가공식품/완제품' : '분류 확인 필요'}
            {item.match_method === 'fuzzy' ? ' · OCR 오타 유사매칭' : ''}
            {item.match_method === 'learned' ? ' · 이전 확인값 적용' : ''}
            {item.match_method === 'ai' ? ' · AI 보조분류' : ''}
            {item.row_consistent === false ? ' · 수량/금액 확인 필요' : ''}
          </Text>
          {item.selected && <>
            <Field
              label="냉장고에 저장할 이름"
              value={item.normalized_name || item.raw_name}
              editable={!busy}
              maxLength={120}
              onChangeText={value => changeReceiptItem(index, { normalized_name: value })}
            />
            <Field
              label="수량"
              value={String(item.quantity || 1)}
              editable={!busy}
              keyboardType="decimal-pad"
              onChangeText={value => changeReceiptItem(index, { quantity: value })}
            />
          </>}
          <Button
            title={item.selected ? '✓ 냉장고에 추가' : '냉장고에서 제외'}
            disabled={busy || !inventoryAllowed}
            onPress={() => changeReceiptItem(index, { selected: !item.selected })}
          />
        </View>)}
        {!!ingredients.length && <Text style={styles.small}>
          저장 예정: {ingredients.map(item => item.name + ' × ' + item.quantity).join(', ')} · 소비기한은 미확인으로 등록돼요.
        </Text>}
      </Card>}
      <Button title={busy ? '저장 중…' : '확인하고 저장'} disabled={busy} onPress={confirm} />
      <Button title="원문 다시 분석" disabled={busy || !api} onPress={preview} />
    </Card>}

    <Card>
      <Text style={styles.title}>자동수집 연결 상태</Text>
      <Text style={styles.text}>Android에서는 결제성 알림을 백그라운드에서 로컬 수집함에 모으고, 검토 후 소비내역에 저장할 수 있어요.</Text>
      <Text style={styles.small}>iOS는 다른 앱의 문자·알림을 직접 읽지 않고 공유/복사/OCR 경로를 사용합니다.</Text>
    </Card>
  </Page>;
}
