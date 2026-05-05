import { AUTH_ENDPOINTS } from '@/app/_constants/apiEndpoints'
import { clearAuthTokens, saveAuthTokens } from '@/app/_utils/authStorage'
import { apiFetch, apiFetchJson } from '@/app/_utils/apiClient'

type LoginParams = {
  email: string
  password: string
}

type SignupParams = {
  name: string
  email: string
  password: string
  role: 'client' | 'vendor'
  phone?: string
}


type ForgotPasswordParams = {
  email: string
}

type VerifyOtpParams = {
  email: string
  otp: string
}

type ResetPasswordParams = {
  email: string
  newPassword: string
}

export type AppRole = 'client' | 'vendor'

type AuthResponse = {
  accessToken?: string
  refreshToken?: string
  [key: string]: any
}

const normalizeRole = (role: unknown): AppRole | null => {
  if (typeof role !== 'string') {
    return null
  }

  const normalizedRole = role.trim().toLowerCase()
  if (normalizedRole === 'client' || normalizedRole === 'vendor') {
    return normalizedRole
  }

  return null
}

export const extractRoleFromAuthPayload = (payload: any): AppRole | null => {
  if (!payload) {
    return null
  }

  return (
    normalizeRole(payload?.role) ||
    normalizeRole(payload?.user?.role) ||
    normalizeRole(payload?.account?.role) ||
    normalizeRole(payload?.profile?.role) ||
    null
  )
}

const saveTokensFromResponse = async (response: AuthResponse) => {
  const accessToken = response?.accessToken
  const refreshToken = response?.refreshToken

  if (accessToken && refreshToken) {
    await saveAuthTokens(accessToken, refreshToken)
  }
}

export const loginUser = async (params: LoginParams) => {
  const response = await apiFetchJson<AuthResponse>(
    AUTH_ENDPOINTS.login,
    {
      method: 'POST',
      auth: false,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    },
    'Login failed. Please try again.'
  )

  console.log('loginUser API response:', JSON.stringify(response, null, 2))
  await saveTokensFromResponse(response)
  return response
}

export const registerUser = async (params: SignupParams) => {
  console.log('Register API call with params:', params)
  
  const response = await apiFetchJson<AuthResponse>(
    AUTH_ENDPOINTS.register,
    {
      method: 'POST',
      auth: false,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    },
    'Signup failed. Please try again.'
  )

  console.log('Register API response:', response)
  await saveTokensFromResponse(response)
  return response
}

export const forgotPassword = async (params: ForgotPasswordParams) => {
  const response = await apiFetchJson<any>(
    AUTH_ENDPOINTS.forgotPassword,
    {
      method: 'POST',
      auth: false,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    },
    'Unable to process forgot password request.'
  )

  return response
}

export const verifyOtp = async (params: VerifyOtpParams) => {
  const response = await apiFetchJson<any>(
    AUTH_ENDPOINTS.verifyOtp,
    {
      method: 'POST',
      auth: false,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    },
    'OTP verification failed.'
  )

  return response
}

export const resetPassword = async (params: ResetPasswordParams) => {
  const response = await apiFetchJson<any>(
    AUTH_ENDPOINTS.resetPassword,
    {
      method: 'POST',
      auth: false,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    },
    'Password reset failed.'
  )

  return response
}

export const verifyEmail = async (params: VerifyOtpParams) => {
  const response = await apiFetchJson<any>(
    AUTH_ENDPOINTS.verifyEmail,
    {
      method: 'POST',
      auth: false,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    },
    'Email verification failed.'
  )

  return response
}

export const resendVerificationOtp = async (params: ForgotPasswordParams) => {
  const response = await apiFetchJson<any>(
    AUTH_ENDPOINTS.resendVerificationOtp,
    {
      method: 'POST',
      auth: false,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    },
    'Failed to resend verification code.'
  )

  return response
}


export const getCurrentUser = async () => {
  const response = await apiFetchJson<any>(
    AUTH_ENDPOINTS.me,
    {
      method: 'GET',
      auth: true,
      timeout: 120000,
    },
    'Failed to load user profile.'
  )
  console.log('getCurrentUser API response:', JSON.stringify(response, null, 2))
  return response
}

export const logoutUser = async () => {
  try {
    await apiFetch(AUTH_ENDPOINTS.logout, {
      method: 'POST',
      auth: true,
    })
  } catch (error) {
    // Local logout must still succeed even if server-side logout fails.
    console.log('Logout API request failed:', error)
  } finally {
    await clearAuthTokens()
  }
}

export const updateMe = async (params: any) => {
  const response = await apiFetchJson<any>(
    AUTH_ENDPOINTS.me,
    {
      method: 'PATCH',
      auth: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    },
    'Failed to update profile.'
  )
  return response
}

export const updateUserProfile = updateMe

export const submitKyc = async (params: {
  cnic: string;
  idFrontImage: string;
  idBackImage: string;
  selfieImage: string;
  livenessConfidence: number;
}) => {
  const response = await apiFetchJson<any>(
    AUTH_ENDPOINTS.identitySubmit || '/auth/identity/submit', // Fallback if not in constants yet
    {
      method: 'POST',
      auth: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    },
    'KYC submission failed.'
  )
  return response
}

export const getKycStatus = async () => {
  const response = await apiFetchJson<any>(
    AUTH_ENDPOINTS.identityStatus || '/auth/identity/status',
    {
      method: 'GET',
      auth: true,
    },
    'Failed to fetch KYC status.'
  )
  return response
}


export const deleteUserAccount = async () => {
  try {
    await apiFetchJson<any>(
      AUTH_ENDPOINTS.me,
      {
        method: 'DELETE',
        auth: true,
      },
      'Failed to delete account.'
    )
  } finally {
    await clearAuthTokens()
  }
}

export default function AuthApiRouteStub() {
  return null
}
