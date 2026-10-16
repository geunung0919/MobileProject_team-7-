import { Redirect, Stack } from 'expo-router';
import { useSession } from '../../state/Session';
import { AppProvider } from '../../features/fridge/state/AppProvider';
export default function FridgeLayout() {
  const { api, storageScope } = useSession();
  if (!api || !storageScope) return <Redirect href="/" />;
  return <AppProvider key={storageScope} storageKey={storageScope}><Stack screenOptions={{ headerTintColor: '#166b55', title: '냉장고·식사' }} /></AppProvider>;
}
