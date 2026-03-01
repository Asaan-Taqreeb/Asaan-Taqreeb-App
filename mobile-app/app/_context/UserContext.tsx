import React, { createContext, useContext, useState, useEffect } from 'react'
import { getAccessToken } from '@/app/_utils/authStorage'
import { getCurrentUser } from '@/app/_utils/authApi'

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

  const refreshUser = async () => {
    try {
      const token = await getAccessToken()
      if (!token) {
        setUser(null)
        setLoading(false)
        return
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
      setUser(user)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <UserContext.Provider value={{ user, loading, setUser, refreshUser }}>
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
