import React from 'react';
import {Text} from 'react-native';
import {styles} from './UI';
export default function ReferenceNotice({dateType}){return <Text style={styles.muted}>{dateType==='package'?'표시 소비기한은 제품 포장에 적힌 날짜예요.':dateType==='reference'?'보관 참고일은 사용자가 직접 설정한 참고 날짜예요.':'표시 소비기한은 제품 포장 날짜, 보관 참고일은 직접 설정한 참고 날짜예요.'} D-Day만으로 식품의 안전성을 판단하지 않아요. 기한 경과 시 자동 폐기하지 않으며 보관 방법을 바꿔도 날짜는 자동 연장되지 않아요.</Text>;}
