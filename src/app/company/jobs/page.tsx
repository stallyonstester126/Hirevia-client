'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { apiClient, ApiError } from '../../../lib/api-client'
import { IJob, IJobsResponse, EJobStatus, ICheckoutResponse, ISubscriptionStatusResponse } from '../../../types'
import StatusBadge from '../../../components/StatusBadge'
import Pagination from '../../../components/Pagination'
import LoadingSpinner from '../../../components/LoadingSpinner'
import MembershipModal from '../../../components/MembershipModal'
import ConfirmationModal from '../../../components/ConfirmationModal'

export default function CompanyJobsPage() {
  const [jobs, setJobs] = useState<IJob[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  // Custom Confirmation Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    variant?: 'danger' | 'warning' | 'primary'
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'danger',
    onConfirm: () => {},
  })

  // Pagination
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })

  // Alerts
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchJobsAndSubscription = useCallback(async (targetPage = 1) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const [jobsRes, subRes] = await Promise.allSettled([
        apiClient.get<IJobsResponse>('/company/jobs', {
          params: { page: targetPage, limit: 10 },
        }),
        apiClient.get<ISubscriptionStatusResponse>('/company/jobs/subscription/status'),
      ])

      if (jobsRes.status === 'fulfilled' && jobsRes.value.success && jobsRes.value.data) {
        setJobs(jobsRes.value.data.jobs || [])
        if (jobsRes.value.data.pagination) {
          setPagination(jobsRes.value.data.pagination)
          setPage(jobsRes.value.data.pagination.page)
        }
      }

      if (subRes.status === 'fulfilled' && subRes.value.success && subRes.value.data) {
        setIsSubscribed(subRes.value.data.subscriptionStatus === 'PAID')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch company jobs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobsAndSubscription(1)
  }, [fetchJobsAndSubscription])

  const filteredJobs = jobs.filter((job) => {
    if (filterStatus === 'ALL') return true
    return job.status === filterStatus
  })

  // ================= SUBSCRIPTION & PUBLISH FLOW =================
  const handleInitiateSubscription = async (jobId?: string) => {
    if (jobId) setActionLoadingId(jobId)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await apiClient.post<ICheckoutResponse>('/company/jobs/subscription/checkout')
      if (res.success && res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize membership checkout.')
      if (jobId) setActionLoadingId(null)
    }
  }

  const handlePublishJob = async (jobId: string) => {
    setActionLoadingId(jobId)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await apiClient.patch<IJob>(`/company/jobs/${jobId}/publish`)
      if (res.success) {
        setSuccessMsg('Job successfully published to the live marketplace!')
        await fetchJobsAndSubscription(page)
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 400 && !isSubscribed) {
        setErrorMsg('Company membership is required to publish jobs. Click below to activate your $10 one-time membership.')
      } else {
        setErrorMsg(err.message || 'Failed to publish job.')
      }
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCloseJob = (jobId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Close Job Posting?',
      message: 'Are you sure you want to close this job? Candidates will no longer be able to submit new applications.',
      confirmText: 'Close Job',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
        setActionLoadingId(jobId)
        setErrorMsg('')
        setSuccessMsg('')
        try {
          const res = await apiClient.patch<IJob>(`/company/jobs/${jobId}/close`)
          if (res.success) {
            setSuccessMsg('Job posting closed successfully.')
            await fetchJobsAndSubscription(page)
          }
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to close job.')
        } finally {
          setActionLoadingId(null)
        }
      },
    })
  }

  const handleDeleteJob = (jobId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Draft Job?',
      message: 'Are you sure you want to delete this draft job posting? This action cannot be undone.',
      confirmText: 'Delete Job',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
        setActionLoadingId(jobId)
        setErrorMsg('')
        setSuccessMsg('')
        try {
          const res = await apiClient.delete(`/company/jobs/${jobId}`)
          if (res.success) {
            setSuccessMsg('Draft job deleted.')
            await fetchJobsAndSubscription(page)
          }
        } catch (err: any) {
          setErrorMsg(err.message || 'Only draft jobs can be deleted.')
        } finally {
          setActionLoadingId(null)
        }
      },
    })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Manage Job Postings</h1>
            {isSubscribed && (
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Unlimited Plan Active
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track active openings, review applicant pipelines, and manage publication states.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isSubscribed && (
            <button
              type="button"
              onClick={() => setShowMembershipModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              Activate Unlimited Plan ($10)
            </button>
          )}
          {isSubscribed ? (
            <Link
              href="/company/jobs/new"
              className="inline-flex items-center justify-center px-4 py-2.5 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition cursor-pointer"
            >
              + Post a New Job
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowMembershipModal(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition cursor-pointer"
            >
              + Post a New Job
            </button>
          )}
        </div>
      </div>

      {/* Membership Required Popup Modal */}
      <MembershipModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
      />

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

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
              onClick={() => handleInitiateSubscription()}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
            >
              Pay $10 Now →
            </button>
          )}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: 'All Jobs', value: 'ALL' },
          { label: 'Published (Active)', value: EJobStatus.PUBLISHED },
          { label: 'Drafts', value: EJobStatus.DRAFT },
          { label: 'Closed', value: EJobStatus.CLOSED },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterStatus === tab.value
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Jobs Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">No job postings found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your opening to attract high-caliber engineering and product candidates.
            </p>
            <div className="pt-2">
              <Link
                href="/company/jobs/new"
                className="px-5 py-2.5 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs font-semibold rounded-xl inline-block"
              >
                + Post a Job
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredJobs.map((job) => {
              const isActionLoading = actionLoadingId === job._id
              const isDraft = job.status === EJobStatus.DRAFT
              const isPublished = job.status === EJobStatus.PUBLISHED

              return (
                <div
                  key={job._id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/company/jobs/${job._id}`}>
                        <h3 className="text-base font-bold text-slate-900 hover:text-[#146BFF] transition">
                          {job.title}
                        </h3>
                      </Link>
                      <StatusBadge status={job.status} />

                      {/* Draft Readiness Pill */}
                      {isDraft && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            isSubscribed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isSubscribed ? 'Ready to Publish ✓' : 'Requires $10 Membership'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      <span>{job.workplaceType}</span>
                      <span>•</span>
                      <span>{job.employmentType?.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{job.location?.city ? `${job.location.city}, ${job.location.country}` : 'Remote'}</span>
                      <span>•</span>
                      <span>Created {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </p>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-2 flex-wrap self-start lg:self-center shrink-0">
                    {/* View Applicants */}
                    <Link
                      href={`/company/jobs/${job._id}/applicants`}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#146BFF] border border-blue-200 text-xs font-semibold rounded-xl transition"
                    >
                      Applicants
                    </Link>

                    {/* View/Manage */}
                    <Link
                      href={`/company/jobs/${job._id}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                    >
                      Details
                    </Link>

                    {/* Edit */}
                    <Link
                      href={`/company/jobs/${job._id}/edit`}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition"
                    >
                      Edit
                    </Link>

                    {/* Publish Actions (Draft) */}
                    {isDraft && isSubscribed && (
                      <button
                        type="button"
                        onClick={() => handlePublishJob(job._id)}
                        disabled={isActionLoading}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        {isActionLoading ? 'Publishing...' : 'Publish Job ✓'}
                      </button>
                    )}

                    {isDraft && !isSubscribed && (
                      <button
                        type="button"
                        onClick={() => setShowMembershipModal(true)}
                        disabled={isActionLoading}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        Publish Job →
                      </button>
                    )}

                    {/* Re-publish Action (Closed) */}
                    {job.status === EJobStatus.CLOSED && (
                      <button
                        type="button"
                        onClick={() => handlePublishJob(job._id)}
                        disabled={isActionLoading}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        {isActionLoading ? 'Re-opening...' : 'Re-publish Job'}
                      </button>
                    )}

                    {/* Close Job (for published jobs) */}
                    {isPublished && (
                      <button
                        type="button"
                        onClick={() => handleCloseJob(job._id)}
                        disabled={isActionLoading}
                        className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
                      >
                        {isActionLoading ? 'Closing...' : 'Close Job'}
                      </button>
                    )}

                    {/* Delete Job (allowed for DRAFT and CLOSED jobs) */}
                    {(isDraft || job.status === EJobStatus.CLOSED) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job._id)}
                        disabled={isActionLoading}
                        className="p-1.5 text-slate-400 hover:text-[#146BFF] hover:bg-blue-50 rounded-xl transition disabled:opacity-50 cursor-pointer"
                        aria-label="Delete job"
                        title="Delete job"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="border-t border-slate-100 p-2">
          <Pagination
            pagination={pagination}
            onPageChange={(newPage) => fetchJobsAndSubscription(newPage)}
          />
        </div>
      </div>
    </div>
  )
}
