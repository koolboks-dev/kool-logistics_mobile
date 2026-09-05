import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Themes, type ThemeColors, type ThemeMode } from './tokens';

/** The three levels the user can choose between. */
export type ThemePreference = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'kool.theme.preference';

type ThemeContextValue = {
  /** The resolved appearance currently painted. */
  mode: ThemeMode;
  colors: ThemeColors;
  /** What the user picked — 'auto' follows the system. */
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: Themes.light,
  preference: 'auto',
  setPreference: () => {},
});

const FADE_IN = 170;
const FADE_OUT = 240;

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('auto');

  const target: ThemeMode =
    preference === 'auto' ? (system === 'dark' ? 'dark' : 'light') : preference;

  // `mode` lags `target` by one crossfade so the swap happens behind a cover.
  const [mode, setMode] = useState<ThemeMode>(target);
  const cover = useSharedValue(0);

  // Restore the saved preference once on mount.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'auto' || saved === 'light' || saved === 'dark') {
          setPreferenceState(saved);
        }
      })
      .catch(() => {
        // A missing or unreadable store just means we keep the default.
      });
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
  }, []);

  /**
   * Crossfade rather than a hard flip: a full-screen cover in the destination
   * background fades in, the palette swaps underneath it, then it fades out.
   * Animating every colour individually would mean threading shared values
   * through every component; this reads as one smooth transition instead.
   */
  useEffect(() => {
    if (target === mode) {
      cover.value = withTiming(0, { duration: FADE_OUT });
      return;
    }
    cover.value = withTiming(1, { duration: FADE_IN }, (finished) => {
      if (finished) runOnJS(setMode)(target);
    });
  }, [target, mode, cover]);

  const coverStyle = useAnimatedStyle(() => ({ opacity: cover.value }));

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, colors: Themes[mode], preference, setPreference }),
    [mode, preference, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: Themes[mode].background }}>
        {children}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: Themes[target].background },
            coverStyle,
          ]}
        />
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Convenience: just the colors. */
export function useColors() {
  return useContext(ThemeContext).colors;
}
