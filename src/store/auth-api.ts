/**
 * Auth endpoints (RTK Query) on the shared Kool backend — the same account
 * works on Kool Konnect and Kool Logistics Web. Riders have role `delivery`.
 *
 * Defined here as part of the RTK Query setup; the sign-in screen is wired to
 * these in the next phase.
 */
import { baseApi } from './base-api';

export type TokenPair = { access: string; refresh: string };

export type LoginResponse = TokenPair & { success: boolean; user_id: string; role: string };

export type WhoAmI = {
  success: boolean;
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
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login/', method: 'POST', body }),
    }),
    whoAmI: build.query<WhoAmI, void>({
      query: () => '/users/whoami/',
      providesTags: ['Me'],
    }),
    forgotPasswordRequest: build.mutation<{ success: boolean; message: string }, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password/request/', method: 'POST', body }),
    }),
    forgotPasswordReset: build.mutation<
      TokenPair & { success: boolean },
      { email: string; code: string; new_password: string }
    >({
      query: (body) => ({ url: '/auth/forgot-password/reset/', method: 'POST', body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useWhoAmIQuery,
  useLazyWhoAmIQuery,
  useForgotPasswordRequestMutation,
  useForgotPasswordResetMutation,
} = authApi;

/** Riders use the `delivery` role on the backend (`rider` is accepted too). */
export function isRiderAccount(me: Pick<WhoAmI, 'role'> | undefined | null): boolean {
  const role = (me?.role ?? '').toLowerCase();
  return role === 'delivery' || role === 'rider';
}
