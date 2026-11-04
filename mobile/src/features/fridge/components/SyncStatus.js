import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Text } from 'react-native';
import { Card, Button, styles } from './UI';
import { useApp } from '../state/AppProvider';
export default function SyncStatus() {
 const {state,syncBusy,syncError,syncInventoryNow}=useApp();
 const meta=state.inventorySync;
 useFocusEffect(useCallback(()=>{if(meta?.enabled)syncInventoryNow().catch(()=>{});},[meta?.enabled,syncInventoryNow]));
 return <Card><Text style={styles.label}>서버 재고 · {syncBusy?'확인 중':meta?.enabled?'자동 연결 켜짐':meta?'연결 일시중지':'연결 전'}</Text>
  {!!syncError&&<Text accessibilityRole="alert" style={styles.error}>{syncError}</Text>}
  <Text style={styles.muted}>{meta?.enabled?'화면을 열거나 재고를 바꾸면 서버와 비교해요. 연결 실패 시 기기 변경은 보존돼요.':'처음 한 번 기기와 서버의 재고를 비교하고 연결해 주세요.'}</Text>
  <Button secondary title="서버 재고 연결 / 충돌 확인" disabled={syncBusy} onPress={()=>router.push('/fridge/sync')}/>
 </Card>;
}
