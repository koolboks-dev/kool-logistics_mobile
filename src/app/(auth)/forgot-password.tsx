import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input, Text, useToast } from '@/components/ui';
import { useForgotPasswordRequestMutation, useForgotPasswordResetMutation } from '@/store/auth-api';
import { apiErrorMessage } from '@/store/base-api';
import { Layout, Motion, Spacing, useTheme } from '@/theme';

export default function ForgotPassword() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [codeError, setCodeError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();

  const [requestReset, { isLoading: requesting }] = useForgotPasswordRequestMutation();
  const [confirmReset, { isLoading: resetting }] = useForgotPasswordResetMutation();

  const handleRequest = async () => {
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Enter a valid email address');
      return;
    }
    try {
      await requestReset({ email: email.trim() }).unwrap();
      toast.show('Reset code sent to your email', 'success');
      setStep('reset');
    } catch (err) {
      toast.show(apiErrorMessage(err, 'Failed to send reset code. Please try again.'), 'error');
    }
  };

  const handleReset = async () => {
    let ok = true;
    if (!code.trim()) {
      setCodeError('Enter the 6-digit reset code');
      ok = false;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      ok = false;
    }
    if (!ok) return;

    try {
      await confirmReset({
        email: email.trim(),
        code: code.trim(),
        new_password: newPassword,
      }).unwrap();
      toast.show('Password reset successfully. Sign in with your new password.', 'success');
      router.replace('/(auth)/sign-in');
    } catch (err) {
      toast.show(apiErrorMessage(err, 'Invalid reset code or password. Please try again.'), 'error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(Motion.base)}>
            <Text variant="title">Reset password</Text>
            <Text variant="caption" tone="secondary">
              {step === 'request'
                ? "Enter your account email and we'll send you a password reset code."
                : `Enter the code sent to ${email} and set your new password.`}
            </Text>
          </Animated.View>

          {step === 'request' ? (
            <Animated.View entering={FadeInDown.delay(60).duration(Motion.base)} style={styles.form}>
              <Input
                label="Email"
                placeholder="Enter your email"
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setEmailError(undefined);
                }}
                error={emailError}
                returnKeyType="go"
                onSubmitEditing={handleRequest}
              />
              <Button
                label={requesting ? 'Sending code…' : 'Send Reset Code'}
                loading={requesting}
                onPress={handleRequest}
              />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(60).duration(Motion.base)} style={styles.form}>
              <Input
                label="Reset code"
                placeholder="Enter reset code"
                leftIcon="key-outline"
                keyboardType="number-pad"
                value={code}
                onChangeText={(t) => {
                  setCode(t);
                  setCodeError(undefined);
                }}
                error={codeError}
                returnKeyType="next"
              />
              <Input
                label="New password"
                placeholder="At least 8 characters"
                leftIcon="lock-closed-outline"
                password
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  setPasswordError(undefined);
                }}
                error={passwordError}
                returnKeyType="go"
                onSubmitEditing={handleReset}
              />
              <Button
                label={resetting ? 'Resetting…' : 'Reset Password'}
                loading={resetting}
                onPress={handleReset}
              />
            </Animated.View>
          )}

          <Button
            label="Back to Sign In"
            variant="ghost"
            onPress={() => router.replace('/(auth)/sign-in')}
          />
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
});
