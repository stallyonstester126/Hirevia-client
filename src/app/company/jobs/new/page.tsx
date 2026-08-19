'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '../../../../lib/api-client'
import { IJob, ISubscriptionStatusResponse, ICheckoutResponse } from '../../../../types'
import JobForm from '../../../../components/JobForm'
import LoadingSpinner from '../../../../components/LoadingSpinner'

export default function NewJobPage() {
  const router = useRouter()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [checkingSub, setCheckingSub] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    setCheckingSub(true)
    try {
      const res = await apiClient.get<ISubscriptionStatusResponse>('/company/jobs/subscription/status')
      if (res.success && res.data) {
        setIsSubscribed(res.data.subscriptionStatus === 'PAID')
      }
    } catch {
      // Fallback
    } finally {
      setCheckingSub(false)
    }
  }

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

  const handleCreateJob = async (jobData: Partial<IJob>) => {
    setIsSubmitting(true)
    setErrorMsg('')
    try {
      const res = await apiClient.post<IJob>('/company/jobs', jobData)
      if (res.success && res.data) {
        // Redirect to newly created published job detail page
        router.push(`/company/jobs/${res.data._id}`)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish job posting.')
      setIsSubmitting(false)
    }
  }

  if (checkingSub) {
    return (
      <div className="py-24 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    )
  }

  // If company has NOT purchased the one-time $10 membership, show paywall view
  if (!isSubscribed) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href="/company/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#146BFF] transition"
          >
            ← Back to Job Postings
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              Employer Membership Required
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 pt-1">
              Unlock Unlimited Job Postings
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              To publish new positions and connect with top candidates, activate your one-time employer membership for only <span className="font-bold text-slate-900">$10</span>. No recurring monthly fees or per-job charges.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-800 flex items-center gap-2.5 text-left animate-fadeIn max-w-lg mx-auto">
              <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Membership Benefits List */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-left max-w-lg mx-auto space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">What&apos;s Included:</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-600 font-bold">✓</span> Unlimited live job postings forever
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-600 font-bold">✓</span> AI Auto-Screening & Resume scoring
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-600 font-bold">✓</span> Integrated AI Voice Interviews & Technical Assessments
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-600 font-bold">✓</span> Direct candidate applicant tracking pipeline
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSubscribe}
              disabled={isCheckingOut}
              className="w-full sm:w-auto px-8 py-3 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer disabled:opacity-60"
            >
              {isCheckingOut ? 'Opening Stripe Checkout...' : 'Activate Membership ($10 One-Time) →'}
            </button>
            <Link
              href="/company/jobs"
              className="w-full sm:w-auto px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition"
            >
              Back to Job Postings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // If company IS subscribed, show the job creation form
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <Link
          href="/company/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#146BFF] transition"
        >
          ← Back to Job Postings
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">Post a New Job Opportunity</h1>
          <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
            Unlimited Plan Active ✓
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Fill in the details below to publish your opening directly to the candidate marketplace.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-800 flex items-center gap-2.5 animate-fadeIn">
          <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      <JobForm
        onSubmit={handleCreateJob}
        onCancel={() => router.push('/company/jobs')}
        isSubmitting={isSubmitting}
        submitButtonText="Publish Job Opportunity →"
      />
    </div>
  )
}
