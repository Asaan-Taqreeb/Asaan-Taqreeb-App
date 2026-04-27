import { AVAILABILITY_ENDPOINTS } from '@/app/_constants/apiEndpoints'
import { apiFetch } from '@/app/_utils/apiClient'

export type VendorAvailabilityDay = {
  id?: string
  date: string
  isBlocked: boolean
  isBooked: boolean
  reason?: string
  type?: string
  timeSlot?: {
    from: string
    to: string
  }
}

const toIsoDate = (value: unknown) => String(value || '').slice(0, 10)

const parseJsonSafe = async (response: Response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const normalizeTimeSlot = (timeSlot: any): VendorAvailabilityDay['timeSlot'] | undefined => {
  if (!timeSlot || typeof timeSlot !== 'object') return undefined

  const from = String(timeSlot?.from || '').trim()
  const to = String(timeSlot?.to || '').trim()

  if (!from || !to) return undefined

  return { from, to }
}

const buildAvailabilityFallbackUrls = (date: string, action: 'block' | 'unblock') => {
  const baseUrl = new URL(AVAILABILITY_ENDPOINTS.blockAvailability(date))
  const encodedDate = encodeURIComponent(date)

  return [
    baseUrl.toString(),
    `${baseUrl.origin}/api/v1/vendor/availability/${encodedDate}`,
    `${baseUrl.origin}/api/v1/vendor/availability/${encodedDate}/${action}`,
    `${baseUrl.origin}/api/v1/vendor/availability/${action}/${encodedDate}`,
    `${baseUrl.origin}/api/v1/vendor/availability/${action}`,
    `${baseUrl.origin}/api/v1/vendor/availability`,
  ]
}

const buildVendorAvailabilityFallbackUrls = (vendorId: string | number, date: string, action: 'block' | 'unblock') => {
  const baseUrl = new URL(AVAILABILITY_ENDPOINTS.blockAvailability(date))
  const encodedVendorId = encodeURIComponent(String(vendorId))
  const encodedDate = encodeURIComponent(date)

  return [
    `${baseUrl.origin}/api/v1/vendor/availability/${encodedVendorId}/${encodedDate}`,
    `${baseUrl.origin}/api/v1/vendor/availability/${encodedVendorId}/${encodedDate}/${action}`,
    `${baseUrl.origin}/api/v1/vendor/availability/${encodedVendorId}/${action}/${encodedDate}`,
    `${baseUrl.origin}/api/v1/vendor/availability/${encodedVendorId}/availability/${encodedDate}`,
    `${baseUrl.origin}/api/v1/vendor/availability/${encodedVendorId}`,
  ]
}

const normalizeAvailabilityDays = (payload: any): VendorAvailabilityDay[] => {
  const raw = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.availability)
      ? payload.availability
      : Array.isArray(payload?.data)
        ? payload.data
      : Array.isArray(payload?.data?.availability)
        ? payload.data.availability
        : Array.isArray(payload?.dates)
          ? payload.dates
          : []

  if (!Array.isArray(raw)) return []

  return raw
    .flatMap((item: any) => {
      const date = toIsoDate(item?.date ?? item?.day ?? item)
      if (!date) return []

      const status = String(item?.status || '').toLowerCase()
      const type = String(item?.type || '').toLowerCase()
      const isBlocked = Boolean(
        (item?.isBlocked ??
        item?.blocked ??
        item?.is_locked) ||
        type === 'blocked' ||
        status === 'blocked' ||
        status === 'locked' ||
        status === 'unavailable'
      )

      const isBooked = Boolean(
        (item?.isBooked ??
        item?.booked ??
        item?.hasBooking) ||
        type === 'booked' ||
        status === 'booked' ||
        status === 'reserved'
      )

      return [{
        id: item?._id ? String(item._id) : undefined,
        date,
        isBlocked,
        isBooked,
        reason: item?.reason ? String(item.reason) : undefined,
        type: item?.type ? String(item.type) : undefined,
        timeSlot: normalizeTimeSlot(item?.timeSlot),
      }]
    })
}

export const getVendorAvailability = async (
  vendorId: string | number,
  from?: string,
  to?: string,
  options?: { auth?: boolean }
) => {
  const primaryUrl = AVAILABILITY_ENDPOINTS.getVendorAvailability(vendorId, from, to)

  let response = await apiFetch(primaryUrl, {
    method: 'GET',
    auth: options?.auth ?? false,
  })

  if (response.status === 404) {
    try {
      const fallbackUrl = new URL(primaryUrl)
      const vendorIdSegment = `/${String(vendorId)}`

      if (fallbackUrl.pathname.endsWith(vendorIdSegment)) {
        fallbackUrl.pathname = fallbackUrl.pathname.slice(0, -vendorIdSegment.length)
      }

      fallbackUrl.searchParams.set('vendorId', String(vendorId))

      response = await apiFetch(fallbackUrl.toString(), {
        method: 'GET',
        auth: options?.auth ?? false,
      })
    } catch {
      // Ignore URL parsing failures and continue with original response handling.
    }
  }

  const payload = await parseJsonSafe(response)

  if (!response.ok) {
    if (response.status === 404) {
      return []
    }

    throw new Error(payload?.message || payload?.error || 'Failed to load availability.')
  }

  return normalizeAvailabilityDays(payload)
}

export const blockDateForVendor = async (
  date: string,
  options?: { vendorId?: string | number; reason?: string; timeSlot?: { from: string; to: string } }
) => {
  const body = JSON.stringify({
    date,
    vendorId: options?.vendorId,
    timeSlot: options?.timeSlot ?? { from: '10:00', to: '17:00' },
    reason: options?.reason ?? 'Blocked by vendor',
  })

  const fallbackUrls = [
    ...buildVendorAvailabilityFallbackUrls(options?.vendorId ?? '', date, 'block'),
    ...buildAvailabilityFallbackUrls(date, 'block'),
  ]
  let lastPayload: any = null

  for (const url of fallbackUrls) {
    console.log('[availability] block request', { url, vendorId: options?.vendorId, date, timeSlot: options?.timeSlot, reason: options?.reason })
    const isRootWrite = url.endsWith('/vendor/availability')
    const isVendorAwareWrite = url.includes(`/${encodeURIComponent(String(options?.vendorId ?? ''))}/`)
    const response = await apiFetch(url, {
      method: isRootWrite ? 'POST' : 'PUT',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    if (response.ok) return true

    lastPayload = await parseJsonSafe(response)
    console.error('[availability] block failed', {
      url,
      vendorId: options?.vendorId,
      status: response.status,
      statusText: response.statusText,
      data: lastPayload,
    })

    if (response.status !== 404) {
      throw new Error(lastPayload?.message || lastPayload?.error || 'Failed to block date.')
    }
  }

  console.error('[availability] block route not found', {
    attemptedUrls: fallbackUrls,
    vendorId: options?.vendorId,
    date,
    timeSlot: options?.timeSlot,
    reason: options?.reason,
    lastPayload,
  })
  throw new Error(lastPayload?.message || lastPayload?.error || 'Route not found for availability block.')
}

export const unblockDateForVendor = async (date: string, options?: { vendorId?: string | number }) => {
  const fallbackUrls = [
    ...buildVendorAvailabilityFallbackUrls(options?.vendorId ?? '', date, 'unblock'),
    ...buildAvailabilityFallbackUrls(date, 'unblock'),
  ]
  let lastPayload: any = null

  for (const url of fallbackUrls) {
    console.log('[availability] unblock request', { url, vendorId: options?.vendorId, date })
    const isRootWrite = url.endsWith('/vendor/availability')
    const response = await apiFetch(url, {
      method: isRootWrite ? 'POST' : 'DELETE',
      auth: true,
      headers: isRootWrite ? { 'Content-Type': 'application/json' } : undefined,
      body: isRootWrite ? JSON.stringify({ date, vendorId: options?.vendorId }) : undefined,
    })

    if (response.ok) return true

    lastPayload = await parseJsonSafe(response)
    console.error('[availability] unblock failed', {
      url,
      vendorId: options?.vendorId,
      status: response.status,
      statusText: response.statusText,
      data: lastPayload,
    })

    if (response.status !== 404) {
      throw new Error(lastPayload?.message || lastPayload?.error || 'Failed to unblock date.')
    }
  }

  console.error('[availability] unblock route not found', {
    attemptedUrls: fallbackUrls,
    vendorId: options?.vendorId,
    date,
    lastPayload,
  })
  throw new Error(lastPayload?.message || lastPayload?.error || 'Route not found for availability unblock.')
}

export default function AvailabilityApiRouteStub() {
  return null
}
