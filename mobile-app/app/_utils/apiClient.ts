import { AUTH_ENDPOINTS } from '@/app/_constants/apiEndpoints'
import { clearAuthTokens, getAccessToken, getRefreshToken, saveAuthTokens } from '@/app/_utils/authStorage'

type ApiFetchOptions = RequestInit & {
  auth?: boolean
  timeout?: number
}

export class SessionExpiredError extends Error {
  constructor(message = 'Session expired. Please login again.') {
    super(message)
    this.name = 'SessionExpiredError'
  }
}

const DEFAULT_TIMEOUT = 30000 // 30 seconds

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout: number = DEFAULT_TIMEOUT): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your internet connection and try again.')
    }
    throw error
  }
}

const parseJsonSafe = async (response: Response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const getMessageFromPayload = (payload: any, fallback: string) => {
  if (!payload) return fallback

  // Handle array of errors (validation errors)
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    const firstError = payload.errors[0]
    if (typeof firstError === 'string') {
      return firstError
    }
    if (typeof firstError?.message === 'string') {
      return firstError.message
    }
    if (typeof firstError?.msg === 'string') {
      return firstError.msg
    }
    // Join multiple error messages
    const messages = payload.errors
      .map((err: any) => err?.message || err?.msg || err)
      .filter((msg: any) => typeof msg === 'string')
    if (messages.length > 0) {
      return messages.join(', ')
    }
  }

  if (typeof payload?.message === 'string') {
    return payload.message
  }

  if (typeof payload?.error === 'string') {
    return payload.error
  }

  if (typeof payload?.data?.message === 'string') {
    return payload.data.message
  }

  return fallback
}

let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) {
      return null
    }

    const response = await fetch(AUTH_ENDPOINTS.refresh, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      return null
    }

    const data = await parseJsonSafe(response)
    const payload = data?.data ?? data
    const newAccessToken = payload?.accessToken
    const newRefreshToken = payload?.refreshToken ?? refreshToken

    if (!newAccessToken) {
      return null
    }

    await saveAuthTokens(newAccessToken, newRefreshToken)
    return newAccessToken
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

export const apiFetch = async (url: string, options: ApiFetchOptions = {}) => {
  const { auth = true, timeout = DEFAULT_TIMEOUT, headers, ...rest } = options

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  }

  if (!finalHeaders['Content-Type'] && rest.body) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  if (auth) {
    const accessToken = await getAccessToken()
    if (accessToken) {
      finalHeaders.Authorization = `Bearer ${accessToken}`
    }
  }

  let response = await fetchWithTimeout(url, {
    ...rest,
    headers: finalHeaders,
  }, timeout)

  if (!auth || response.status !== 401) {
    return response
  }

  const newAccessToken = await refreshAccessToken()

  if (!newAccessToken) {
    await clearAuthTokens()
    throw new SessionExpiredError()
  }

  response = await fetchWithTimeout(url, {
    ...rest,
    headers: {
      ...finalHeaders,
      Authorization: `Bearer ${newAccessToken}`,
    },
  }, timeout)

  return response
}

export const apiFetchJson = async <T>(url: string, options: ApiFetchOptions = {}, fallbackError = 'Request failed'): Promise<T> => {
  const response = await apiFetch(url, options)
  const data = await parseJsonSafe(response)

  if (!response.ok) {
    console.error('API Error Response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      data: JSON.stringify(data, null, 2)
    })
    throw new Error(getMessageFromPayload(data, fallbackError))
  }

  return (data?.data ?? data) as T
}
