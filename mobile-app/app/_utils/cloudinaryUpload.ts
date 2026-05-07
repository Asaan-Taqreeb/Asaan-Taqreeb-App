// ─────────────────────────────────────────────────────────
// Cloudinary Direct Upload Utility
// ─────────────────────────────────────────────────────────
// This bypasses the backend Supabase upload entirely.
// Images are uploaded directly from the device to Cloudinary.
// The returned HTTPS URL is then saved to the backend/MongoDB.
//
// HOW TO SET UP (one-time, 2 minutes):
//   1. Go to https://cloudinary.com → Sign up free
//   2. Copy your Cloud Name from the dashboard
//   3. Go to Settings → Upload → Upload Presets → Add preset
//      - Signing Mode: Unsigned
//      - Copy the preset name
//   4. Replace CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET below
// ─────────────────────────────────────────────────────────

import { Platform } from 'react-native'

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ''
const CLOUDINARY_FOLDER = 'asaan-taqreeb/services'

const BACKEND_URL = 'https://asaantaqreeb.duckdns.org'
const DELETE_ENDPOINT = `${BACKEND_URL}/api/v1/media/delete`

export const isCloudinaryConfigured = () =>
  Boolean(CLOUDINARY_CLOUD_NAME?.trim()) && Boolean(CLOUDINARY_UPLOAD_PRESET?.trim())

/**
 * Upload a single image URI to Cloudinary.
 * Returns the secure HTTPS URL of the uploaded image.
 */
export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const filename = uri.split('/').pop() || `image_${Date.now()}.jpg`
  const match = /\.(\w+)$/.exec(filename)
  const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg'

  const formData = new FormData()
  
  if (Platform.OS === 'web') {
    // Web requires a Blob/File object
    const response = await fetch(uri)
    const blob = await response.blob()
    formData.append('file', blob, filename)
  } else {
    // React Native handles the {uri, type, name} object
    formData.append('file', { uri, type, name: filename } as any)
  }

  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', CLOUDINARY_FOLDER)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData?.error?.message || `Cloudinary upload failed (${response.status})`)
  }

  const data = await response.json()
  const url = data?.secure_url
  if (!url) throw new Error('Cloudinary did not return a URL')
  return url
}

/**
 * Upload multiple image URIs to Cloudinary concurrently.
 * Returns an array of secure HTTPS URLs.
 */
export const uploadMultipleToCloudinary = async (uris: string[]): Promise<string[]> => {
  const results = await Promise.allSettled(uris.map(uploadToCloudinary))
  const urls: string[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      urls.push(result.value)
    } else {
      console.warn('Cloudinary upload failed for one image:', result.reason?.message)
    }
  }
  return urls
}

/**
 * Securely delete an image from Cloudinary via our backend.
 * This ensures the API Secret is never exposed in the mobile app.
 */
export const deleteFromCloudinary = async (imageUrl: string): Promise<boolean> => {
  try {
    if (!imageUrl) return false;

    console.log('Requesting backend to delete image:', imageUrl);

    const response = await fetch(DELETE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Backend deletion failed:', data.message);
      return false;
    }

    console.log('Image deleted successfully from Cloudinary');
    return true;
  } catch (error) {
    console.error('Error calling backend delete:', error);
    return false;
  }
}

// Default export to satisfy Expo Router's requirement for files in the app/ directory
export default function CloudinaryUtilityStub() {
  return null;
}


