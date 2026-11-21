import { registerRootComponent } from 'expo';
// 웹에서 Alert.alert(확인창·안내)가 동작하도록 (앱에서는 변화 없음)
import './UIUX/src/utils/webAlert';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
