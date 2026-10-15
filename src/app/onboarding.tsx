import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glyph } from '@/components/icons/Glyph';
import { Avatar, Button, Chip, ChipGroup, Input, ProgressBar, Select, Text, useToast } from '@/components/ui';
import {
  AVAILABILITY,
  BANKS,
  FLEXIBLE_HOURS,
  HOURS,
  ID_TYPES,
  PAYOUT,
  RIDER_TYPES,
  STATES,
  TIME_SLOTS,
  ZONES,
  formatWorkingHours,
  parseWorkingHours,
  toOptions,
} from '@/data/rider-options';
import { uploadLocalFile } from '@/lib/upload';
import { apiErrorMessage } from '@/store/base-api';
import { useRiderMeQuery, useUpdateRiderMeMutation, type RiderOnboardingBody, type RiderProfile } from '@/store/rider-api';
import { useSession } from '@/store/session';
import { Layout, Radius, Spacing, useTheme } from '@/theme';

const AVATAR = 72;

const STEPS = ['Personal Details', 'Identification', 'Vehicle Information', 'Work Preferences', 'Payment Details'] as const;

type Form = {
  photo: string;
  fullName: string;
  dob: string;
  address: string;
  state: string;
  emergencyName: string;
  emergencyPhone: string;
  idType: string;
  idNumber: string;
  idExpiry: string;
  idDocs: string[];
  vehicleType: string;
  brand: string;
  model: string;
  plate: string;
  color: string;
  vehicleImages: string[];
  riderType: string;
  zones: string[];
  hours: string;
  hoursFrom: string;
  hoursTo: string;
  availability: string;
  bank: string;
  accountName: string;
  accountNumber: string;
  payout: string;
};

/** "yyyy-mm-dd" in the phone's local calendar. */
const localISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const asList = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

function fromProfile(r: RiderProfile | undefined): Form {
  const wh = parseWorkingHours(r?.working_hours);
  return {
    photo: r?.photo_url ?? '',
    fullName: [r?.first_name, r?.last_name].filter(Boolean).join(' ') || (r?.name && r.name !== 'Rider' ? r.name : ''),
    dob: r?.date_of_birth ?? '',
    address: r?.residential_address ?? '',
    state: r?.service_states?.[0] ?? '',
    emergencyName: r?.emergency_contact_name ?? '',
    emergencyPhone: r?.emergency_contact_phone ?? '',
    idType: r?.id_type ?? '',
    idNumber: '',
    idExpiry: r?.id_expiry ?? '',
    idDocs: asList(r?.documents?.id_documents),
    vehicleType: r?.vehicle_type ?? '',
    brand: r?.vehicle_brand ?? '',
    model: r?.vehicle_model ?? '',
    plate: r?.vehicle_registration ?? '',
    color: r?.vehicle_color ?? '',
    vehicleImages: asList(r?.documents?.vehicle_image),
    riderType: r?.rider_type ?? '',
    zones: r?.service_cities ?? [],
    hours: wh.hours,
    hoursFrom: wh.from,
    hoursTo: wh.to,
    availability: r?.availability_schedule ?? '',
    bank: r?.bank_name ?? '',
    accountName: r?.bank_account_name ?? '',
    accountNumber: '',
    payout: r?.payout_method ?? '',
  };
}

/**
 * Rider onboarding — the rider fills in what logistics collects on the web's
 * "Onboard a rider" form. Every step is saved on Next, so the rider can leave
 * ("Finish later") and pick up where they stopped.
 */
export default function Onboarding() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { deferOnboarding, user } = useSession();
  const me = useRiderMeQuery();
  const [save, { isLoading: saving }] = useUpdateRiderMeMutation();

  const rider = me.data?.rider;
  const [f, setF] = useState<Form>(() => fromProfile(rider));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [uploading, setUploading] = useState<keyof Form | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Fill the form once the profile arrives (first open after sign-up).
  const filled = useRef(Boolean(rider));
  useEffect(() => {
    if (rider && !filled.current) {
      filled.current = true;
      setF(fromProfile(rider));
    }
  }, [rider]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const hasIdNumber = Boolean(rider?.id_number_last4);
  const hasAccount = Boolean(rider?.bank_account_last4);

  /** Required fields per step → error messages. */
  function validate(s: number): Partial<Record<keyof Form, string>> {
    const e: Partial<Record<keyof Form, string>> = {};
    if (s === 0) {
      if (f.fullName.trim().split(/\s+/).length < 2) e.fullName = 'Enter your first and last name';
      if (!f.dob) e.dob = 'Select your date of birth';
      if (!f.address.trim()) e.address = 'Enter your home address';
      if (!f.state) e.state = 'Select your state';
      if (f.emergencyPhone && f.emergencyPhone.replace(/\D/g, '').length < 7) e.emergencyPhone = 'Enter a valid phone number';
    }
    if (s === 1) {
      if (!f.idType) e.idType = 'Select an ID type';
      if (!f.idNumber.trim() && !hasIdNumber) e.idNumber = 'Enter your ID number';
      if (f.idExpiry && f.idExpiry < localISODate(new Date())) e.idExpiry = 'This ID has expired — use a valid ID or pick a future date';
    }
    if (s === 2) {
      if (!f.vehicleType.trim()) e.vehicleType = 'Enter your vehicle type';
      if (!f.plate.trim()) e.plate = 'Enter your plate number';
    }
    if (s === 3 && f.hours === FLEXIBLE_HOURS && (!f.hoursFrom || !f.hoursTo)) e.hours = 'Choose a start and end time';
    if (s === 4) {
      if (!f.bank) e.bank = 'Select your bank';
      if (f.accountNumber && !/^\d{10}$/.test(f.accountNumber)) e.accountNumber = 'Account number must be 10 digits';
      else if (!f.accountNumber && !hasAccount) e.accountNumber = 'Enter your account number';
    }
    return e;
  }

  /** The fields one step sends to the backend. */
  function bodyFor(s: number): RiderOnboardingBody {
    const opt = (v: string) => v.trim() || undefined;
    if (s === 0)
      return {
        full_name: f.fullName.trim(),
        photo_url: opt(f.photo),
        date_of_birth: f.dob,
        residential_address: f.address.trim(),
        service_states: [f.state],
        emergency_contact_name: f.emergencyName.trim(),
        emergency_contact_phone: f.emergencyPhone.trim(),
      };
    if (s === 1)
      return {
        id_type: f.idType,
        id_number: opt(f.idNumber),
        id_expiry: opt(f.idExpiry),
        documents: f.idDocs.length ? { id_documents: f.idDocs } : undefined,
      };
    if (s === 2)
      return {
        vehicle_type: f.vehicleType.trim(),
        vehicle_brand: f.brand.trim(),
        vehicle_model: f.model.trim(),
        vehicle_registration: f.plate.trim().toUpperCase(),
        vehicle_color: f.color.trim(),
        documents: f.vehicleImages.length ? { vehicle_image: f.vehicleImages } : undefined,
      };
    if (s === 3)
      return {
        rider_type: f.riderType,
        service_cities: f.zones,
        working_hours: formatWorkingHours(f.hours, f.hoursFrom, f.hoursTo),
        availability_schedule: f.availability,
      };
    return {
      bank_name: f.bank,
      bank_account_name: f.accountName.trim(),
      bank_account_number: opt(f.accountNumber),
      payout_method: f.payout,
    };
  }

  const next = async () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) {
      toast.show('Please fill in the highlighted fields.', 'error');
      return;
    }
    try {
      const res = await save(bodyFor(step)).unwrap();
      if (step < STEPS.length - 1) {
        setStep(step + 1);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
        return;
      }
      if (res.onboarding?.complete === false) {
        toast.show('A few required details are still missing — check the earlier steps.', 'error');
        return;
      }
      toast.show("You're all set — welcome to Koolboks!", 'success');
      router.replace('/(tabs)/home');
    } catch (err) {
      toast.show(apiErrorMessage(err, "We couldn't save your details. Please try again."), 'error');
    }
  };

  const finishLater = () => {
    deferOnboarding();
    router.replace('/(tabs)/home');
  };

  /** Pick a photo (camera or library) and upload it straight away. */
  const pickPhoto = async (field: 'photo' | 'idDocs' | 'vehicleImages', source: 'camera' | 'library') => {
    const perm =
      source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.show(`Allow ${source === 'camera' ? 'camera' : 'photo'} access to add a picture.`, 'error');
      return;
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.7,
      exif: false,
      allowsEditing: field === 'photo',
      aspect: field === 'photo' ? [1, 1] : undefined,
    };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = res.canceled ? null : res.assets[0];
    if (!asset) return;
    setUploading(field);
    try {
      const url = await uploadLocalFile(asset.uri, { filename: asset.fileName ?? undefined, contentType: asset.mimeType ?? 'image/jpeg' });
      if (field === 'photo') set('photo', url);
      else set(field, [...f[field], url].slice(0, 5));
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Upload failed. Please try again.', 'error');
    } finally {
      setUploading(null);
    }
  };

  if (me.isLoading && !rider) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  const last = step === STEPS.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.md }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <Text variant="caption" tone="secondary">
              Step {step + 1} of {STEPS.length}
            </Text>
            <Pressable onPress={finishLater} hitSlop={8}>
              <Text variant="caption" tone="brand">
                Finish later
              </Text>
            </Pressable>
          </View>
          <ProgressBar value={(step + 1) / STEPS.length} />

          <View style={{ gap: Spacing.xs }}>
            <Text variant="title">{STEPS[step]}</Text>
            <Text variant="caption" tone="secondary">
              {step === 0 && 'Tell us about yourself so logistics can verify you.'}
              {step === 1 && 'Your ID is kept encrypted and only used to verify you.'}
              {step === 2 && 'The vehicle you deliver with.'}
              {step === 3 && 'Where and when you prefer to work.'}
              {step === 4 && 'Where we send your earnings.'}
            </Text>
          </View>

          <Animated.View key={step} entering={FadeIn.duration(180)} style={styles.form}>
            {step === 0 && (
              <>
                <View style={styles.photoRow}>
                  {/* Clipped to its circle; flat (no blur) so nothing draws outside it while scrolling. */}
                  <View style={[styles.avatarClip, { backgroundColor: colors.surfaceAlt }]}>
                    <Avatar name={f.fullName || user?.name} uri={f.photo || undefined} size={AVATAR} variant="soft" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: Spacing.sm }}>
                    <Text variant="label">Profile photo</Text>
                    <View style={styles.photoActions}>
                      <Button
                        label={f.photo ? 'Retake' : 'Take photo'}
                        icon="camera-outline"
                        variant="outline"
                        size="sm"
                        fullWidth={false}
                        loading={uploading === 'photo'}
                        onPress={() => void pickPhoto('photo', 'camera')}
                      />
                      <Button
                        label="Gallery"
                        icon="image-outline"
                        variant="ghost"
                        size="sm"
                        fullWidth={false}
                        onPress={() => void pickPhoto('photo', 'library')}
                      />
                    </View>
                  </View>
                </View>
                <Input
                  label="Full name"
                  placeholder="First and last name"
                  leftIcon="person-outline"
                  autoComplete="name"
                  value={f.fullName}
                  onChangeText={(t) => set('fullName', t)}
                  error={errors.fullName}
                />
                <DateField label="Date of birth" value={f.dob} onChange={(v) => set('dob', v)} error={errors.dob} years="past" />
                <Input
                  label="Home address"
                  placeholder="Where you live"
                  leftIcon="location-outline"
                  value={f.address}
                  onChangeText={(t) => set('address', t)}
                  error={errors.address}
                />
                <Field error={errors.state}>
                  <Select label="State" placeholder="Select your state" options={toOptions(STATES)} value={f.state} onChange={(v) => set('state', v)} />
                </Field>
                <Input
                  label="Emergency contact name (optional)"
                  placeholder="Who should we call?"
                  value={f.emergencyName}
                  onChangeText={(t) => set('emergencyName', t)}
                />
                <Input
                  label="Emergency contact phone (optional)"
                  placeholder="e.g. 0803 000 0000"
                  leftIcon="call-outline"
                  keyboardType="phone-pad"
                  value={f.emergencyPhone}
                  onChangeText={(t) => set('emergencyPhone', t.replace(/[^\d+\s]/g, ''))}
                  error={errors.emergencyPhone}
                />
              </>
            )}

            {step === 1 && (
              <>
                <Field error={errors.idType}>
                  <Select label="ID type" placeholder="Select ID type" options={toOptions(ID_TYPES)} value={f.idType} onChange={(v) => set('idType', v)} />
                </Field>
                <Input
                  label="ID number"
                  placeholder={hasIdNumber ? `Saved (ends in ${rider?.id_number_last4}) — type to replace` : 'Enter your ID number'}
                  leftIcon="card-outline"
                  autoCapitalize="characters"
                  value={f.idNumber}
                  onChangeText={(t) => set('idNumber', t)}
                  error={errors.idNumber}
                />
                <DateField
                  label="ID expiry date (optional)"
                  value={f.idExpiry}
                  onChange={(v) => set('idExpiry', v)}
                  error={errors.idExpiry}
                  years="future"
                />
                <PhotoList
                  label="Photo of your ID (optional)"
                  urls={f.idDocs}
                  busy={uploading === 'idDocs'}
                  onAdd={(src) => void pickPhoto('idDocs', src)}
                  onRemove={(u) => set('idDocs', f.idDocs.filter((x) => x !== u))}
                />
              </>
            )}

            {step === 2 && (
              <>
                <Input
                  label="Vehicle type"
                  placeholder="e.g. Bike, Car, Van"
                  leftIcon="bicycle-outline"
                  maxLength={40}
                  value={f.vehicleType}
                  onChangeText={(t) => set('vehicleType', t)}
                  error={errors.vehicleType}
                />
                <Input label="Brand (optional)" placeholder="e.g. Honda, Toyota" maxLength={60} value={f.brand} onChangeText={(t) => set('brand', t)} />
                <Input label="Model (optional)" placeholder="e.g. Ace 125, Corolla" maxLength={60} value={f.model} onChangeText={(t) => set('model', t)} />
                <Input
                  label="Plate number"
                  placeholder="e.g. LSR 482 KJ"
                  autoCapitalize="characters"
                  maxLength={40}
                  value={f.plate}
                  onChangeText={(t) => set('plate', t.toUpperCase())}
                  error={errors.plate}
                />
                <Input label="Colour (optional)" placeholder="e.g. Red" maxLength={40} value={f.color} onChangeText={(t) => set('color', t)} />
                <PhotoList
                  label="Vehicle photo (optional)"
                  urls={f.vehicleImages}
                  busy={uploading === 'vehicleImages'}
                  onAdd={(src) => void pickPhoto('vehicleImages', src)}
                  onRemove={(u) => set('vehicleImages', f.vehicleImages.filter((x) => x !== u))}
                />
              </>
            )}

            {step === 3 && (
              <>
                <Select label="Rider type" placeholder="Select type" options={toOptions(RIDER_TYPES)} value={f.riderType} onChange={(v) => set('riderType', v)} />
                <View style={{ gap: Spacing.sm }}>
                  <Text variant="caption" tone="secondary">
                    Delivery zones
                  </Text>
                  <ChipGroup>
                    {ZONES.map((z) => (
                      <Chip
                        key={z}
                        label={z}
                        selected={f.zones.includes(z)}
                        onPress={() => set('zones', f.zones.includes(z) ? f.zones.filter((x) => x !== z) : [...f.zones, z])}
                      />
                    ))}
                  </ChipGroup>
                </View>
                <Field error={errors.hours}>
                  <Select label="Preferred working hours" placeholder="Select hours" options={toOptions(HOURS)} value={f.hours} onChange={(v) => set('hours', v)} />
                </Field>
                {f.hours === FLEXIBLE_HOURS && (
                  <View style={styles.twoCol}>
                    <View style={{ flex: 1 }}>
                      <Select
                        label="From"
                        placeholder="Start"
                        options={toOptions(TIME_SLOTS.filter((t) => t !== f.hoursTo))}
                        value={f.hoursFrom}
                        onChange={(v) => {
                          set('hoursFrom', v);
                          setErrors((e) => ({ ...e, hours: undefined }));
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Select
                        label="To"
                        placeholder="End"
                        options={toOptions(TIME_SLOTS.filter((t) => t !== f.hoursFrom))}
                        value={f.hoursTo}
                        onChange={(v) => {
                          set('hoursTo', v);
                          setErrors((e) => ({ ...e, hours: undefined }));
                        }}
                      />
                    </View>
                  </View>
                )}
                <Select
                  label="Availability"
                  placeholder="Select availability"
                  options={toOptions(AVAILABILITY)}
                  value={f.availability}
                  onChange={(v) => set('availability', v)}
                />
              </>
            )}

            {step === 4 && (
              <>
                <Field error={errors.bank}>
                  <Select label="Bank" placeholder="Select your bank" options={toOptions(BANKS)} value={f.bank} onChange={(v) => set('bank', v)} />
                </Field>
                <Input label="Account name" placeholder="Name on the account" value={f.accountName} onChangeText={(t) => set('accountName', t)} />
                <Input
                  label="Account number"
                  placeholder={hasAccount ? `Saved (ends in ${rider?.bank_account_last4}) — type to replace` : '10-digit account number'}
                  leftIcon="card-outline"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={f.accountNumber}
                  onChangeText={(t) => set('accountNumber', t.replace(/\D/g, ''))}
                  error={errors.accountNumber}
                />
                <Select label="Payout method" placeholder="Select payout" options={toOptions(PAYOUT)} value={f.payout} onChange={(v) => set('payout', v)} />
              </>
            )}
          </Animated.View>

          <View style={styles.actions}>
            {step > 0 && (
              <View style={{ flex: 1 }}>
                <Button label="Back" variant="outline" icon="arrow-back" onPress={() => setStep(step - 1)} disabled={saving} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Button
                label={saving ? 'Saving…' : last ? 'Finish' : 'Next'}
                icon={last ? undefined : 'arrow-forward'}
                iconPosition="right"
                loading={saving}
                disabled={uploading !== null}
                onPress={() => void next()}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Wraps a control that has no error prop of its own (Select, DateField parts). */
function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: Spacing.xs }}>
      {children}
      {error ? (
        <Text variant="caption" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Day / Month / Year pickers → "yyyy-mm-dd" (the rider picks month and year directly). */
function DateField({
  label,
  value,
  onChange,
  error,
  years,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  years: 'past' | 'future';
}) {
  const [y0, m0, d0] = value ? value.split('-') : ['', '', ''];
  const [parts, setParts] = useState({ y: y0, m: m0, d: d0 });
  // Follow a value set from outside (the saved profile loading in).
  useEffect(() => {
    if (value && value !== `${parts.y}-${parts.m}-${parts.d}`) {
      const [y, m, d] = value.split('-');
      setParts({ y, m, d });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const now = new Date().getFullYear();
  const yearList = useMemo(
    () =>
      years === 'past'
        ? Array.from({ length: 70 }, (_, i) => String(now - 16 - i)) // riders are 16+
        : Array.from({ length: 15 }, (_, i) => String(now + i)),
    [years, now],
  );
  const daysInMonth = parts.y && parts.m ? new Date(Number(parts.y), Number(parts.m), 0).getDate() : 31;
  // Future dates (e.g. ID expiry): nothing before today can be picked.
  const today = new Date();
  const minY = String(today.getFullYear());
  const minM = String(today.getMonth() + 1).padStart(2, '0');
  const minD = String(today.getDate()).padStart(2, '0');
  const future = years === 'future';
  const firstMonth = future && parts.y === minY ? Number(minM) : 1;
  const firstDay = future && parts.y === minY && parts.m === minM ? Number(minD) : 1;

  const update = (p: Partial<typeof parts>) => {
    const next = { ...parts, ...p };
    if (next.d && next.y && next.m && Number(next.d) > new Date(Number(next.y), Number(next.m), 0).getDate()) next.d = '';
    if (future && next.y === minY) {
      if (next.m && next.m < minM) next.m = '';
      if (next.m === minM && next.d && next.d < minD) next.d = '';
    }
    setParts(next);
    onChange(next.y && next.m && next.d ? `${next.y}-${next.m}-${next.d}` : '');
  };

  return (
    <Field error={error}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <View style={styles.dateRow}>
        <View style={{ flex: 1 }}>
          <Select
            placeholder="Day"
            options={Array.from({ length: daysInMonth - firstDay + 1 }, (_, i) => String(firstDay + i).padStart(2, '0')).map((d) => ({
              label: String(Number(d)),
              value: d,
            }))}
            value={parts.d}
            onChange={(d) => update({ d })}
          />
        </View>
        <View style={{ flex: 1.2 }}>
          <Select
            placeholder="Month"
            options={MONTHS.map((m, i) => ({ label: m, value: String(i + 1).padStart(2, '0') })).slice(firstMonth - 1)}
            value={parts.m}
            onChange={(m) => update({ m })}
          />
        </View>
        <View style={{ flex: 1.3 }}>
          <Select placeholder="Year" options={toOptions(yearList)} value={parts.y} onChange={(y) => update({ y })} />
        </View>
      </View>
    </Field>
  );
}

/** Uploaded photos as thumbnails, plus camera / gallery buttons (max 5). */
function PhotoList({
  label,
  urls,
  busy,
  onAdd,
  onRemove,
}: {
  label: string;
  urls: string[];
  busy: boolean;
  onAdd: (source: 'camera' | 'library') => void;
  onRemove: (url: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      {urls.length > 0 && (
        <View style={styles.thumbs}>
          {urls.map((u) => (
            <View key={u}>
              <Image source={{ uri: u }} style={[styles.thumb, { borderColor: colors.border }]} contentFit="cover" />
              <Pressable
                onPress={() => onRemove(u)}
                hitSlop={8}
                accessibilityLabel="Remove photo"
                style={[styles.thumbRemove, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Glyph name="close-circle" size={18} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      {urls.length < 5 && (
        <View style={styles.photoActions}>
          <Button label="Take photo" icon="camera-outline" variant="outline" size="sm" fullWidth={false} loading={busy} onPress={() => onAdd('camera')} />
          <Button label="Gallery" icon="images-outline" variant="ghost" size="sm" fullWidth={false} disabled={busy} onPress={() => onAdd('library')} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  form: { gap: Spacing.lg },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatarClip: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, overflow: 'hidden', flexShrink: 0 },
  photoActions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  twoCol: { flexDirection: 'row', gap: Spacing.sm },
  dateRow: { flexDirection: 'row', gap: Spacing.sm },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  thumb: { width: 84, height: 84, borderRadius: Radius.sm, borderWidth: StyleSheet.hairlineWidth },
  thumbRemove: { position: 'absolute', top: -8, right: -8, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
});
