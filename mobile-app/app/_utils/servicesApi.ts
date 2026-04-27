import { AUTH_ENDPOINTS, VENDOR_ENDPOINTS } from '@/app/_constants/apiEndpoints'
import { apiFetchJson } from '@/app/_utils/apiClient'

export type ServicePackage = {
  id?: string | number
  packageName: string
  price: number
  items?: string[]
  mainCourse?: string[]
  desserts?: string[]
  drinks?: string[]
  pricePerHead?: number
  guestCount?: number
  details?: string
  [key: string]: any
}

export type ServiceListItem = {
  id: string
  serviceId: string
  vendorId?: string | number
  key: 'banquet' | 'catering' | 'photo' | 'parlor'
  category: 'banquet' | 'catering' | 'photo' | 'parlor'
  name: string
  location: string
  about: string
  price: number
  images: string[]
  minGuests?: number
  maxGuests?: number
  rating: number
  packages: ServicePackage[]
  optionalServices?: { name: string; price: number }[]
  createdAt?: string
  updatedAt?: string
}

const toCategoryKey = (value: unknown): ServiceListItem['category'] => {
  const raw = String(value ?? '').toLowerCase().trim()

  if (raw.includes('banquet') || raw.includes('hall')) return 'banquet'
  if (raw.includes('cater')) return 'catering'
  if (raw.includes('photo')) return 'photo'
  if (raw.includes('parlor') || raw.includes('salon')) return 'parlor'

  return 'banquet'
}

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toFiniteNumberOrUndefined = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const firstDefined = <T>(...values: T[]): T | undefined => {
  return values.find((value) => value !== undefined && value !== null)
}

const normalizeImageUrls = (service: any): string[] => {
  const rawImages = firstDefined<any[]>(service?.images, service?.imageUrls, service?.photos)
  if (Array.isArray(rawImages) && rawImages.length > 0) {
    return rawImages.filter((url) => typeof url === 'string' && url.trim().length > 0)
  }

  const cover = firstDefined(service?.coverImage, service?.image, service?.photo)
  if (typeof cover === 'string' && cover.trim()) {
    return [cover]
  }

  return ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80']
}

const normalizePackages = (service: any): ServicePackage[] => {
  const rawPackages = firstDefined<any[]>(service?.packages, service?.packageList)

  if (!Array.isArray(rawPackages) || rawPackages.length === 0) {
    return [
      {
        id: 'default',
        packageName: String(firstDefined(service?.name, service?.title, service?.placeName, 'Standard Package')),
        price: toNumber(firstDefined(service?.price, service?.basePrice, service?.startingPrice), 0),
        items: [],
      },
    ]
  }

  return rawPackages.map((pkg: any, index: number) => ({
    id: firstDefined(pkg?.id, pkg?._id, String(index + 1)),
    packageName: String(firstDefined(pkg?.packageName, pkg?.name, `Package ${index + 1}`)),
    price: toNumber(firstDefined(pkg?.price, pkg?.amount, pkg?.totalPrice), 0),
    items: Array.isArray(pkg?.items) ? pkg.items : undefined,
    mainCourse: Array.isArray(pkg?.mainCourse) ? pkg.mainCourse : undefined,
    desserts: Array.isArray(pkg?.desserts) ? pkg.desserts : undefined,
    drinks: Array.isArray(pkg?.drinks) ? pkg.drinks : undefined,
    pricePerHead: toFiniteNumberOrUndefined(pkg?.pricePerHead),
    guestCount: toFiniteNumberOrUndefined(pkg?.guestCount),
    details: firstDefined(pkg?.details, undefined),
  }))
}

const normalizeOptionalServices = (service: any): { name: string; price: number }[] => {
  const rawOptional = firstDefined<any[]>(
    service?.optionalServices,
    service?.optionalDishes,
    service?.addons,
    service?.addOns
  )

  if (!Array.isArray(rawOptional) || rawOptional.length === 0) {
    return []
  }

  return rawOptional
    .map((item: any) => ({
      name: String(firstDefined(item?.name, item?.title, '')).trim(),
      price: toNumber(firstDefined(item?.price, item?.amount), 0),
    }))
    .filter((item) => item.name.length > 0)
}

const extractServicesArray = (response: any): any[] => {
  const candidates = [
    response,
    response?.data,
    response?.services,
    response?.items,
    response?.results,
    response?.data?.services,
    response?.data?.items,
    response?.data?.results,
    response?.data?.data,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  return []
}

const getServiceTimestamp = (service: any) => {
  const raw = firstDefined(service?.updatedAt, service?.updated_at, service?.createdAt, service?.created_at)
  const time = new Date(String(raw || '')).getTime()
  return Number.isFinite(time) ? time : 0
}

const getServiceOwnerId = (service: any) => {
  const owner = firstDefined(
    service?.user?._id,
    service?.user?.id,
    service?.user,
    service?.vendorId,
    service?.vendor?._id,
    service?.vendor?.id,
    service?.ownerId,
    ''
  )

  if (typeof owner === 'object' && owner !== null) {
    return String(firstDefined((owner as any)?._id, (owner as any)?.id, ''))
  }

  return String(owner || '')
}

const dedupeLatestServiceSnapshots = (services: any[]) => {
  const sorted = [...services].sort((a, b) => getServiceTimestamp(b) - getServiceTimestamp(a))
  const seen = new Set<string>()
  const deduped: any[] = []

  for (const service of sorted) {
    const ownerId = getServiceOwnerId(service)
    const category = String(firstDefined(service?.category, service?.serviceType, service?.type, '')).toLowerCase()
    const fallbackId = String(firstDefined(service?._id, service?.id, service?.serviceId, Math.random().toString(36).slice(2)))
    const name = String(firstDefined(service?.basicInfo?.name, service?.name, service?.title, '')).toLowerCase().trim()
    const location = String(firstDefined(service?.basicInfo?.location, service?.location, service?.address, '')).toLowerCase().trim()
    const semanticKey = category && (ownerId || name || location)
      ? `${ownerId || name || 'unknown'}::${category}::${location}`
      : fallbackId
    const key = semanticKey

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(service)
  }

  return deduped
}


export const mapServiceToUi = (service: any): ServiceListItem => {
  const category = toCategoryKey(firstDefined(service?.category, service?.serviceType, service?.type))
  const packages = normalizePackages(service)
  const optionalServices = normalizeOptionalServices(service)
  const bi = service?.basicInfo ?? {}

  return {
    id: String(firstDefined(service?.id, service?._id, service?.serviceId, Math.random().toString(36).slice(2))),
    serviceId: String(firstDefined(service?.id, service?._id, service?.serviceId, '')),
    vendorId: getServiceOwnerId(service) || undefined,
    key: category,
    category,
    name: String(firstDefined(bi?.name, service?.placeName, service?.name, service?.title, service?.vendorName, 'Unnamed Service')),
    location: String(firstDefined(bi?.location, service?.location, service?.address, service?.vendorLocation, 'Location not set')),
    about: String(firstDefined(bi?.about, service?.about, service?.description, 'No description available')),
    price: toNumber(firstDefined(service?.price, service?.startingPrice, packages[0]?.price), 0),
    images: normalizeImageUrls(service),
    minGuests: firstDefined(toNumber(service?.capacity?.minGuests, NaN), toNumber(service?.minGuests, NaN), toNumber(service?.capacityMin, NaN)) || undefined,
    maxGuests: firstDefined(toNumber(service?.capacity?.maxGuests, NaN), toNumber(service?.maxGuests, NaN), toNumber(service?.capacityMax, NaN)) || undefined,
    rating: toNumber(firstDefined(service?.rating, service?.averageRating), 4.0),
    packages,
    optionalServices,
    createdAt: firstDefined(service?.createdAt, service?.created_at),
    updatedAt: firstDefined(service?.updatedAt, service?.updated_at),
  }
}

export const getAllServices = async (): Promise<ServiceListItem[]> => {
  const noCacheUrl = `${VENDOR_ENDPOINTS.allServices}${VENDOR_ENDPOINTS.allServices.includes('?') ? '&' : '?'}_t=${Date.now()}`

  const response = await apiFetchJson<any[]>(
    noCacheUrl,
    {
      method: 'GET',
      auth: false,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
    'Failed to load services.'
  )

  const rawServices = dedupeLatestServiceSnapshots(extractServicesArray(response))

  return rawServices.map(mapServiceToUi)
}

export const createVendorService = async (payload: Record<string, any>) => {
  // Map frontend short names → exact backend enum values
  const categoryMap: Record<string, string> = {
    banquet: 'BANQUET_HALL',
    banquet_hall: 'BANQUET_HALL',
    'banquet-hall': 'BANQUET_HALL',
    venue: 'BANQUET_HALL',
    catering: 'CATERING',
    photo: 'PHOTOGRAPHY',
    photography: 'PHOTOGRAPHY',
    photographer: 'PHOTOGRAPHY',
    parlor: 'PARLOR_SALON',
    parlour: 'PARLOR_SALON',
    salon: 'PARLOR_SALON',
    beauty: 'PARLOR_SALON',
    beautician: 'PARLOR_SALON',
  }

  const rawCategory = String(firstDefined(payload?.category, payload?.serviceType, '')).toLowerCase().trim()
  const category = categoryMap[rawCategory] ?? rawCategory.toUpperCase()

  // Enforce one service category per vendor account on client side
  try {
    const existingResponse = await apiFetchJson<any>(
      VENDOR_ENDPOINTS.myServices,
      { method: 'GET', auth: true },
      'Failed to load your services.'
    )

    const existingServices = extractServicesArray(existingResponse)
    if (existingServices.length > 0) {
      const existingRawCategory = String(firstDefined(
        existingServices[0]?.category,
        existingServices[0]?.serviceType,
        ''
      )).toLowerCase()
      const existingNormalizedCategory = categoryMap[existingRawCategory] ?? existingRawCategory.toUpperCase()

      if (existingNormalizedCategory && existingNormalizedCategory !== category) {
        throw new Error('This vendor account already has a service category. You cannot add a different service category with the same email.')
      }
    }
  } catch (error: any) {
    const message = String(error?.message || '').toLowerCase()
    if (
      message.includes('already has a service category') ||
      message.includes('cannot add a different service category')
    ) {
      throw error
    }
    // If pre-check fails due to network issue, proceed and let backend decide.
  }

  const name = String(firstDefined(payload?.name, payload?.placeName, payload?.title, '')).trim()
  const location = String(firstDefined(payload?.location, payload?.address, '')).trim()
  const landmark = String(firstDefined(payload?.nearbyLandmark, payload?.landmark, '') ?? '')
  const about = String(firstDefined(payload?.about, payload?.description, '') ?? '')

  // Normalize packages: backend uses `name` not `packageName`
  const rawPackages = Array.isArray(payload?.packages) ? payload.packages : []
  const normalizedPackages = rawPackages
    .map((pkg: any) => {
      const pkgName = String(firstDefined(pkg?.packageName, pkg?.name, '')).trim()
      const price = toNumber(firstDefined(pkg?.price, pkg?.amount), NaN)
      if (!pkgName || !Number.isFinite(price)) return null

      const mergedItems = [
        ...(Array.isArray(pkg?.items) ? pkg.items : []),
        ...(Array.isArray(pkg?.mainCourse) ? pkg.mainCourse : []),
        ...(Array.isArray(pkg?.desserts) ? pkg.desserts : []),
        ...(Array.isArray(pkg?.drinks) ? pkg.drinks : []),
      ]
        .map((item) => String(item || '').trim())
        .filter(Boolean)

      const result: Record<string, any> = { name: pkgName, price, items: mergedItems }

      if (pkg?.pricePerHead !== undefined && pkg?.pricePerHead !== '') {
        const pricePerHead = toFiniteNumberOrUndefined(pkg.pricePerHead)
        if (pricePerHead !== undefined) {
          result.pricePerHead = pricePerHead
        }
      }
      if (pkg?.guestCount !== undefined && pkg?.guestCount !== '') {
        const guestCount = toFiniteNumberOrUndefined(pkg.guestCount)
        if (guestCount !== undefined) {
          result.guestCount = guestCount
        }
      }
      if (pkg?.details !== undefined && pkg?.details !== '') {
        result.details = String(pkg.details)
      }

      return result
    })
    .filter(Boolean)

  const requestBody: Record<string, any> = {
    category,
    basicInfo: { name, location, landmark, about },
    packages: normalizedPackages,
  }

  // BANQUET_HALL: capacity
  if (category === 'BANQUET_HALL') {
    const minGuests = toNumber(firstDefined(payload?.minGuests, payload?.capacity?.minGuests), NaN)
    const maxGuests = toNumber(firstDefined(payload?.maxGuests, payload?.capacity?.maxGuests), NaN)
    requestBody.capacity = {
      ...(Number.isFinite(minGuests) ? { minGuests } : {}),
      ...(Number.isFinite(maxGuests) ? { maxGuests } : {}),
    }
  }

  const rawOptional = firstDefined<any[]>(payload?.optionalServices, payload?.optionalDishes)
  if (Array.isArray(rawOptional) && rawOptional.length > 0) {
    requestBody.optionalServices = rawOptional
      .filter((s: any) => s?.name?.trim() && s?.price !== undefined)
      .map((s: any) => ({ name: String(s.name), price: toNumber(s.price, 0) }))
  }

  return apiFetchJson<any>(
    VENDOR_ENDPOINTS.createService,
    {
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    },
    'Failed to create service.'
  )
}

export const getMyVendorServices = async (): Promise<ServiceListItem[]> => {
  try {
    const noCacheMyUrl = `${VENDOR_ENDPOINTS.myServices}${VENDOR_ENDPOINTS.myServices.includes('?') ? '&' : '?'}_t=${Date.now()}`
    const response = await apiFetchJson<any[]>(
      noCacheMyUrl,
      {
        method: 'GET',
        auth: true,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
      'Failed to load your services.'
    )

    const rawServices = extractServicesArray(response)
    return rawServices.map(mapServiceToUi)
  } catch (originalError) {
    const [meResponse, allServicesResponse] = await Promise.all([
      apiFetchJson<any>(AUTH_ENDPOINTS.me, { method: 'GET', auth: true }, 'Failed to load profile.'),
      apiFetchJson<any>(VENDOR_ENDPOINTS.allServices, { method: 'GET', auth: false }, 'Failed to load services.'),
    ])

    const me = (meResponse as any)?.user ?? (meResponse as any)?.data ?? meResponse
    const currentUserId = String(firstDefined(me?.id, me?._id, me?.user?.id, me?.user?._id, ''))

    if (!currentUserId) {
      throw originalError
    }

    const allServices = extractServicesArray(allServicesResponse)
    const ownServices = allServices.filter((service: any) => {
      const ownerId = String(
        firstDefined(
          service?.user?._id,
          service?.user?.id,
          service?.user,
          service?.vendorId,
          service?.vendor?._id,
          service?.vendor?.id,
          ''
        )
      )

      return ownerId === currentUserId
    })

    return ownServices.map(mapServiceToUi)
  }
}

export default function ServicesApiRouteStub() {
  return null
}
