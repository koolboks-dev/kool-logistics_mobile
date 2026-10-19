/**
 * Auth endpoints (RTK Query) — Kool Logistics' own (/logistics/auth/,
 * /logistics/me/), shared with Kool Logistics Web, never the marketplace's.
 * Riders have role `delivery` (`rider` is accepted as an alias).
 */
import { baseApi } from './base-api';

export type TokenPair = { access: string; refresh: string };

export type LoginResponse = TokenPair & {
  success: boolean;
  user_id: string;
  role: string;
  must_change_password?: boolean;
};

export type WhoAmI = {
  id: string;
  email: string | null;
  phone_number: string | null;
  name: string;
  first_name: string;
  last_name: string;
  role: string;
  market: string;
  is_staff: boolean;
  is_active: boolean;
  profile_image_url: string | null;
  /** Riders created by logistics get a temporary password and must replace it. */
  must_change_password?: boolean;
};

export type ChangePasswordResponse = {
  success: boolean;
  message?: string;
  must_change_password: boolean;
};

export type Market = 'NG' | 'KE';

export type RegisterStartBody = {
  email: string;
  phone_number: string;
  market: Market;
  /** The rider app only creates rider accounts. */
  role: 'rider';
};

export type RegisterStartResponse = {
  success: boolean;
  message: string;
  /** Only echoed by the backend in development. */
  code?: string;
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/logistics/auth/login/', method: 'POST', body }),
    }),
    whoAmI: build.query<WhoAmI, void>({
      query: () => '/logistics/me/',
      providesTags: ['Me'],
    }),
    changePassword: build.mutation<ChangePasswordResponse, { current_password: string; new_password: string }>({
      query: (body) => ({ url: '/logistics/auth/change-password/', method: 'POST', body }),
      invalidatesTags: ['Me', 'RiderMe'],
    }),
    forgotPasswordRequest: build.mutation<{ success: boolean; message: string }, { email: string }>({
      query: (body) => ({ url: '/logistics/auth/forgot-password/request/', method: 'POST', body }),
    }),
    forgotPasswordReset: build.mutation<
      TokenPair & { success: boolean },
      { email: string; code: string; new_password: string }
    >({
      query: (body) => ({ url: '/logistics/auth/forgot-password/reset/', method: 'POST', body }),
    }),
    /** Sign-up step 1 — send a 6-digit code to the email (and phone). */
    registerStart: build.mutation<RegisterStartResponse, RegisterStartBody>({
      query: (body) => ({ url: '/logistics/auth/register/start/', method: 'POST', body }),
    }),
    /** Sign-up step 2 — the code creates the account and signs it in. */
    registerVerify: build.mutation<TokenPair & { success: boolean; message: string }, RegisterStartBody & { code: string }>({
      query: (body) => ({ url: '/logistics/auth/register/verify/', method: 'POST', body }),
    }),
    /** Sign-up step 3 — the password used on Kool Logistics (app and web). */
    setPassword: build.mutation<{ success: boolean; message: string }, { password: string }>({
      query: (body) => ({ url: '/logistics/auth/register/set-password/', method: 'POST', body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useWhoAmIQuery,
  useLazyWhoAmIQuery,
  useChangePasswordMutation,
  useForgotPasswordRequestMutation,
  useForgotPasswordResetMutation,
  useRegisterStartMutation,
  useRegisterVerifyMutation,
  useSetPasswordMutation,
} = authApi;

/** Riders use the `delivery` role on the backend (`rider` is accepted too). */
export function isRiderRole(role: string | null | undefined): boolean {
  const r = (role ?? '').toLowerCase();
  return r === 'delivery' || r === 'rider';
}

export function isRiderAccount(me: Pick<WhoAmI, 'role'> | undefined | null): boolean {
  return isRiderRole(me?.role);
}
