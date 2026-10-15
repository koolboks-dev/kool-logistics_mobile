import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';

import { ToastProvider } from '@/components/ui';
import { loadStoredTokens } from '@/lib/token-storage';
import { store } from '@/store';
import { LocationProvider } from '@/store/location';
import { RealtimeProvider } from '@/store/realtime';
import { SessionProvider, useSession } from '@/store/session';
import { useRiderMeQuery } from '@/store/rider-api';
import { AppFonts, AppThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(AppFonts);
  const [tokensReady, setTokensReady] = useState(false);

  // Read the saved session into memory before the first API call, so RTK
  // Query sends the rider's token from the very first request.
  useEffect(() => {
    loadStoredTokens().finally(() => setTokensReady(true));
  }, []);

  const fontsReady = loaded || Boolean(error);

  const onReady = useCallback(() => {
    if (fontsReady && tokensReady) SplashScreen.hideAsync();
  }, [fontsReady, tokensReady]);

  // Keep the splash up until Work Sans and the saved session are resolved, so no
  // frame renders in the system font and then reflows.
  if (!fontsReady || !tokensReady) return null;

  return (
    <ReduxProvider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onReady}>
        <SafeAreaProvider>
          <AppThemeProvider>
            <SessionProvider>
              <RealtimeProvider>
                <LocationProvider>
                  <ToastProvider>
                    <ThemedShell />
                  </ToastProvider>
                </LocationProvider>
              </RealtimeProvider>
            </SessionProvider>
          </AppThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ReduxProvider>
  );
}

/**
 * Keeps the rider on the right side of the session: signed-out riders can only
 * see the auth screens (and help), a forced password change blocks everything
 * else, and signed-in riders never land back on the auth screens. This also
 * covers a session that ends mid-use (refresh token rejected).
 */
function useSessionGuard() {
  const { status, mustChangePassword, onboardingDeferred } = useSession();
  const segments = useSegments() as string[];
  const router = useRouter();
  const top = segments[0];
  const sub = segments[1];
  // Riders with missing onboarding details (e.g. fresh sign-ups) finish it first.
  const me = useRiderMeQuery(undefined, { skip: status !== 'signedIn' || mustChangePassword });
  const needsOnboarding = me.data?.onboarding?.complete === false && !onboardingDeferred;

  useEffect(() => {
    if (status === 'booting' || status === 'offline') return;
    const inAuth = top === '(auth)';
    const onChangePassword = inAuth && sub === 'change-password';
    if (status === 'signedOut') {
      if (top !== undefined && !inAuth && top !== 'help') router.replace('/(auth)/welcome');
      return;
    }
    if (mustChangePassword) {
      if (!onChangePassword) router.replace('/(auth)/change-password');
      return;
    }
    if (needsOnboarding) {
      if (top !== 'onboarding' && top !== 'help') router.replace('/onboarding');
      return;
    }
    if (inAuth && !onChangePassword) {
      if (me.isLoading) return; // wait so a new rider goes straight to onboarding
      router.replace('/(tabs)/home');
    }
  }, [status, mustChangePassword, needsOnboarding, me.isLoading, top, sub, router]);
}

function ThemedShell() {
  const { mode, colors } = useTheme();
  useSessionGuard();

  // The native root view keeps its default (white) background whatever the JS
  // tree paints, so any gap the app does not cover — safe-area strips,
  // overscroll bounce, screen transitions — flashes white in dark mode.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  return (
    // React Navigation paints its own scene backgrounds. Without this it uses
    // its light DefaultTheme and shows white behind every screen in dark mode.
    <ThemeProvider
      value={
        mode === 'dark'
          ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, border: colors.border, text: colors.text, primary: colors.brand } }
          : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.surface, border: colors.border, text: colors.text, primary: colors.brand } }
      }
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        />
      </View>
    </ThemeProvider>
  );
}
