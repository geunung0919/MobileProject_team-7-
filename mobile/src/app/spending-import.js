import { useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Button, Card, Field, Page, styles, useTask } from '../components/UI';
import { parseMoney } from '../lib/api';
import { useSession } from '../state/Session';

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
  const { busy, error, run, setError } = useTask();
  const [source, setSource] = useState('notification');
  const [rawText, setRawText] = useState('');
  const [review, setReview] = useState(null);
  const [candidate, setCandidate] = useState(null);

  if (!api) return <Redirect href="/" />;

  const change = (key, value) => setCandidate(current => ({ ...current, [key]: value }));

  const preview = () => run(async () => {
    if (rawText.trim().length < 3) throw new Error('결제 알림이나 OCR 텍스트를 붙여 넣어 주세요.');
    const result = await api('me/spending/imports/preview', 'POST', {
      raw_text: rawText.trim(),
      source,
    });
    setReview(result);
    setCandidate({
      ...result.candidate,
      amount_krw: result.candidate.amount_krw == null ? '' : String(result.candidate.amount_krw),
    });
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
    router.replace('/spending');
  });

  return <Page title="결제 자동입력">
    <Card>
      <Text style={styles.title}>1. 원문 가져오기</Text>
      <Text style={styles.text}>카드 알림·문자·카톡 결제내역·영수증 OCR·쇼핑몰 결제 텍스트를 그대로 넣어 주세요.</Text>
      <View style={styles.row}>
        {Object.entries(sources).map(([key, label]) => <Button
          key={key}
          title={(source === key ? '✓ ' : '') + label}
          disabled={busy}
          onPress={() => { setSource(key); setReview(null); setCandidate(null); }}
        />)}
      </View>
      <Field
        label="결제 원문"
        value={rawText}
        editable={!busy}
        multiline
        numberOfLines={8}
        maxLength={5000}
        placeholder={'예) [KB국민] 12,300원 승인 10/22 13:15 스타벅스 아산점'}
        onChangeText={value => { setRawText(value); setReview(null); setCandidate(null); setError(''); }}
      />
      <Button title={busy ? '분석 중…' : '자동 추출'} disabled={busy} onPress={preview} />
      <Text style={styles.small}>원문은 추출·중복 확인에 사용됩니다. 저장 전 아래 결과를 반드시 확인하세요.</Text>
    </Card>

    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

    {candidate && <Card>
      <Text style={styles.title}>2. 추출 결과 확인</Text>
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
      <Button title="다시 추출" disabled={busy} onPress={preview} />
    </Card>}

    <Card>
      <Text style={styles.title}>자동수집 연결 상태</Text>
      <Text style={styles.text}>현재 Expo Go에서는 텍스트 가져오기·파싱·확인·저장까지 검증합니다.</Text>
      <Text style={styles.small}>Android 카드앱 알림 자동 감지는 같은 import API에 네이티브 수집기만 연결하면 됩니다. iOS는 다른 앱의 문자·알림을 임의로 읽는 방식 대신 공유/복사/OCR 입력 흐름을 유지합니다.</Text>
    </Card>
  </Page>;
}
