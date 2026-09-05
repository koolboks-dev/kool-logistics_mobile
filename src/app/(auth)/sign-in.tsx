import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input, Text, useToast } from '@/components/ui';
import { useApp } from '@/store/app';
import { Layout, LogoRatio, Motion, Spacing, useTheme } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const router = useRouter();
  const { mode, colors } = useTheme();
  const { signIn } = useApp();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = () => {
    let ok = true;

    if (!EMAIL_RE.test(email.trim())) {
      setEmailError('Enter a valid email address');
      ok = false;
    }
    if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      ok = false;
    }
    if (!ok) return;

    setBusy(true);
    setTimeout(() => {
      signIn(email.trim());
      toast.show('Welcome back', 'success');
      router.replace('/(tabs)/home');
    }, 700);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(Motion.base)}>
            <Image
              source={
                mode === 'dark'
                  ? require('@/assets/images/logo/logo-white-bg.png')
                  : require('@/assets/images/logo/logo.png')
              }
              style={{ width: 92, height: 92 / LogoRatio }}
              contentFit="contain"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(Motion.base)}>
            <Text variant="title">Hi there 👋</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(Motion.base)} style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setEmailError(undefined);
              }}
              error={emailError}
              returnKeyType="next"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              leftIcon="lock-closed-outline"
              password
              autoCapitalize="none"
              autoComplete="password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setPasswordError(undefined);
              }}
              error={passwordError}
              returnKeyType="go"
              onSubmitEditing={submit}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(Motion.base)} style={styles.action}>
            <Button label={busy ? 'Logging in…' : 'Log In'} loading={busy} onPress={submit} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xl,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  form: { gap: Spacing.lg },
  action: { marginTop: Spacing.md },
});
