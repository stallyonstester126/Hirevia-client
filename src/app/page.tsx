'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { EUserRoles } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'

export default function RootPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user) {
      router.replace('/login')
    } else {
      if (user.role === EUserRoles.SEEKER) {
        router.replace('/seeker')
      } else if (user.role === EUserRoles.COMPANY) {
        router.replace('/company')
      } else {
        router.replace('/login')
      }
    }
  }, [isLoading, isAuthenticated, user, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}
