'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IUser, EUserRoles } from '../types'
import { apiClient, ApiError } from '../lib/api-client'

interface AuthContextType {
  user: IUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: any) => Promise<void>
  register: (payload: any) => Promise<any>
  confirmRegistration: (token: string, code: string) => Promise<any>
  logout: () => Promise<void>
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const clearAuth = () => {
    setUser(null)
  }

  const checkUserSession = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get<IUser>('/user/me')
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkUserSession()

    const handleUnauthorized = () => {
      clearAuth()
      if (typeof window !== 'undefined') {
        router.push('/login')
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-unauthorized', handleUnauthorized)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth-unauthorized', handleUnauthorized)
      }
    }
  }, [router])

  const login = async (payload: any) => {
    setIsLoading(true)
    try {
      const response = await apiClient.post<any>('/login', payload)
      if (response.success && response.data?.user) {
        setUser(response.data.user)
      } else {
        // Fallback check session
        await checkUserSession()
      }
    } catch (error) {
      clearAuth()
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (payload: any) => {
    return await apiClient.post<any>('/register', payload)
  }

  const confirmRegistration = async (token: string, code: string) => {
    return await apiClient.patch<any>(`/registeration/confirm/${token}`, {}, {
      params: { code }
    })
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await apiClient.put<any>('/logout')
    } catch (error) {
      console.warn('Logout request completed with warning:', error)
    } finally {
      clearAuth()
      setIsLoading(false)
      router.push('/login')
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    confirmRegistration,
    logout,
    clearAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
