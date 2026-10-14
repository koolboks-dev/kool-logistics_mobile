import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { ChevronMarkIcon } from '@/components/icons';
import { Button, EmptyState } from '@/components/ui';
import { useSession } from '@/store/session';
import { Layout, useColors } from '@/theme';

export default function Entry() {
  const { status, mustChangePassword, retry, signOut } = useSession();
  const c = useColors();

  if (status === 'booting') {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' }}>
        <ChevronMarkIcon size={56} color={c.brand} accessibilityLabel="Loading" />
      </View>
    );
  }

  // Saved session but the server is unreachable — don't throw the rider out.
  if (status === 'offline') {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, justifyContent: 'center', padding: Layout.screenPadding }}>
        <EmptyState
          art="offline"
          title="Can't reach Koolboks"
          description="Check your internet connection and try again. You are still signed in."
          actionLabel="Try again"
          onAction={retry}
        />
        <Button label="Sign out" variant="ghost" size="md" onPress={() => signOut()} />
      </View>
    );
  }

  if (status === 'signedIn') {
    return <Redirect href={mustChangePassword ? '/(auth)/change-password' : '/(tabs)/home'} />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
