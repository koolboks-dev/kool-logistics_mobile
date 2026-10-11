/**
 * Auth endpoints (RTK Query) on the shared Kool backend — the same account
 * works on Kool Konnect and Kool Logistics Web. Riders have role `delivery`
 * (`rider` is accepted as an alias).
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

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login/', method: 'POST', body }),
    }),
    whoAmI: build.query<WhoAmI, void>({
      query: () => '/users/whoami/',
      providesTags: ['Me'],
    }),
    changePassword: build.mutation<ChangePasswordResponse, { current_password: string; new_password: string }>({
      query: (body) => ({ url: '/auth/change-password/', method: 'POST', body }),
      invalidatesTags: ['Me', 'RiderMe'],
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
  useChangePasswordMutation,
  useForgotPasswordRequestMutation,
  useForgotPasswordResetMutation,
} = authApi;

/** Riders use the `delivery` role on the backend (`rider` is accepted too). */
export function isRiderRole(role: string | null | undefined): boolean {
  const r = (role ?? '').toLowerCase();
  return r === 'delivery' || r === 'rider';
}

export function isRiderAccount(me: Pick<WhoAmI, 'role'> | undefined | null): boolean {
  return isRiderRole(me?.role);
}
