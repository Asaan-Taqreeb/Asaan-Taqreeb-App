import AsyncStorage from '@react-native-async-storage/async-storage'

const ONBOARDING_SEEN_PREFIX = 'onboarding_seen'

const normalizeIdentifier = (identifier?: string | null) => {
  if (!identifier) return 'anonymous'
  return identifier.trim().toLowerCase()
}

const keyFor = (identifier?: string | null) => `${ONBOARDING_SEEN_PREFIX}:${normalizeIdentifier(identifier)}`

export const hasSeenOnboarding = async (identifier?: string | null) => {
  const value = await AsyncStorage.getItem(keyFor(identifier))
  return value === '1'
}

export const markOnboardingSeen = async (identifier?: string | null) => {
  await AsyncStorage.setItem(keyFor(identifier), '1')
}

export default function OnboardingStorageRouteStub() {
  return null
}