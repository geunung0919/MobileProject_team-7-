import React from 'react';
import { Text } from 'react-native';
import { styles } from './UI';
export default function ReferenceNotice() {
 return <Text style={styles.muted}>D-Day는 입력한 날짜 기준의 보관 참고일(추정)이에요. 실제 식품의 안전성을 보장하지 않으며, 기한이 지나도 자동 폐기되지 않아요. 보관 방법 변경 시 날짜는 자동 연장되지 않아요.</Text>;
}
