// API Endpoints
export const API_BASE_URL = 'https://asaan-taqreeb-backend.onrender.com'
export const API_PREFIX = '/api/v1'

const withApiPrefix = (path: string) => `${API_BASE_URL}${API_PREFIX}${path}`

export const AUTH_ENDPOINTS = {
  register: withApiPrefix('/auth/register'),
  login: withApiPrefix('/auth/login'),
  refresh: withApiPrefix('/auth/refresh'),
  logout: withApiPrefix('/auth/logout'),
  me: withApiPrefix('/auth/me'),
  updateMe: withApiPrefix('/auth/me'),
  forgotPassword: withApiPrefix('/auth/forgot-password'),
  verifyOtp: withApiPrefix('/auth/verify-otp'),
  resetPassword: withApiPrefix('/auth/reset-password'),
}

export const VENDOR_ENDPOINTS = {
  allVendors: withApiPrefix('/vendors'),
  allServices: withApiPrefix('/vendor/services'),
  createService: withApiPrefix('/vendor/services'),
  myServices: withApiPrefix('/vendor/services/me'),
  serviceById: (serviceId: string | number) => withApiPrefix(`/vendor/services/${serviceId}`),
  updateService: (serviceId: string | number) => withApiPrefix(`/vendor/services/${serviceId}`),
  deleteService: (serviceId: string | number) => withApiPrefix(`/vendor/services/${serviceId}`),
  uploadServiceImages: (serviceId: string | number) => withApiPrefix(`/vendor/services/${serviceId}/images`),
  deleteServiceImage: (serviceId: string | number) => withApiPrefix(`/vendor/services/${serviceId}/images`),

  addPackage: (serviceId: string | number) => withApiPrefix(`/vendor/services/${serviceId}/packages`),
  updatePackage: (serviceId: string | number, packageId: string | number) => withApiPrefix(`/vendor/services/${serviceId}/packages/${packageId}`),
  deletePackage: (serviceId: string | number, packageId: string | number) => withApiPrefix(`/vendor/services/${serviceId}/packages/${packageId}`),

  addOptionalService: (serviceId: string | number) => withApiPrefix(`/vendor/services/${serviceId}/optional-services`),
  updateOptionalService: (serviceId: string | number, addonId: string | number) => withApiPrefix(`/vendor/services/${serviceId}/optional-services/${addonId}`),
  deleteOptionalService: (serviceId: string | number, addonId: string | number) => withApiPrefix(`/vendor/services/${serviceId}/optional-services/${addonId}`),
}

export const AVAILABILITY_ENDPOINTS = {
  availabilityRoot: withApiPrefix('/vendor/availability'),
  getVendorAvailability: (vendorId: string | number, from?: string, to?: string) => {
    const query = new URLSearchParams()
    if (from) query.set('from', from)
    if (to) query.set('to', to)

    const queryString = query.toString()
    return `${withApiPrefix(`/vendor/availability/${vendorId}`)}${queryString ? `?${queryString}` : ''}`
  },
  blockAvailability: (date: string) => withApiPrefix(`/vendor/availability/${date}`),
  unblockAvailability: (date: string) => withApiPrefix(`/vendor/availability/${date}`),
}

export const BOOKING_ENDPOINTS = {
  createBooking: withApiPrefix('/bookings'),
  myBookings: withApiPrefix('/bookings/me'),
  vendorBookings: withApiPrefix('/bookings/vendor/me'),
  updateBookingStatus: (bookingId: string | number) => withApiPrefix(`/bookings/${bookingId}/status`),
}

export const MESSAGE_ENDPOINTS = {
  chatHistory: (chatId: string | number) => withApiPrefix(`/messages/${chatId}`),
  sendMessage: withApiPrefix('/messages'),
  markChatAsRead: (chatId: string | number) => withApiPrefix(`/messages/${chatId}/read`),
  unreadCount: withApiPrefix('/messages/count/unread'),
}

export default function ApiEndpointsRouteStub() {
  return null
}
