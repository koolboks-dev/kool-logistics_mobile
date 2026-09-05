import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui';
import { AppProvider } from '@/store/app';
import { AppFonts, AppThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(AppFonts);

  const onReady = useCallback(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // Keep the splash up until Poppins is resolved, so no frame renders in the
  // system font and then reflows.
  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onReady}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <AppProvider>
            <ToastProvider>
              <ThemedShell />
            </ToastProvider>
          </AppProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedShell() {
  const { mode, colors } = useTheme();

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
