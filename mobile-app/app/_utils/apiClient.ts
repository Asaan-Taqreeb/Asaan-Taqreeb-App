import { AUTH_ENDPOINTS } from '@/app/_constants/apiEndpoints'
import { clearAuthTokens, getAccessToken, getRefreshToken, saveAuthTokens } from '@/app/_utils/authStorage'

type ApiFetchOptions = RequestInit & {
  auth?: boolean
  timeout?: number
}

const isFormDataBody = (body: unknown): body is FormData => {
  return !!body && typeof body === 'object' && typeof (body as FormData).append === 'function'
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

export class ApiError extends Error {
  status: number
  code?: string
  data?: any

  constructor(message: string, status: number, code?: string, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.data = data
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

const decodeJwtPayload = (token: string): any => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }
    
    let decodedStr = ''
    if (typeof atob === 'function') {
      decodedStr = atob(base64)
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      let buffer = ''
      for (let i = 0; i < base64.length; i++) {
        if (base64[i] === '=') break
        const charIdx = chars.indexOf(base64[i])
        if (charIdx !== -1) {
          buffer += charIdx.toString(2).padStart(6, '0')
        }
      }
      for (let i = 0; i < buffer.length; i += 8) {
        if (i + 8 > buffer.length) break
        decodedStr += String.fromCharCode(parseInt(buffer.slice(i, i + 8), 2))
      }
    }
    return JSON.parse(decodedStr)
  } catch (e) {
    console.error('Failed to decode JWT payload:', e)
    return null
  }
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

    const accessToken = await getAccessToken()
    let currentRole: string | null = null
    if (accessToken) {
      const payload = decodeJwtPayload(accessToken)
      currentRole = payload?.role || null
    }

    const response = await fetch(AUTH_ENDPOINTS.refresh, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken, role: currentRole }),
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

  if (!finalHeaders['Content-Type'] && rest.body && !isFormDataBody(rest.body)) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  if (auth) {
    const accessToken = await getAccessToken()
    if (accessToken) {
      finalHeaders.Authorization = `Bearer ${accessToken}`
    }
  }

  let response: Response | null = null

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

  if (!response) {
    throw new Error('No response received from server')
  }

  if (!auth || response.status !== 401) {
    return response
  }

  const newAccessToken = await refreshAccessToken()

  if (!newAccessToken) {
    await clearAuthTokens()
    throw new SessionExpiredError()
  }

  const refreshedResponse = await fetchWithTimeout(url, {
    ...rest,
    headers: {
      ...finalHeaders,
      Authorization: `Bearer ${newAccessToken}`,
    },
  }, timeout)

  return refreshedResponse
}

export const apiFetchJson = async <T>(url: string, options: ApiFetchOptions = {}, fallbackError = 'Request failed'): Promise<T> => {
  const response = await apiFetch(url, options)
  
  if (!response) {
    throw new ApiError('No response received from server', 500, 'NO_RESPONSE')
  }

  const data = await parseJsonSafe(response)

  if (!response.ok) {
    console.error('API Error Response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      data: JSON.stringify(data, null, 2)
    })
    const message = getMessageFromPayload(data, fallbackError)
    const code = data?.code
    throw new ApiError(message, response.status, code, data)
  }

  return (data?.data ?? data) as T
}

export { parseJsonSafe, getMessageFromPayload }

export default function ApiClientRouteStub() {
  return null
}
