/**
 * Rider endpoints (role delivery|rider) — profile + duty state, assigned
 * deliveries, stage changes, proof of delivery, problems, scans and location.
 * Shapes follow the backend's `serializeForRider` (never includes the code).
 */
import { baseApi } from './base-api';

import type { DeliveryStatus } from '@/components/ui/StatusPill';

export type { DeliveryStatus };

/** The stages the rider moves a delivery through. */
export type RiderStage = 'travelling_to_pickup' | 'picked_up' | 'in_transit' | 'delivered';

export type RiderProfile = {
  id: string;
  rider_code: string;
  name: string;
  email: string | null;
  phone: string;
  photo_url: string | null;
  vehicle_type: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_registration: string;
  service_states: string[];
  service_cities: string[];
  is_available: boolean;
  is_active: boolean;
  active_count: number;
  last_location_at: string | null;
  must_change_password: boolean;
  // Onboarding details (filled by logistics or by the rider in the app).
  first_name?: string;
  last_name?: string;
  date_of_birth?: string | null;
  residential_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  id_type?: string;
  id_number_last4?: string;
  id_expiry?: string | null;
  vehicle_color?: string;
  documents?: Record<string, string | string[]>;
  rider_type?: string;
  working_hours?: string;
  availability_schedule?: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_last4?: string;
  payout_method?: string;
};

export type OnboardingStatus = { complete: boolean; missing: string[] };

/** What the rider can fill in themselves (PATCH /deliveries/rider/me/). */
export type RiderOnboardingBody = Partial<{
  full_name: string;
  photo_url: string;
  date_of_birth: string;
  residential_address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  id_type: string;
  id_number: string;
  id_expiry: string;
  vehicle_type: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_registration: string;
  service_states: string[];
  service_cities: string[];
  documents: Record<string, string[]>;
  rider_type: string;
  working_hours: string;
  availability_schedule: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  payout_method: string;
}>;

export type RiderMe = {
  rider: RiderProfile;
  /** Missing on older backends — treat as complete. */
  onboarding?: OnboardingStatus;
  location_interval_seconds: number;
  min_location_interval_seconds: number;
};

export type PickupBlock = {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  whatsapp_number: string;
  contact_name: string;
  instructions: string;
};

export type DropoffBlock = {
  name: string;
  contact_name: string;
  address: string;
  line1: string;
  city: string;
  state: string;
  note: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
};

export type DeliveryItem = { name: string; quantity: number; unit: string };

export type DeliveryIssue = {
  issue_id: string | null;
  category: string;
  category_display: string;
  status: string;
  description: string;
  created_at: string;
};

/** 'stock' (an order from a wholesaler) or 'freezer' (Task 9 freezer deployment). */
export type DeliveryType = 'stock' | 'freezer';

/**
 * Freezer deployments (Task 9): the rider collects the allocated unit from a
 * Koolboks depot and installs it at the retailer. Present only on freezer
 * deliveries.
 */
export type FreezerBlock = {
  deployment_id: string;
  model_name: string;
  /** The unit allocated to this deployment — the rider must scan/enter it on completion. */
  serial_number: string;
  depot_name: string;
  install_required: boolean;
};

export type RiderDelivery = {
  delivery_id: string;
  delivery_type?: DeliveryType | (string & {});
  /** Freezer deliveries only. */
  freezer?: FreezerBlock | null;
  order_id: string | null;
  order_number: string;
  status: DeliveryStatus;
  status_display: string;
  items: DeliveryItem[];
  items_count: number;
  assigned_at: string | null;
  travelling_to_pickup_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  closed_at: string | null;
  expected_delivery_at: string | null;
  eta_minutes: number | null;
  is_delayed: boolean;
  awaiting_confirmation?: boolean;
  confirmation: { outcome: string; outcome_display: string; auto_confirmed: boolean; confirmed_at: string } | null;
  issues: DeliveryIssue[];
  qr_token: string;
  pickup: PickupBlock;
  dropoff: DropoffBlock;
  customer: { name: string; phone: string };
  next_status: RiderStage | null;
  allowed_actions: RiderStage[];
  is_active: boolean;
  is_closed: boolean;
  proof_required: {
    photo: boolean;
    delivery_code: boolean;
    recipient_name: boolean;
    /** Freezer deliveries: the installed unit's serial must be scanned or typed. */
    unit_serial?: boolean;
  };
  code_locked: boolean;
  code_attempts_left: number;
  pod_photo_url: string;
  pod_note: string;
  recipient_name: string;
  exception: { reason: string; note: string; at: string | null } | null;
  created_at: string;
  updated_at: string;
};

export type StageBody = {
  pod_photo_url?: string;
  delivery_code?: string;
  recipient_name?: string;
  pod_note?: string;
  note?: string;
  eta_minutes?: number;
  /** Freezer deliveries: the installed unit's serial (must match the allocated unit). */
  unit_serial?: string;
};

export type ScanResult = RiderDelivery & { warning: string | null };

export type LocationPing = {
  latitude: number;
  longitude: number;
  accuracy_m?: number | null;
  speed?: number | null;
  heading?: number | null;
  recorded_at?: string;
};

export type LocationResult =
  | { accepted: true; delivery_id: string | null; recorded_at: string }
  | {
      accepted: false;
      reason: 'too_frequent' | 'not_on_duty' | 'invalid_location' | 'inactive';
      retry_after_seconds?: number;
    };

export const PROBLEM_CATEGORIES = [
  { value: 'customer_unavailable', label: 'Customer unavailable' },
  { value: 'incorrect_address', label: 'Incorrect address' },
  { value: 'refused', label: 'Customer refused delivery' },
  { value: 'damaged', label: 'Goods damaged' },
  { value: 'missing_item', label: 'Missing item' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'dispute', label: 'Dispute' },
  { value: 'other', label: 'Other' },
] as const;

const deliveryTags = (d: RiderDelivery | undefined) =>
  d ? [{ type: 'Delivery' as const, id: d.delivery_id }] : [];

export const riderApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    riderMe: build.query<RiderMe, void>({
      query: () => '/logistics/rider/me/',
      providesTags: ['RiderMe'],
    }),

    updateRiderMe: build.mutation<{ success: boolean; onboarding: OnboardingStatus }, RiderOnboardingBody>({
      query: (body) => ({ url: '/logistics/rider/me/', method: 'PATCH', body }),
      invalidatesTags: ['RiderMe', 'Me'],
      // Store the new onboarding status at once, so the session guard doesn't
      // act on the stale "incomplete" value while the profile refetches.
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            riderApi.util.updateQueryData('riderMe', undefined, (draft) => {
              draft.onboarding = data.onboarding;
            }),
          );
        } catch {
          // the screen shows the error
        }
      },
    }),

    setAvailability: build.mutation<{ is_available: boolean }, boolean>({
      query: (isAvailable) => ({
        url: '/logistics/rider/availability/',
        method: 'POST',
        body: { is_available: isAvailable },
      }),
      // Flip the switch immediately; roll back if the server says no.
      async onQueryStarted(isAvailable, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          riderApi.util.updateQueryData('riderMe', undefined, (draft) => {
            draft.rider.is_available = isAvailable;
          }),
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(
            riderApi.util.updateQueryData('riderMe', undefined, (draft) => {
              draft.rider.is_available = data.is_available;
            }),
          );
        } catch {
          patch.undo();
        }
      },
    }),

    assignedDeliveries: build.query<RiderDelivery[], { active: boolean }>({
      query: ({ active }) => `/logistics/rider/deliveries/?active=${active ? 'true' : 'false'}`,
      transformResponse: (res: { items?: RiderDelivery[] }) => res.items ?? [],
      providesTags: (result, _e, { active }) => [
        { type: 'Deliveries', id: active ? 'ACTIVE' : 'DONE' },
        ...(result ?? []).map((d) => ({ type: 'Delivery' as const, id: d.delivery_id })),
      ],
    }),

    delivery: build.query<RiderDelivery, string>({
      query: (id) => `/logistics/rider/deliveries/${encodeURIComponent(id)}/`,
      providesTags: (result, _e, id) => [{ type: 'Delivery', id: result?.delivery_id ?? id }],
    }),

    advanceDelivery: build.mutation<RiderDelivery, { id: string; target: RiderStage; body?: StageBody }>({
      query: ({ id, target, body }) => ({
        url: `/logistics/rider/deliveries/${encodeURIComponent(id)}/status/${target}/`,
        method: 'POST',
        body: body ?? {},
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(riderApi.util.upsertQueryData('delivery', id, data));
        } catch {
          // Errors are shown by the caller; a wrong code also changes attempts_left.
          dispatch(riderApi.util.invalidateTags([{ type: 'Delivery', id }]));
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Deliveries', id: 'ACTIVE' },
        { type: 'Deliveries', id: 'DONE' },
        'RiderMe',
        ...(_e ? [{ type: 'Delivery' as const, id }] : []),
      ],
    }),

    uploadPodPhoto: build.mutation<
      { url: string; blob_name: string },
      { id: string; filename: string; content_type: string; data_base64: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/logistics/rider/deliveries/${encodeURIComponent(id)}/pod-photo/`,
        method: 'POST',
        body,
        timeout: 90000,
      }),
    }),

    reportProblem: build.mutation<
      RiderDelivery & { issue_id: string },
      { id: string; category: string; description: string; cannot_complete?: boolean; evidence_urls?: string[] }
    >({
      query: ({ id, ...body }) => ({
        url: `/logistics/rider/deliveries/${encodeURIComponent(id)}/problem/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (r, _e, { id }) => [
        { type: 'Delivery', id },
        { type: 'Deliveries', id: 'ACTIVE' },
        { type: 'Deliveries', id: 'DONE' },
        ...deliveryTags(r),
      ],
    }),

    scanDelivery: build.mutation<ScanResult, string>({
      query: (token) => ({ url: '/logistics/rider/scan/', method: 'POST', body: { token } }),
    }),

    sendLocation: build.mutation<LocationResult, LocationPing>({
      query: (body) => ({ url: '/logistics/rider/location/', method: 'POST', body }),
    }),
  }),
});

export const {
  useRiderMeQuery,
  useUpdateRiderMeMutation,
  useSetAvailabilityMutation,
  useAssignedDeliveriesQuery,
  useDeliveryQuery,
  useAdvanceDeliveryMutation,
  useUploadPodPhotoMutation,
  useReportProblemMutation,
  useScanDeliveryMutation,
  useSendLocationMutation,
} = riderApi;
