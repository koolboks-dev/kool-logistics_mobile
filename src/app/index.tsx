import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSession } from '@/store/session';
import { useColors } from '@/theme';

export default function Entry() {
  const { status, mustChangePassword } = useSession();
  const c = useColors();

  if (status === 'booting') {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={c.brand} />
      </View>
    );
  }

  if (status === 'signedIn') {
    if (mustChangePassword) {
      return <Redirect href={'/(auth)/change-password' as any} />;
    }
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
