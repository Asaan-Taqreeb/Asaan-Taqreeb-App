# API Integration & Image Upload Updates

## Overview
This document summarizes all the changes made to align the mobile app with the updated backend API routes and add image upload functionality for vendors.

## Changes Made

### 1. API Endpoints Verification
✅ **File**: `app/_constants/apiEndpoints.ts`
- All endpoints verified and correctly configured
- Base URL: `https://asaan-taqreeb-backend.onrender.com`
- API prefix: `/api/v1`
- All auth, vendor, availability, booking, and message endpoints are properly defined

### 2. API Client Updates
✅ **File**: `app/_utils/apiClient.ts`
- Exported `parseJsonSafe` and `getMessageFromPayload` helper functions for use in image upload
- Maintained automatic token refresh and authentication handling
- Proper error handling for all API responses

### 3. Booking API Updates
✅ **File**: `app/_utils/bookingsApi.ts`
- `createBooking()` - Creates booking with proper payload format
- `getMyBookings()` - Fetches client bookings
- `getVendorBookings()` - Fetches vendor bookings
- `updateBookingStatus()` - Updates booking status (APPROVED/REJECTED)
- All functions properly map between frontend and backend data formats

### 4. Services API Enhancements
✅ **File**: `app/_utils/servicesApi.ts`
- **New Functions Added:**
  - `uploadServiceImages(serviceId, imageUris)` - Upload images to backend using FormData
  - `deleteServiceImage(serviceId, imageUrl)` - Delete specific image
  - `updateVendorService(serviceId, payload)` - Update service details
  - `deleteVendorService(serviceId)` - Delete service
  - `getServiceById(serviceId)` - Fetch single service details
  - `getMyVendorServices()` - Fetch vendor's own services (with fallback logic)
  - `createVendorService(payload)` - Create new service

**Features:**
- Proper category mapping (BANQUET_HALL, CATERING, PHOTOGRAPHY, PARLOR_SALON)
- Package management with price per head calculation
- Optional services/add-ons support
- Image upload with FormData (React Native compatible)
- Error handling and validation

### 5. Image Upload Component
✅ **File**: `app/screens/vendor/Component/ImageUploader.tsx`
- Reusable component for vendors to upload images
- Features:
  - Image picker integration using `expo-image-picker`
  - Maximum 5 images per service
  - Image preview with delete functionality
  - Upload progress indication
  - Error handling and user feedback
  - Works with both new services (local) and existing services (backend)

**Dependencies Added:**
- `expo-image-picker: ~15.0.5`

### 6. Vendor Service Forms Updated
✅ **Files Updated:**
- `app/screens/vendor/BanquetServiceForm.tsx`
- `app/screens/vendor/CateringServiceForm.tsx`
- `app/screens/vendor/PhotographyServiceForm.tsx`
- `app/screens/vendor/ParlorServiceForm.tsx`

**Changes:**
- Added `images` state to track selected images
- Imported and integrated `ImageUploader` component
- Images included in form data sent to backend
- UI positioned before packages section

### 7. Chat Storage & Booking Data Management
✅ **File**: `app/_utils/chatStorage.ts`
- Added `clearAllBookingRequests()` - Removes all vendor booking request chats
- Added `deleteAllVendorBookingRequests()` - Alias for above
- Keeps AI chats while clearing vendor chats

✅ **File**: `app/_utils/bookingDataManager.ts` (New)
- `clearOldBookingData()` - Utility to clear old booking requests
- `getBookingDataSummary()` - Get summary of booking data

## How to Use

### Clear Old Booking Requests
```typescript
import { clearOldBookingData } from '@/app/_utils/bookingDataManager'

// Clear old booking requests
await clearOldBookingData()
```

### Upload Service Images
```typescript
import { uploadServiceImages } from '@/app/_utils/servicesApi'

// Upload images for a service
await uploadServiceImages('serviceId123', [
  'file:///path/to/image1.jpg',
  'file:///path/to/image2.jpg'
])
```

### Create Service with Images
```typescript
import { createVendorService } from '@/app/_utils/servicesApi'

const formData = {
  category: 'BANQUET_HALL',
  basicInfo: {
    name: 'Grand Hall',
    location: 'Karachi',
    landmark: 'Near City Mall',
    about: 'Beautiful banquet hall'
  },
  capacity: {
    minGuests: 100,
    maxGuests: 500
  },
  images: ['file:///path/to/image.jpg'],
  packages: [...]
}

await createVendorService(formData)
```

## Testing Checklist

- [ ] Vendor can upload images when creating a service
- [ ] Images display in preview grid
- [ ] Images can be deleted from preview
- [ ] Service creation includes images in backend payload
- [ ] Old booking requests are cleared when using utility
- [ ] All API endpoints match backend contract
- [ ] Error messages display properly for failed uploads
- [ ] Image upload respects 5 image maximum limit

## API Routes Confirmed

### Authentication (`/auth`)
- POST `/auth/register` - Register user
- POST `/auth/login` - Login
- POST `/auth/refresh` - Refresh token
- POST `/auth/logout` - Logout (protected)
- GET `/auth/me` - Get current user (protected)
- PUT `/auth/me` - Update profile (protected)
- POST `/auth/forgot-password` - Forgot password
- POST `/auth/verify-otp` - Verify OTP
- POST `/auth/reset-password` - Reset password

### Vendor Services (`/vendor/services`)
- GET `/vendor/services` - Get all services
- GET `/vendor/services/:id` - Get service by ID
- POST `/vendor/services` - Create service (protected)
- GET `/vendor/services/me` - Get my services (protected)
- PUT `/vendor/services/:id` - Update service (protected)
- DELETE `/vendor/services/:id` - Delete service (protected)
- POST `/vendor/services/:id/images` - Upload images (protected)
- DELETE `/vendor/services/:id/images` - Delete image (protected)

### Packages & Add-ons
- POST `/vendor/services/:id/packages` - Add package
- PUT `/vendor/services/:id/packages/:pkgId` - Update package
- DELETE `/vendor/services/:id/packages/:pkgId` - Delete package
- POST `/vendor/services/:id/optional-services` - Add optional service
- PUT `/vendor/services/:id/optional-services/:addonId` - Update optional service
- DELETE `/vendor/services/:id/optional-services/:addonId` - Delete optional service

### Bookings (`/bookings`)
- POST `/bookings` - Create booking (protected)
- GET `/bookings/me` - Get my bookings (protected)
- GET `/bookings/vendor/me` - Get vendor bookings (protected)
- PATCH `/bookings/:id/status` - Update booking status (protected)

## Notes
- All image uploads use FormData for proper multipart handling
- Token refresh is automatic on 401 responses
- Error messages are user-friendly and extracted from backend responses
- Image URIs for React Native are expected in `file://` format
