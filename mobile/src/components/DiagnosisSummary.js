import { Text } from 'react-native';
import { Card, styles } from './UI';
import { won } from '../lib/api';

const labels = {
  experience: { unknown: '자취 기간 미입력', new: '자취 시작 단계', experienced: '자취 경험이 있는 단계' },
  cooking_environment: { unknown: '조리 도구 미입력', no_tools: '조리 도구 없음', microwave_only: '전자레인지 중심', equipped: '조리 도구 보유' },
  cooking_frequency: { unknown: '요리 횟수 미입력', rare: '주 0~2일 요리', regular: '주 3~7일 요리' },
};
const fields = {
  living_months: '자취 기간', cooking_days_per_week: '요리 횟수', cooking_tools: '조리 도구',
  monthly_budget_krw: '월 생활비 목표', region_code: '거주 지역', priority: '생활 목표',
  initial_inventory_state: '초기 재고 상태',
};
export function DiagnosisSummary({ result }) {
  return <Card>
    <Text style={styles.text}>내 자취 진단</Text>
    {Object.entries(labels).map(([key, values]) =>
      <Text key={key} style={styles.text}>{values[result.diagnosis[key]] || '확인 필요'}</Text>)}
    <Text style={styles.text}>월 생활비 목표: {won(result.profile.monthly_budget_krw)}</Text>
    <Text style={styles.small}>입력한 정보를 정해진 기준으로 분류한 결과예요. AI 코칭은 별도 기능이에요.</Text>
    <Text style={styles.small}>생활비 목표는 실제 월 예산에 자동 적용되지 않아요.</Text>
    {!!result.diagnosis.missing_fields.length && <Text style={styles.small}>
      나중에 입력할 항목: {result.diagnosis.missing_fields.map(key => fields[key] || key).join(', ')}
    </Text>}
  </Card>;
}
