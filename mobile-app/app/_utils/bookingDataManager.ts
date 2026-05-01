import { clearAllBookingRequests } from '@/app/_utils/chatStorage'

/**
 * Clear all old booking requests from local storage.
 * This is useful when starting fresh with the app.
 */
export const clearOldBookingData = async (): Promise<void> => {
  try {
    await clearAllBookingRequests()
    console.log('✓ Old booking requests cleared successfully')
  } catch (error) {
    console.error('Failed to clear booking data:', error)
    throw error
  }
}

/**
 * Get a summary of current booking data
 */
export const getBookingDataSummary = async () => {
  // This can be extended in the future to get actual booking counts
  // from both local storage and backend
  return {
    localStorageCleared: true,
    timestamp: new Date().toISOString()
  }
}

export default {
  clearOldBookingData,
  getBookingDataSummary
}
