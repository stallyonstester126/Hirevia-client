'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient, ApiError } from '../../../../lib/api-client'
import { IJob, EJobStatus, EPaymentStatus, ICheckoutResponse, ISubscriptionStatusResponse } from '../../../../types'
import StatusBadge from '../../../../components/StatusBadge'
import LoadingSpinner from '../../../../components/LoadingSpinner'

export default function CompanyJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const [job, setJob] = useState<IJob | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Alerts
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (jobId) {
      fetchJobAndSubscription()
    }
  }, [jobId])

  const fetchJobAndSubscription = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const [jobRes, subRes] = await Promise.all([
        apiClient.get<IJob>(`/company/jobs/${jobId}`),
        apiClient.get<ISubscriptionStatusResponse>('/company/jobs/subscription/status').catch(() => null),
      ])

      if (jobRes.success && jobRes.data) {
        setJob(jobRes.data)
      }
      if (subRes?.success && subRes.data) {
        setIsSubscribed(subRes.data.subscriptionStatus === 'PAID')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load job details.')
    } finally {
      setLoading(false)
    }
  }

  const handleInitiateSubscription = async () => {
    setActionLoading(true)
    setErrorMsg('')
    try {
      const res = await apiClient.post<ICheckoutResponse>('/company/jobs/subscription/checkout')
      if (res.success && res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start membership checkout.')
      setActionLoading(false)
    }
  }

  const handlePublishJob = async () => {
    setActionLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await apiClient.patch<IJob>(`/company/jobs/${jobId}/publish`)
      if (res.success && res.data) {
        setJob(res.data)
        setSuccessMsg('Job is now active and published to candidates in the marketplace!')
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 400 && !isSubscribed) {
        setErrorMsg('Company membership is required to publish jobs. Activate your $10 membership below.')
      } else {
        setErrorMsg(err.message || 'Cannot publish job.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleCloseJob = async () => {
    if (!confirm('Are you sure you want to close this job? Candidates will no longer be able to apply.')) {
      return
    }
    setActionLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await apiClient.patch<IJob>(`/company/jobs/${jobId}/close`)
      if (res.success && res.data) {
        setJob(res.data)
        setSuccessMsg('Job posting has been closed.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to close job.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteJob = async () => {
    if (!confirm('Are you sure you want to delete this draft job? This cannot be undone.')) {
      return
    }
    setActionLoading(true)
    setErrorMsg('')
    try {
      const res = await apiClient.delete(`/company/jobs/${jobId}`)
      if (res.success) {
        router.push('/company/jobs')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Only draft jobs can be deleted.')
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Job Not Found</h2>
        <p className="text-sm text-slate-500">{errorMsg || 'The requested job posting could not be found.'}</p>
        <Link
          href="/company/jobs"
          className="inline-flex items-center px-4 py-2 bg-[#146BFF] text-white text-sm font-semibold rounded-xl"
        >
          ← Back to All Postings
        </Link>
      </div>
    )
  }

  const formattedSalary = job.salary
    ? `${job.salary.currency || 'USD'} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} / ${job.salary.period?.toLowerCase() || 'year'}`
    : 'Competitive Salary'

  const isDraft = job.status === EJobStatus.DRAFT
  const isPublished = job.status === EJobStatus.PUBLISHED
  const isCanPublish = isSubscribed || job.paymentStatus === EPaymentStatus.PAID

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/company/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#146BFF] transition"
        >
          ← Back to All Postings
        </Link>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-sm text-emerald-800 flex items-center gap-2.5 animate-fadeIn">
          <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-800 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
          {!isSubscribed && (
            <button
              onClick={handleInitiateSubscription}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
            >
              Pay $10 Now →
            </button>
          )}
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={job.status} />
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                {job.workplaceType}
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                {job.employmentType?.replace('_', ' ')}
              </span>
              {isSubscribed && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                  Unlimited Plan Active ✓
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {job.title}
            </h1>

            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>{job.location?.city ? `${job.location.city}, ${job.location.country}` : 'Remote'}</span>
              <span>•</span>
              <span>Created on {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span>•</span>
              <span className="font-mono text-slate-400">ID: {job._id}</span>
            </p>
          </div>

          {/* Top CTAs */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link
              href={`/company/jobs/${job._id}/applicants`}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#146BFF] border border-blue-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              View Applicants Pipeline
            </Link>

            {job.status !== EJobStatus.CLOSED && (
              <Link
                href={`/company/jobs/${job._id}/edit`}
                className="px-3.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Edit
              </Link>
            )}

            {isDraft && (
              <button
                type="button"
                onClick={handleDeleteJob}
                disabled={actionLoading}
                className="p-2.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl transition cursor-pointer"
                aria-label="Delete draft job"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Highlights Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Experience Level</span>
            <span className="text-sm font-bold text-slate-800">{job.experienceLevel}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Workplace Model</span>
            <span className="text-sm font-bold text-slate-800">{job.workplaceType}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Employment Type</span>
            <span className="text-sm font-bold text-slate-800">{job.employmentType?.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Compensation</span>
            <span className="text-sm font-bold text-slate-800">{formattedSalary}</span>
          </div>
        </div>
      </div>

      {/* Publishing Lifecycle Box */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#146BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Publishing & Lifecycle Status
        </h2>

        {/* State A: DRAFT & UNPAID */}
        {isDraft && !isCanPublish && (
          <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Company Membership Activation Required</span>
              <p className="text-sm font-bold text-slate-900">One-Time Fee: $10.00 USD (Unlimited Job Postings)</p>
              <p className="text-xs text-slate-600">
                Unlock permanent unlimited postings for your company. Once paid, all current and future job posts can be published immediately.
              </p>
            </div>

            <button
              type="button"
              onClick={handleInitiateSubscription}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Connecting to Stripe...' : 'Activate Membership ($10) →'}
            </button>
          </div>
        )}

        {/* State B: DRAFT & CAN PUBLISH */}
        {isDraft && isCanPublish && (
          <div className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Ready to Go Live</span>
              <p className="text-sm font-bold text-slate-900">Unlimited Membership Active ✓</p>
              <p className="text-xs text-slate-600">
                Your opening is ready. Click &apos;Publish Job Live&apos; to immediately open applications for candidates.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePublishJob}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Publishing...' : 'Publish Job Live →'}
            </button>
          </div>
        )}

        {/* State C: PUBLISHED */}
        {isPublished && (
          <div className="p-5 bg-blue-50/70 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#146BFF] uppercase tracking-wider">Job is Currently Active & Live</span>
              <p className="text-sm font-bold text-slate-900">Receiving Candidate Applications</p>
              <p className="text-xs text-slate-600">
                Visible to seekers on the marketplace. You can close this position when hiring is complete.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseJob}
              disabled={actionLoading}
              className="px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold rounded-xl transition shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Closing...' : 'Close Job Posting'}
            </button>
          </div>
        )}

        {/* State D: CLOSED */}
        {job.status === EJobStatus.CLOSED && (
          <div className="p-5 bg-slate-100 rounded-2xl border border-slate-200 text-slate-600 text-xs space-y-1">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">Position Closed</span>
            <p>This job posting is archived and no longer accepts new applicants.</p>
          </div>
        )}
      </div>

      {/* Main Content: Description, Responsibilities, Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-slate-900">Job Description</h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-slate-900">Key Responsibilities</h2>
              <ul className="space-y-2 text-sm text-slate-700">
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-[#146BFF] font-bold mt-0.5">•</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-slate-900">Requirements & Qualifications</h2>
              <ul className="space-y-2 text-sm text-slate-700">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar: Skills */}
        <div>
          {job.skills && job.skills.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900">Required Skills & Stack</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold bg-blue-50 text-[#146BFF] border border-blue-200 px-2.5 py-1 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
