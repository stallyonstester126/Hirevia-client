'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        }
      case 'primary':
        return {
          iconBg: 'bg-blue-100 text-[#146BFF]',
          btnBg: 'bg-[#146BFF] hover:bg-[#0E5CE8] text-white shadow-blue-500/20',
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        }
      case 'danger':
      default:
        return {
          iconBg: 'bg-rose-100 text-rose-600',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ),
        }
    }
  }

  const { iconBg, btnBg, icon } = getVariantStyles()

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop with full-screen blur */}
      <div
        className="fixed inset-0 bg-slate-950/75 transition-opacity"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Foreground Modal Dialog Card */}
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 relative z-10 text-center space-y-5 animate-scaleIn">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mx-auto shadow-sm`}>
          {icon}
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            data-testid="modal-cancel-button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            data-testid="modal-confirm-button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 ${btnBg} text-xs sm:text-sm font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
