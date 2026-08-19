'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { apiClient } from '../../../lib/api-client'
import LoadingSpinner from '../../../components/LoadingSpinner'

interface IConfirmResult {
  type?: string
  subscriptionStatus?: string
  jobId?: string
  jobTitle?: string
  status?: string
  paymentStatus?: string
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [confirming, setConfirming] = useState(true)
  const [resultInfo, setResultInfo] = useState<IConfirmResult | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (sessionId) {
      confirmPayment(sessionId)
    } else {
      setConfirming(false)
    }
  }, [sessionId])

  const confirmPayment = async (sid: string) => {
    setConfirming(true)
    try {
      const res = await apiClient.post<IConfirmResult>('/company/jobs/confirm-payment', {
        sessionId: sid,
      })
      if (res.success && res.data) {
        setResultInfo(res.data)
        if (res.data.status === 'PUBLISHED') {
          setIsPublished(true)
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || '')
    } finally {
      setConfirming(false)
    }
  }

  const handlePublishNow = async () => {
    if (!resultInfo?.jobId) return
    setPublishing(true)
    try {
      const res = await apiClient.patch(`/company/jobs/${resultInfo.jobId}/publish`)
      if (res.success) {
        setIsPublished(true)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish job.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200/60 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/5 p-7 sm:p-9 text-center space-y-6 animate-fadeIn">
        {/* Verified Badge & Checkmark Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Verified Payment
          </div>

          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-8 ring-emerald-50">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Title and Message */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
            Membership Activated!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
            Your $10 one-time membership has been verified. You now have unlimited job postings and candidate management.
          </p>
        </div>

        {/* Professional Summary Box */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-left divide-y divide-slate-200/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500 font-medium">Plan Type</span>
            <span className="font-bold text-slate-800">Employer Unlimited Membership</span>
          </div>

          {resultInfo?.jobTitle && (
            <div className="flex items-center justify-between text-xs pt-2.5">
              <span className="text-slate-500 font-medium">Position</span>
              <span className="font-bold text-slate-800 truncate max-w-[180px]">{resultInfo.jobTitle}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-2.5">
            <span className="text-slate-500 font-medium">Amount Paid</span>
            <span className="font-extrabold text-slate-900">$10.00 USD (One-Time)</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2.5">
            <span className="text-slate-500 font-medium">Status</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Active & Unlocked
            </span>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-left">
            {errorMsg}
          </p>
        )}

        {/* Actions */}
        <div className="pt-2 space-y-2.5">
          {isPublished ? (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Your opening is now Live & Published!
            </div>
          ) : resultInfo?.jobId ? (
            <button
              type="button"
              onClick={handlePublishNow}
              disabled={publishing || confirming}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {publishing ? 'Publishing Live...' : 'Publish Opening Live Now →'}
            </button>
          ) : null}

          {resultInfo?.jobId ? (
            <Link
              href={`/company/jobs/${resultInfo.jobId}`}
              className="block w-full py-3 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-md shadow-blue-500/20 transition text-center"
            >
              Manage Job Posting →
            </Link>
          ) : (
            <Link
              href="/company/jobs"
              className="block w-full py-3 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-md shadow-blue-500/20 transition text-center"
            >
              Go to Job Postings & Publish →
            </Link>
          )}

          <Link
            href="/company"
            className="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-2xl transition text-center"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
