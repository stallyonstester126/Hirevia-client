'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { apiClient } from '../lib/api-client'
import { ICheckoutResponse } from '../types'

interface MembershipModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MembershipModal({ isOpen, onClose }: MembershipModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock background body and html scroll when modal is open to ensure 100% full-screen blur coverage
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

  const handleSubscribe = async () => {
    setIsCheckingOut(true)
    setErrorMsg('')
    try {
      const res = await apiClient.post<ICheckoutResponse>('/company/jobs/subscription/checkout')
      if (res.success && res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start membership checkout. Please try again.')
      setIsCheckingOut(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Dedicated Backdrop Layer with guaranteed full-screen blur */}
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

      {/* Sharp Foreground Modal Card */}
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 relative z-10 text-center space-y-6 my-auto">
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
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            Employer Membership Required
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 pt-1">
            Unlock Unlimited Job Postings
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To publish job openings and review candidates, activate your one-time employer membership for only <span className="font-bold text-slate-900">$10</span>. No recurring monthly subscriptions or per-job posting fees.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs text-red-800 flex items-center gap-2.5 text-left">
            <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Benefits Checklist */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Membership Benefits:</h3>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span> Unlimited live job postings forever
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span> AI Auto-Screening & Candidate Scoring
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span> Automated AI Voice Interviews & Tests
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span> Direct applicant tracking & review pipeline
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleSubscribe}
            disabled={isCheckingOut}
            className="w-full py-3 px-6 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer disabled:opacity-60"
          >
            {isCheckingOut ? 'Opening Stripe Checkout...' : 'Buy Membership ($10 One-Time) →'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
