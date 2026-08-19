'use client'

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Service Worker registered successfully with scope:', reg.scope)
          })
          .catch((err) => {
            console.error('Service Worker registration failed:', err)
          })
      })
    } else if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'development'
    ) {
      // In development, register it immediately to test installability without load delay
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('SW registered in dev:', reg.scope)
        })
        .catch((err) => {
          console.error('SW failed in dev:', err)
        })
    }
  }, [])

  return null
}
