import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const ACCESS_TOKEN_KEY = 'auth_access_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'

const saveItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value)
    return
  }

  await SecureStore.setItemAsync(key, value)
}

const getItem = async (key: string) => {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key)
  }

  return SecureStore.getItemAsync(key)
}

const deleteItem = async (key: string) => {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key)
    return
  }

  await SecureStore.deleteItemAsync(key)
}

export const saveAuthTokens = async (accessToken: string, refreshToken: string) => {
  await Promise.all([
    saveItem(ACCESS_TOKEN_KEY, accessToken),
    saveItem(REFRESH_TOKEN_KEY, refreshToken),
  ])
}

export const getAccessToken = async () => getItem(ACCESS_TOKEN_KEY)

export const getRefreshToken = async () => getItem(REFRESH_TOKEN_KEY)

export const clearAuthTokens = async () => {
  await Promise.all([deleteItem(ACCESS_TOKEN_KEY), deleteItem(REFRESH_TOKEN_KEY)])
}

export default function AuthStorageRouteStub() {
  return null
}
