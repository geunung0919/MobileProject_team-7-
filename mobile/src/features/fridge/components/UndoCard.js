import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { Card, Button, styles } from './UI';
import { useApp } from '../state/AppProvider';
export default function UndoCard() {
 const { state, undoLatest } = useApp();
 const [busy,setBusy] = useState(false);
 const lock = useRef(false);
 if(!state.undo) return null;
 async function undo() {
  if(lock.current)return;
  lock.current=true;setBusy(true);
  try { await undoLatest(state.undo.id); } catch {} finally { lock.current=false;setBusy(false); }
 }
 return <Card><Text style={styles.label}>{state.undo.label} · {state.undo.kind==='meal'?'식사 차감':'폐기'} 완료</Text>
  <Text style={styles.muted}>되돌리면 재고·금액을 복구하고 해당 기록을 취소해요. 다음 재고 변경 전까지만 가능해요.</Text>
  <Button title={busy?'복구 중…':'되돌리기'} disabled={busy} onPress={undo}/></Card>;
}
