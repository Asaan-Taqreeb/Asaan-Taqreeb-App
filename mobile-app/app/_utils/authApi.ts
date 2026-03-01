import { AUTH_ENDPOINTS } from '@/app/_constants/apiEndpoints'
import { clearAuthTokens, getRefreshToken, saveAuthTokens } from '@/app/_utils/authStorage'
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
  return response
}

export const getCurrentUser = async () => {
  const response = await apiFetchJson<any>(
    AUTH_ENDPOINTS.me,
    {
      method: 'GET',
      auth: true,
    },
    'Failed to load user profile.'
  )
  console.log('getCurrentUser API response:', JSON.stringify(response, null, 2))
  return response
}

export const logoutUser = async () => {
  try {
    const refreshToken = await getRefreshToken()

    await apiFetch(AUTH_ENDPOINTS.logout, {
      method: 'POST',
      auth: false,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
  } finally {
    await clearAuthTokens()
  }
}
