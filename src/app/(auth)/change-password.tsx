import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input, Text, useToast } from '@/components/ui';
import { useChangePasswordMutation } from '@/store/auth-api';
import { apiErrorMessage } from '@/store/base-api';
import { useSession } from '@/store/session';
import { Layout, LogoRatio, Motion, Spacing, useTheme } from '@/theme';

export default function ChangePassword() {
  const router = useRouter();
  const { mode, colors } = useTheme();
  const { passwordChanged, signOut, mustChangePassword } = useSession();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentError, setCurrentError] = useState<string>();
  const [newError, setNewError] = useState<string>();
  const [confirmError, setConfirmError] = useState<string>();

  const submit = async () => {
    let ok = true;

    if (!currentPassword) {
      setCurrentError('Enter your current password');
      ok = false;
    }
    if (newPassword.length < 8) {
      setNewError('Password must be at least 8 characters');
      ok = false;
    }
    if (newPassword === currentPassword) {
      setNewError('New password must be different from the current one');
      ok = false;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match');
      ok = false;
    }
    if (!ok) return;

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }).unwrap();

      passwordChanged();
      toast.show('Password updated successfully', 'success');
      router.replace('/(tabs)/home');
    } catch (err) {
      const msg = apiErrorMessage(err, 'Could not change password. Please check your credentials.');
      toast.show(msg, 'error');
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
            <Text variant="title">
              {mustChangePassword ? 'Create a new password' : 'Change password'}
            </Text>
            <Text variant="caption" tone="secondary">
              {mustChangePassword
                ? 'Your temporary password has expired. Please choose a strong, permanent password to secure your rider account.'
                : 'Enter your current password and choose a new one.'}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(Motion.base)} style={styles.form}>
            <Input
              label="Current password"
              placeholder="Enter current password"
              leftIcon="lock-closed-outline"
              password
              value={currentPassword}
              onChangeText={(t) => {
                setCurrentPassword(t);
                setCurrentError(undefined);
              }}
              error={currentError}
              returnKeyType="next"
            />

            <Input
              label="New password"
              placeholder="At least 8 characters"
              leftIcon="key-outline"
              password
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                setNewError(undefined);
              }}
              error={newError}
              returnKeyType="next"
            />

            <Input
              label="Confirm new password"
              placeholder="Re-enter new password"
              leftIcon="key-outline"
              password
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                setConfirmError(undefined);
              }}
              error={confirmError}
              returnKeyType="go"
              onSubmitEditing={submit}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(Motion.base)} style={styles.actions}>
            <Button
              label={isLoading ? 'Updating password…' : 'Save New Password'}
              loading={isLoading}
              onPress={submit}
            />
            <Button
              label="Sign Out"
              variant="outline"
              onPress={() => {
                signOut();
                router.replace('/(auth)/sign-in');
              }}
            />
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
  actions: { gap: Spacing.md, marginTop: Spacing.sm },
});
