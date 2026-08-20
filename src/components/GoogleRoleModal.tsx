'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { EUserRoles } from '../types'

interface GoogleRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectRole: (role: EUserRoles) => void
}

export default function GoogleRoleModal({
  isOpen,
  onClose,
  onSelectRole,
}: GoogleRoleModalProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedRole, setSelectedRole] = useState<EUserRoles>(EUserRoles.SEEKER)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock scroll on open
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow
      const originalHtmlOverflow = document.documentElement.style.overflow
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalBodyOverflow
        document.documentElement.style.overflow = originalHtmlOverflow
      }
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Full-screen Backdrop */}
      <div
        className="fixed inset-0 w-full h-full bg-slate-950/80 transition-opacity"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          minHeight: '100dvh',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 relative z-10 text-center space-y-6 my-auto animate-scaleIn">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon & Title */}
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-[#146BFF] flex items-center justify-center mx-auto shadow-xs">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            Continue with Google
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Please choose your account type to proceed with Google sign-in.
          </p>
        </div>

        {/* Role Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {/* Seeker / Candidate */}
          <button
            type="button"
            onClick={() => setSelectedRole(EUserRoles.SEEKER)}
            className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 cursor-pointer ${
              selectedRole === EUserRoles.SEEKER
                ? 'border-[#146BFF] bg-blue-50/70 ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#146BFF] flex items-center justify-center text-base">
                👤
              </div>
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selectedRole === EUserRoles.SEEKER
                  ? 'border-[#146BFF] bg-[#146BFF]'
                  : 'border-slate-300'
              }`}>
                {selectedRole === EUserRoles.SEEKER && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </span>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">Candidate</p>
              <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Looking for jobs & career growth</p>
            </div>
          </button>

          {/* Company / Employer */}
          <button
            type="button"
            onClick={() => setSelectedRole(EUserRoles.COMPANY)}
            className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 cursor-pointer ${
              selectedRole === EUserRoles.COMPANY
                ? 'border-[#146BFF] bg-blue-50/70 ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-base">
                🏢
              </div>
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selectedRole === EUserRoles.COMPANY
                  ? 'border-[#146BFF] bg-[#146BFF]'
                  : 'border-slate-300'
              }`}>
                {selectedRole === EUserRoles.COMPANY && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </span>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">Employer</p>
              <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Hiring talent & posting jobs</p>
            </div>
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => onSelectRole(selectedRole)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#146BFF] hover:bg-[#0E5CE8] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <span>Continue as {selectedRole === EUserRoles.COMPANY ? 'Employer' : 'Candidate'}</span>
          <span>→</span>
        </button>
      </div>
    </div>,
    document.body
  )
}
