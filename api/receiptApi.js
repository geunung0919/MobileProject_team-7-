import {auth} from '../firebase/firebaseConfig';
import {environment} from '../config/environment';

// Callers retain receiptId, receiptItemId and requestId across retries.
async function request(path, body, expectedUid) {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('로그인 후 저장해 주세요.');
  if (expectedUid && expectedUid !== user.uid) throw new Error('계정이 변경됐어요.');
  const base = environment.firebaseTarget === 'cloud'
    ? environment.cloudApiBaseUrl
    : `http://${environment.devHost}:5001/solo-living-ai/asia-northeast3/api`;
  if (!base) throw new Error('공통 서버 주소가 필요해요.');
  if (environment.firebaseTarget === 'cloud' && !base.startsWith('https://')) throw new Error('공통 서버의 HTTPS 주소를 설정해 주세요.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const token = await user.getIdToken();
    if (auth.currentUser?.uid !== user.uid) throw new Error('계정이 변경됐어요.');
    const response = await fetch(`${base.replace(/\/$/, '')}${path}`, {
      method: body ? 'POST' : 'GET', signal: controller.signal,
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
      ...(body ? {body: JSON.stringify(body)} : {}),
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || '서버 요청 실패');
      error.status = response.status;
      throw error;
    }
    if (auth.currentUser?.uid !== user.uid) throw new Error('계정이 변경됐어요.');
    return data;
  } finally { clearTimeout(timer); }
}
export const confirmReceipt = (reviewedReceipt, uid) => request('/finance/receipts/confirm', reviewedReceipt, uid);
export const listTransactions = (uid) => request('/finance/transactions', undefined, uid);
export const listFridgeItems = (uid) => request('/refrigerator/items', undefined, uid);
export const createFridgeItem = (item, uid) => request('/refrigerator/items', item, uid);
export const createTransaction = (reviewed, uid) => request('/finance/transactions', reviewed, uid);

export const loadBudget = (month, uid) => request(`/finance/budget?month=${encodeURIComponent(month)}`, undefined, uid);
export const saveBudget = (month, budget, uid, useAsDefault = false) => request('/finance/budget', { month, budget, useAsDefault }, uid);
export const listRoutines = (uid) => request('/routines', undefined, uid);
export const writeRoutine = (body, uid) => request('/routines', body, uid);
