'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { EUserRoles } from '../types'
import LoadingSpinner from '@/components/LoadingSpinner'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRole: EUserRoles
}

export default function AuthGuard({ children, allowedRole }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user) {
      router.replace('/login')
      return
    }

    if (user.role !== allowedRole) {
      if (user.role === EUserRoles.SEEKER) {
        router.replace('/seeker')
      } else if (user.role === EUserRoles.COMPANY) {
        router.replace('/company')
      } else {
        router.replace('/login')
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRole, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated || !user || user.role !== allowedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    )
  }

  return <>{children}</>
}
