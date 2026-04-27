import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getAccessToken } from '@/app/_utils/authStorage'
import { getCurrentUser } from '@/app/_utils/authApi'
import { SessionExpiredError } from '@/app/_utils/apiClient'

const USER_STORAGE_KEY = 'auth_user_profile'

export interface UserData {
  id?: string
  name?: string
  email?: string
  role?: 'client' | 'vendor'
  [key: string]: any
}

interface UserContextType {
  user: UserData | null
  loading: boolean
  setUser: (user: UserData | null) => void
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const saveUserToStorage = useCallback(async (nextUser: UserData | null) => {
    if (!nextUser) {
      await AsyncStorage.removeItem(USER_STORAGE_KEY)
      return
    }

    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
  }, [])

  const loadUserFromStorage = useCallback(async (): Promise<UserData | null> => {
    try {
      const raw = await AsyncStorage.getItem(USER_STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as UserData
    } catch {
      return null
    }
  }, [])

  const setUserState = useCallback((nextUser: UserData | null) => {
    setUser(nextUser)
    saveUserToStorage(nextUser).catch((error) => {
      console.log('Failed to persist user profile:', error)
    })
  }, [saveUserToStorage])

  const refreshUser = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getAccessToken()
      if (!token) {
        setUserState(null)
        setLoading(false)
        return
      }

      const cachedUser = await loadUserFromStorage()
      if (cachedUser) {
        setUser(cachedUser)
      }

      const userData = await getCurrentUser()
      const userPayload = userData?.data ?? userData
      
      // Handle nested user object structure
      const userInfo = userPayload?.user ?? userPayload

      const user = {
        id: userInfo?.id || userInfo?._id,
        name: userInfo?.name,
        email: userInfo?.email,
        role: userInfo?.role,
        ...userInfo,
      }
      console.log('UserContext refreshUser - loaded user data:', user)
      setUserState(user)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      if (error instanceof SessionExpiredError) {
        setUserState(null)
      } else {
        const cachedUser = await loadUserFromStorage()
        if (cachedUser) {
          setUser(cachedUser)
        } else {
          setUserState(null)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [loadUserFromStorage, setUserState])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  return (
    <UserContext.Provider value={{ user, loading, setUser: setUserState, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}

export default function UserContextRouteStub() {
  return null
}
