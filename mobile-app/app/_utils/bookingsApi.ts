import { BOOKING_ENDPOINTS } from '@/app/_constants/apiEndpoints'
import { apiFetchJson } from '@/app/_utils/apiClient'

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const firstDefined = <T>(...values: T[]): T | undefined => {
  return values.find((value) => value !== undefined && value !== null)
}

const mapStatus = (status: unknown): 'pending' | 'approved' | 'rejected' | 'confirmed' | 'completed' => {
  const normalized = String(status ?? 'PENDING').toUpperCase()

  if (normalized === 'APPROVED' || normalized === 'ACCEPTED') return 'approved'
  if (normalized === 'PAID' || normalized === 'CONFIRMED') return 'confirmed'
  if (normalized === 'DONE' || normalized === 'COMPLETED') return 'completed'
  if (normalized === 'REJECTED') return 'rejected'
  if (normalized === 'PENDING') return 'pending'

  return 'pending'
}

export type ClientBookingItem = {
  id: number
  category: string
  vendorName: string
  vendorLocation: string
  packageName: string
  date: string
  time: string
  guestCount?: number
  location?: string
  price: number
  advancePayment: number
  status: 'pending' | 'approved' | 'rejected' | 'confirmed' | 'completed'
  rejectionReason?: string
  bookingDate: string
}

export type VendorOrderItem = {
  id: string
  customerName: string
  customerPhoto: string
  serviceType: string
  packageName: string
  totalAmount: number
  eventDate: string
  eventDay: string
  eventTime: string
  guestCount: number
  status: 'pending' | 'accepted' | 'rejected'
}

export type CreateBookingPayload = {
  serviceId?: string | number
  vendorId?: string | number
  packageName: string
  category?: string
  date?: string
  eventDate: string
  timeSlot?: {
    from: string
    to: string
  }
  eventTime: string
  guestCount?: number
  location?: string
  specialRequests?: string
  addons?: { name: string; price: number }[]
  selectedAddons?: string[]
  totalAmount: number
  advancePayment: number
}

const normalizeTo24Hour = (value: string): string | null => {
  const raw = String(value || '').trim().toUpperCase()
  if (!raw) return null

  const normalized = raw.replace(/\s+/g, ' ')
  const ampmMatch = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/)
  if (ampmMatch) {
    let hour = Number(ampmMatch[1])
    const minute = Number(ampmMatch[2] ?? '0')
    const period = ampmMatch[3]

    if (hour === 12) hour = 0
    if (period === 'PM') hour += 12

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  const twentyFourMatch = normalized.match(/^(\d{1,2}):(\d{2})$/)
  if (twentyFourMatch) {
    const hour = Number(twentyFourMatch[1])
    const minute = Number(twentyFourMatch[2])
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    }
  }

  return null
}

const parseEventTimeToSlot = (eventTime: string | undefined) => {
  const raw = String(eventTime || '').trim()
  if (!raw) {
    return { from: '10:00', to: '17:00' }
  }

  const [fromRaw, toRaw] = raw.split(/\s*(?:to|-|–|—)\s*/i)
  const from = normalizeTo24Hour(fromRaw || '')
  const to = normalizeTo24Hour(toRaw || '')

  return {
    from: from ?? '10:00',
    to: to ?? '17:00',
  }
}

const mapCategoryToBackend = (category: string | undefined) => {
  const normalized = String(category || '').trim().toLowerCase()

  if (normalized === 'banquet' || normalized === 'banquet_hall' || normalized === 'banquet-hall') {
    return 'BANQUET_HALL'
  }
  if (normalized === 'catering') {
    return 'CATERING'
  }
  if (normalized === 'photo' || normalized === 'photography') {
    return 'PHOTOGRAPHY'
  }
  if (normalized === 'parlor' || normalized === 'parlour' || normalized === 'salon' || normalized === 'parlor_salon') {
    return 'PARLOR_SALON'
  }

  return category
}

export const createBooking = async (payload: CreateBookingPayload) => {
  const selectedAddons = Array.isArray(payload?.selectedAddons)
    ? payload.selectedAddons
    : Array.isArray(payload?.addons)
      ? payload.addons
          .map((addon) => String(addon?.name || '').trim())
          .filter((name) => name.length > 0)
      : []

  const body = {
    serviceId: payload.serviceId,
    category: mapCategoryToBackend(payload.category),
    packageName: payload.packageName,
    guestCount: payload.guestCount,
    date: payload.date ?? payload.eventDate,
    timeSlot: payload.timeSlot ?? parseEventTimeToSlot(payload.eventTime),
    location: payload.location,
    specialRequests: payload.specialRequests,
    selectedAddons,
    totalAmount: payload.totalAmount,
    advancePayment: payload.advancePayment,
  }

  return apiFetchJson<any>(
    BOOKING_ENDPOINTS.createBooking,
    {
      method: 'POST',
      auth: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    'Failed to create booking.'
  )
}

export const getMyBookings = async (): Promise<ClientBookingItem[]> => {
  const response = await apiFetchJson<any[]>(
    BOOKING_ENDPOINTS.myBookings,
    { method: 'GET', auth: true },
    'Failed to load your bookings.'
  )

  const raw = Array.isArray(response)
    ? response
    : Array.isArray((response as any)?.bookings)
      ? (response as any).bookings
      : []

  return raw.map((item: any, index: number) => {
    const eventDate = String(firstDefined(item?.eventDate, item?.date, item?.bookingDate, new Date().toISOString().slice(0, 10)))
    const bookingDate = String(firstDefined(item?.createdAt, item?.bookingDate, eventDate))
    const price = toNumber(firstDefined(item?.pricing?.totalAmount, item?.totalAmount, item?.price, item?.amount), 0)
    const fromTime = firstDefined(item?.timeSlot?.from, item?.time?.from)
    const toTime = firstDefined(item?.timeSlot?.to, item?.time?.to)
    const displayTime = fromTime && toTime
      ? `${fromTime} - ${toTime}`
      : String(firstDefined(item?.eventTime, item?.time, 'Not provided'))

    return {
      id: toNumber(firstDefined(item?.id, item?._id, index + 1), index + 1),
      category: String(firstDefined(item?.category, item?.service?.category, item?.serviceType, 'service')),
      vendorName: String(firstDefined(item?.vendorName, item?.vendor?.name, item?.service?.name, 'Vendor')),
      vendorLocation: String(firstDefined(item?.vendorLocation, item?.vendor?.location, item?.service?.basicInfo?.location, item?.service?.location, '')),
      packageName: String(firstDefined(item?.selectedPackage?.name, item?.packageName, item?.package?.name, item?.servicePackageName, 'Package')),
      date: eventDate,
      time: displayTime,
      guestCount: firstDefined(toNumber(item?.guestCount, NaN), undefined),
      location: firstDefined(item?.location, item?.eventLocation),
      price,
      advancePayment: toNumber(firstDefined(item?.pricing?.advanceAmount, item?.advancePayment, item?.advanceAmount), Math.round(price * 0.5)),
      status: mapStatus(item?.status),
      rejectionReason: firstDefined(item?.rejectionReason, item?.reason),
      bookingDate,
    }
  })
}

export const getVendorBookings = async (): Promise<VendorOrderItem[]> => {
  const response = await apiFetchJson<any[]>(
    BOOKING_ENDPOINTS.vendorBookings,
    { method: 'GET', auth: true },
    'Failed to load vendor bookings.'
  )

  const raw = Array.isArray(response)
    ? response
    : Array.isArray((response as any)?.bookings)
      ? (response as any).bookings
      : []

  return raw.map((item: any, index: number) => {
    const eventDate = String(firstDefined(item?.eventDate, item?.date, new Date().toISOString().slice(0, 10)))
    const day = new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long' })
    const normalizedStatus = String(firstDefined(item?.status, 'PENDING')).toUpperCase()
    const fromTime = firstDefined(item?.timeSlot?.from, item?.time?.from)
    const toTime = firstDefined(item?.timeSlot?.to, item?.time?.to)
    const displayTime = fromTime && toTime
      ? `${fromTime} - ${toTime}`
      : String(firstDefined(item?.eventTime, item?.time, 'Not provided'))

    return {
      id: String(firstDefined(item?.id, item?._id, index + 1)),
      customerName: String(firstDefined(item?.clientName, item?.client?.name, item?.user?.name, 'Client')),
      customerPhoto: String(firstDefined(item?.clientPhoto, item?.client?.avatar, 'https://i.pravatar.cc/150?img=12')),
      serviceType: String(firstDefined(item?.serviceType, item?.category, item?.service?.category, 'Service')),
      packageName: String(firstDefined(item?.selectedPackage?.name, item?.packageName, item?.package?.name, 'Package')),
      totalAmount: toNumber(firstDefined(item?.pricing?.totalAmount, item?.totalAmount, item?.price, item?.amount), 0),
      eventDate,
      eventDay: day,
      eventTime: displayTime,
      guestCount: toNumber(firstDefined(item?.guestCount, 0), 0),
      status: normalizedStatus === 'APPROVED' ? 'accepted' : normalizedStatus === 'REJECTED' ? 'rejected' : 'pending',
    }
  })
}

export const updateBookingStatus = async (bookingId: string | number, status: 'accepted' | 'rejected', rejectionReason?: string) => {
  const body: any = {
    status: status === 'accepted' ? 'APPROVED' : 'REJECTED',
  }
  
  if (status === 'rejected' && rejectionReason) {
    body.rejectionReason = rejectionReason
  }

  return apiFetchJson<any>(
    BOOKING_ENDPOINTS.updateBookingStatus(bookingId),
    {
      method: 'PATCH',
      auth: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    `Failed to update booking status.`
  )
}
