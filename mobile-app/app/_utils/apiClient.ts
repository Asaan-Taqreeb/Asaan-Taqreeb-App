import { AUTH_ENDPOINTS } from '@/app/_constants/apiEndpoints'
import { clearAuthTokens, getAccessToken, getRefreshToken, saveAuthTokens } from '@/app/_utils/authStorage'

type ApiFetchOptions = RequestInit & {
  auth?: boolean
  timeout?: number
}

export class RequestTimeoutError extends Error {
  constructor(message = 'Request timeout. Please check your internet connection and try again.') {
    super(message)
    this.name = 'RequestTimeoutError'
  }
}

export class SessionExpiredError extends Error {
  constructor(message = 'Session expired. Please login again.') {
    super(message)
    this.name = 'SessionExpiredError'
  }
}

const DEFAULT_TIMEOUT = 90000 // 90 seconds (mobile-safe default)

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
      throw new RequestTimeoutError()
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

  const extractValidationMessages = (errors: any[]) => {
    const messages = errors
      .map((err: any) => {
        if (typeof err === 'string') return err
        if (typeof err?.message === 'string') return err.message
        if (typeof err?.msg === 'string') return err.msg
        if (typeof err?.error === 'string') return err.error
        if (typeof err?.path === 'string' && typeof err?.msg === 'string') {
          return `${err.path}: ${err.msg}`
        }
        if (Array.isArray(err?.loc) && typeof err?.msg === 'string') {
          return `${err.loc.join('.')}: ${err.msg}`
        }
        return null
      })
      .filter((message: any) => typeof message === 'string')

    return messages.length > 0 ? messages.join(', ') : null
  }

  // Handle array of errors (validation errors)
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    const message = extractValidationMessages(payload.errors)
    if (message) {
      return message
    }
  }

  if (Array.isArray(payload?.detail) && payload.detail.length > 0) {
    const message = extractValidationMessages(payload.detail)
    if (message) {
      return message
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
  const method = String(rest.method || 'GET').toUpperCase()

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  }

  if (!finalHeaders['Content-Type'] && rest.body && !(rest.body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  if (auth) {
    const accessToken = await getAccessToken()
    if (accessToken) {
      finalHeaders.Authorization = `Bearer ${accessToken}`
    }
  }

  let response: Response

  try {
    response = await fetchWithTimeout(
      url,
      {
        ...rest,
        headers: finalHeaders,
      },
      timeout
    )
  } catch (error: any) {
    const isIdempotent = method === 'GET' || method === 'HEAD'
    if (error instanceof RequestTimeoutError && isIdempotent) {
      response = await fetchWithTimeout(
        url,
        {
          ...rest,
          headers: finalHeaders,
        },
        Math.max(timeout, DEFAULT_TIMEOUT)
      )
    } else {
      throw error
    }
  }

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

export { parseJsonSafe, getMessageFromPayload }

export default function ApiClientRouteStub() {
  return null
}
