import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRecentAccountStore } from './recentAccountCore';

// 가린 이메일만 저장하므로 일반 저장소(웹은 브라우저 저장소)를 씁니다.
const recentAccountStore = createRecentAccountStore(AsyncStorage);
export default recentAccountStore;
