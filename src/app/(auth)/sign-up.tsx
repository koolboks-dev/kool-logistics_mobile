import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glyph } from '@/components/icons/Glyph';
import { Button, GlassBackButton, Input, PinInput, ProgressBar, Select, Text, useToast } from '@/components/ui';
import { writeStoredTokens } from '@/lib/token-storage';
import {
  useRegisterStartMutation,
  useRegisterVerifyMutation,
  useSetPasswordMutation,
  type Market,
} from '@/store/auth-api';
import { apiErrorMessage, baseApi } from '@/store/base-api';
import { useAppDispatch } from '@/store/hooks';
import { useSession } from '@/store/session';
import { Layout, Radius, Spacing, useTheme } from '@/theme';

type Step = 'account' | 'verify' | 'password';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_LENGTH = 6;
/** The two markets the backend serves (same as the web sign-up). */
const DIAL_CODES = [
  { label: '🇳🇬 +234', value: '+234' },
  { label: '🇰🇪 +254', value: '+254' },
];
const marketFor = (dial: string): Market => (dial === '+254' ? 'KE' : 'NG');

/**
 * Create a rider account — the same flow as Kool Logistics Web:
 *   1. Account  — email + phone → a 6-digit code is sent
 *   2. Verify   — the code creates the account and signs it in
 *   3. Password — used to sign in to the app and the web
 * The session guard then takes the new rider to onboarding.
 */
export default function SignUp() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { startSession } = useSession();

  const [registerStart, { isLoading: sending }] = useRegisterStartMutation();
  const [registerVerify, { isLoading: verifying }] = useRegisterVerifyMutation();
  const [savePassword, { isLoading: saving }] = useSetPasswordMutation();

  const [step, setStep] = useState<Step>('account');
  const [email, setEmail] = useState('');
  const [dial, setDial] = useState('+234');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Partial<Record<'email' | 'phone' | 'code' | 'password' | 'confirm', string>>>({});
  const [finishing, setFinishing] = useState(false);

  const cleanEmail = email.trim().toLowerCase();
  const body = {
    email: cleanEmail,
    phone_number: `${dial}${phone.replace(/\D/g, '').replace(/^0/, '')}`,
    market: marketFor(dial),
    role: 'rider' as const,
  };

  const sendCode = async (resend = false) => {
    try {
      const res = await registerStart(body).unwrap();
      if (resend) toast.show('New code sent', 'success');
      else setStep('verify');
      // Development backends echo the code — fill it in to save a trip to the inbox.
      if (res.code) {
        setCode(res.code);
        toast.show(`Dev code: ${res.code}`, 'info');
      }
    } catch (err) {
      toast.show(apiErrorMessage(err, "We couldn't send your code. Please try again."), 'error');
    }
  };

  const submitAccount = async () => {
    const next: typeof errors = {};
    if (!EMAIL_RE.test(cleanEmail)) next.email = 'Enter a valid email address';
    if (phone.replace(/\D/g, '').length < 7) next.phone = 'Enter a valid phone number';
    setErrors(next);
    if (Object.keys(next).length) return;
    if (!agreed) {
      toast.show('Please accept the Terms & Conditions to continue.', 'error');
      return;
    }
    await sendCode();
  };

  const submitCode = async (value = code) => {
    if (value.length < OTP_LENGTH) {
      setErrors({ code: `Enter the ${OTP_LENGTH}-digit code we sent you` });
      return;
    }
    setErrors({});
    try {
      dispatch(baseApi.util.resetApiState());
      const res = await registerVerify({ ...body, code: value }).unwrap();
      // Stored now so the password call is authenticated; the session itself
      // starts after the password is set.
      writeStoredTokens({ access: res.access, refresh: res.refresh });
      setStep('password');
    } catch (err) {
      toast.show(apiErrorMessage(err, "That code didn't work. Check it and try again."), 'error');
    }
  };

  const submitPassword = async () => {
    const next: typeof errors = {};
    if (password.length < 8) next.password = 'Use at least 8 characters';
    else if (password !== confirm) next.confirm = "The passwords don't match";
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      await savePassword({ password }).unwrap();
      setFinishing(true);
      toast.show('Account created — now tell us about yourself', 'success');
      await startSession(); // the session guard opens onboarding
    } catch (err) {
      setFinishing(false);
      toast.show(apiErrorMessage(err, "We couldn't save your password. Please try again."), 'error');
    }
  };

  const stepIndex = step === 'account' ? 0 : step === 'verify' ? 1 : 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.md }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <GlassBackButton
              onPress={() => {
                if (step === 'verify') setStep('account');
                else router.back();
              }}
            />
            <Text variant="caption" tone="secondary">
              Step {stepIndex + 1} of 3
            </Text>
          </View>
          <ProgressBar value={(stepIndex + 1) / 3} />

          {step === 'account' && (
            <Animated.View style={styles.form}>
              <View style={{ gap: Spacing.xs }}>
                <Text variant="title">Create your rider account</Text>
                <Text variant="caption" tone="secondary">
                  Deliver packages with Koolboks and earn. We&apos;ll send a code to confirm your email.
                </Text>
              </View>

              <Input
                label="Email address"
                placeholder="you@example.com"
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setErrors((e) => ({ ...e, email: undefined }));
                }}
                error={errors.email}
                editable={!sending}
              />

              <View style={{ gap: Spacing.xs }}>
                <Text variant="caption" tone="secondary">
                  Phone number
                </Text>
                <View style={styles.phoneRow}>
                  <View style={{ width: 128 }}>
                    <Select options={DIAL_CODES} value={dial} onChange={setDial} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      placeholder="803 000 0000"
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      value={phone}
                      onChangeText={(t) => {
                        setPhone(t.replace(/[^\d\s]/g, ''));
                        setErrors((e) => ({ ...e, phone: undefined }));
                      }}
                      error={errors.phone}
                      editable={!sending}
                    />
                  </View>
                </View>
              </View>

              <Pressable
                onPress={() => setAgreed((a) => !a)}
                style={styles.agreeRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreed }}
              >
                <View
                  style={[
                    styles.box,
                    {
                      borderColor: agreed ? colors.brand : colors.border,
                      backgroundColor: agreed ? colors.brand : 'transparent',
                    },
                  ]}
                >
                  {agreed && <Glyph name="checkmark-done" size={14} color="#FFFFFF" />}
                </View>
                <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
                  I agree to the <Text variant="caption">Terms &amp; Conditions</Text> and{' '}
                  <Text variant="caption">Privacy Policy</Text> of Kool Logistics.
                </Text>
              </Pressable>

              <Button label={sending ? 'Sending code…' : 'Continue'} loading={sending} onPress={submitAccount} />

              <Pressable onPress={() => router.replace('/(auth)/sign-in')} style={styles.switchRow}>
                <Text variant="caption" tone="secondary">
                  Already have a rider account? <Text variant="caption" tone="brand">Sign in</Text>
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {step === 'verify' && (
            <Animated.View style={styles.form}>
              <View style={{ gap: Spacing.xs }}>
                <Text variant="title">Verify your email</Text>
                <Text variant="caption" tone="secondary">
                  Enter the {OTP_LENGTH}-digit code we sent to <Text variant="caption">{cleanEmail}</Text>.
                </Text>
              </View>

              <PinInput
                length={OTP_LENGTH}
                value={code}
                onChange={(v) => {
                  setCode(v);
                  setErrors({});
                }}
                onComplete={(v) => void submitCode(v)}
                error={errors.code}
              />

              <Button label={verifying ? 'Verifying…' : 'Verify'} loading={verifying} onPress={() => void submitCode()} />

              <View style={styles.linkRow}>
                <Pressable onPress={() => setStep('account')} hitSlop={8}>
                  <Text variant="caption" tone="secondary">
                    Change details
                  </Text>
                </Pressable>
                <Pressable onPress={() => void sendCode(true)} disabled={sending} hitSlop={8}>
                  <Text variant="caption" tone="brand">
                    {sending ? 'Sending…' : 'Resend code'}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {step === 'password' && (
            <Animated.View style={styles.form}>
              <View style={{ gap: Spacing.xs }}>
                <Text variant="title">Set your password</Text>
                <Text variant="caption" tone="secondary">
                  You&apos;ll use it to sign in to the Koolboks rider app and Kool Logistics on the web.
                </Text>
              </View>

              <Input
                label="Password"
                placeholder="At least 8 characters"
                leftIcon="lock-closed-outline"
                password
                autoCapitalize="none"
                autoComplete="new-password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setErrors({});
                }}
                error={errors.password}
              />
              <Input
                label="Confirm password"
                placeholder="Type it again"
                leftIcon="lock-closed-outline"
                password
                autoCapitalize="none"
                autoComplete="new-password"
                value={confirm}
                onChangeText={(t) => {
                  setConfirm(t);
                  setErrors({});
                }}
                error={errors.confirm}
                returnKeyType="go"
                onSubmitEditing={submitPassword}
              />

              <Button
                label={saving || finishing ? 'Creating account…' : 'Create account'}
                loading={saving || finishing}
                onPress={submitPassword}
              />
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  form: { gap: Spacing.lg, marginTop: Spacing.sm },
  phoneRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  box: { width: 20, height: 20, borderRadius: Radius.sm / 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  switchRow: { alignSelf: 'center', paddingVertical: Spacing.xs },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
