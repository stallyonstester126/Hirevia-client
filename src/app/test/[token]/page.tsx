'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '../../../lib/api-client'
import { IPublicTestContext } from '../../../types'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function PublicCandidateTestPage() {
  const urlParams = useParams()
  const token = (urlParams?.token as string) || ''

  const [testContext, setTestContext] = useState<IPublicTestContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isExpiredOrInvalid, setIsExpiredOrInvalid] = useState(false)

  // Assessment responses (placeholder questions)
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [q3, setQ3] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchTestContext = async () => {
      if (!token) {
        setLoading(false)
        setIsExpiredOrInvalid(true)
        setErrorMsg('Invalid or missing assessment token.')
        return
      }

      setLoading(true)
      setErrorMsg('')
      try {
        const res = await apiClient.get<IPublicTestContext>(`/test/${token}`)
        if (isMounted) {
          if (res.success && res.data) {
            setTestContext(res.data)
          } else {
            setIsExpiredOrInvalid(true)
            setErrorMsg(res.message || 'This assessment link is invalid or has expired.')
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setIsExpiredOrInvalid(true)
          setErrorMsg(err.message || 'This assessment link is invalid or has expired.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTestContext()

    return () => {
      isMounted = false
    }
  }, [token])

  const handleStartTest = async () => {
    setActionLoading(true)
    setErrorMsg('')
    try {
      const res = await apiClient.post<{ status: 'STARTED'; startedAt: string }>(`/test/${token}/start`)
      if (res.success && res.data) {
        setTestContext((prev) => (prev ? { ...prev, status: 'STARTED' } : null))
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start assessment.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setErrorMsg('')
    try {
      const responses = [
        {
          question: '1. Technical Architecture & Design Approach: Describe a challenging technical problem you solved recently. How did you architect the solution and what tradeoffs did you evaluate?',
          answer: q1,
        },
        {
          question: '2. Quality, Testing & Reliability: What methodologies or practices do you apply to ensure code quality, reliability, and regression prevention in high-throughput environments?',
          answer: q2,
        },
        {
          question: `3. Motivation for this Role at ${testContext?.companyName || 'the company'}: What excites you most about joining and contributing to this position?`,
          answer: q3,
        },
      ]
      const res = await apiClient.post<{ status: 'COMPLETED'; completedAt: string }>(`/test/${token}/complete`, {
        responses,
      })
      if (res.success && res.data) {
        setTestContext((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null))
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit assessment responses.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-sm font-semibold text-slate-500">Loading your assessment...</p>
        </div>
      </div>
    )
  }

  if (isExpiredOrInvalid || !testContext) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-900">Assessment Link Unavailable</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              {errorMsg || 'This assessment link is invalid, completed, or has exceeded its expiration deadline.'}
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition shadow-sm"
            >
              Return to Hirevia Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Hire<span className="text-[#146BFF]">via</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#146BFF] text-xs font-bold border border-blue-200">
              Candidate Assessment
            </span>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Expires: {new Date(testContext.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-800 flex items-center gap-3">
            <span className="text-red-600 font-bold">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* State 1: PENDING (Welcome Screen) */}
        {testContext.status === 'PENDING' && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xl space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#146BFF] rounded-full text-xs font-bold">
                <span>🎉</span> Shortlisted Candidate
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Hello {testContext.candidateFirstName}! 👋
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                You have been invited by <strong className="text-slate-900">{testContext.companyName}</strong> to complete an initial technical evaluation for the position of <strong className="text-[#146BFF]">{testContext.jobTitle}</strong>.
              </p>
            </div>

            {/* Assessment Details Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Position</span>
                <p className="font-bold text-slate-900">{testContext.jobTitle}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Employer</span>
                <p className="font-bold text-slate-900">{testContext.companyName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Estimated Time</span>
                <p className="font-bold text-slate-900">10 – 15 mins</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Before you begin:</h2>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#146BFF] font-bold">✓</span>
                  <span>Answer questions thoroughly based on your real-world experience and problem-solving approaches.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#146BFF] font-bold">✓</span>
                  <span>Once started, ensure you submit your responses before the deadline.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#146BFF] font-bold">✓</span>
                  <span>Your responses will be securely reviewed by the hiring team at {testContext.companyName}.</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-400">
                Clicking Start will initialize your assessment session.
              </p>
              <button
                type="button"
                onClick={handleStartTest}
                disabled={actionLoading}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Initializing Session...' : 'Start Assessment →'}
              </button>
            </div>
          </div>
        )}

        {/* State 2: STARTED (Assessment Form Screen) */}
        {testContext.status === 'STARTED' && (
          <form onSubmit={handleSubmitTest} className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xl space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-bold text-[#146BFF] uppercase tracking-wider">Assessment In Progress</span>
                <h1 className="text-2xl font-black text-slate-900">{testContext.jobTitle}</h1>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                Session Active
              </span>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              
              {/* Question 1 */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                  1. Technical Architecture & Design Approach
                </label>
                <p className="text-xs text-slate-500">
                  Describe a challenging technical problem you solved recently. How did you architect the solution and what tradeoffs did you evaluate?
                </p>
                <textarea
                  rows={4}
                  value={q1}
                  onChange={(e) => setQ1(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full p-4 rounded-2xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#146BFF] transition resize-y"
                  required
                />
              </div>

              {/* Question 2 */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                  2. Quality, Testing & Reliability
                </label>
                <p className="text-xs text-slate-500">
                  What methodologies or practices do you apply to ensure code quality, reliability, and regression prevention in high-throughput environments?
                </p>
                <textarea
                  rows={4}
                  value={q2}
                  onChange={(e) => setQ2(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full p-4 rounded-2xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#146BFF] transition resize-y"
                  required
                />
              </div>

              {/* Question 3 */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                  3. Motivation for this Role at {testContext.companyName}
                </label>
                <p className="text-xs text-slate-500">
                  What excites you most about joining {testContext.companyName} and contributing to this position?
                </p>
                <textarea
                  rows={3}
                  value={q3}
                  onChange={(e) => setQ3(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full p-4 rounded-2xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#146BFF] transition resize-y"
                  required
                />
              </div>

            </div>

            {/* Submission CTA */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-400">
                Make sure your answers are complete before clicking submit.
              </p>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Submitting Responses...' : 'Submit Assessment →'}
              </button>
            </div>
          </form>
        )}

        {/* State 3: COMPLETED (Confirmation Screen) */}
        {testContext.status === 'COMPLETED' && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xl text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-4xl shadow-inner">
              ✓
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                Responses Submitted
              </span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Thank You, {testContext.candidateFirstName}! 🎉
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
                Your assessment responses for <strong className="text-slate-900">{testContext.jobTitle}</strong> have been securely submitted to <strong className="text-slate-900">{testContext.companyName}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 max-w-lg mx-auto text-xs text-slate-500">
              The hiring team will review your submission and reach out regarding subsequent steps.
            </div>

            <div className="pt-6 border-t border-slate-100">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
              >
                Return to Hirevia Homepage
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
