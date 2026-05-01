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

      // Only show as booked if type is explicitly 'booked', not 'pending_booking'
      const displayIsBooked = type === 'booked' ? isBooked : false

      return [{
        id: item?._id ? String(item._id) : undefined,
        date,
        isBlocked,
        isBooked: displayIsBooked,
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
    timeSlot: options?.timeSlot ?? { from: '10:00', to: '17:00' },
    reason: options?.reason ?? 'Blocked by vendor',
  })

  const url = AVAILABILITY_ENDPOINTS.blockAvailability(date)
  
  console.log('[availability] block request', { 
    url, 
    vendorId: options?.vendorId, 
    date, 
    timeSlot: options?.timeSlot, 
    reason: options?.reason 
  })

  const response = await apiFetch(url, {
    method: 'PUT',
    auth: true,
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  const payload = await parseJsonSafe(response)

  if (!response.ok) {
    console.error('[availability] block failed', {
      url,
      vendorId: options?.vendorId,
      status: response.status,
      statusText: response.statusText,
      data: payload,
    })
    throw new Error(payload?.message || payload?.error || 'Failed to block date.')
  }

  return true
}

export const unblockDateForVendor = async (date: string, options?: { vendorId?: string | number; timeSlot?: { from: string; to: string } }) => {
  const body = JSON.stringify({
    timeSlot: options?.timeSlot ?? { from: '10:00', to: '17:00' },
  })
  
  const url = AVAILABILITY_ENDPOINTS.unblockAvailability(date)
  
  console.log('[availability] unblock request', { url, vendorId: options?.vendorId, date, timeSlot: options?.timeSlot })

  const response = await apiFetch(url, {
    method: 'DELETE',
    auth: true,
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  const payload = await parseJsonSafe(response)

  if (!response.ok) {
    console.error('[availability] unblock failed', {
      url,
      vendorId: options?.vendorId,
      status: response.status,
      statusText: response.statusText,
      data: payload,
    })
    throw new Error(payload?.message || payload?.error || 'Failed to unblock date.')
  }

  return true
}

export default function AvailabilityApiRouteStub() {
  return null
}
