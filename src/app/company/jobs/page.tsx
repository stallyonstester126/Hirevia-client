'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient, ApiError } from '../../../lib/api-client'
import { IJob, IJobsResponse, EJobStatus, EPaymentStatus, ICheckoutResponse } from '../../../types'
import StatusBadge from '../../../components/StatusBadge'
import Pagination from '../../../components/Pagination'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function CompanyJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<IJob[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

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

  const fetchJobs = useCallback(async (targetPage = 1) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await apiClient.get<IJobsResponse>('/company/jobs', {
        params: { page: targetPage, limit: 10 },
      })
      if (res.success && res.data) {
        setJobs(res.data.jobs || [])
        if (res.data.pagination) {
          setPagination(res.data.pagination)
          setPage(res.data.pagination.page)
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch company jobs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs(1)
  }, [fetchJobs])

  const filteredJobs = jobs.filter((job) => {
    if (filterStatus === 'ALL') return true
    return job.status === filterStatus
  })

  // ================= PUBLISH & STRIPE CHECKOUT FLOW =================
  const handleInitiatePayment = async (jobId: string) => {
    setActionLoadingId(jobId)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await apiClient.post<ICheckoutResponse>(`/company/jobs/${jobId}/checkout`)
      if (res.success && res.data?.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = res.data.checkoutUrl
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setErrorMsg('A checkout session is already pending for this job. Check payment status or retry in a moment.')
      } else {
        setErrorMsg(err.message || 'Failed to initialize payment checkout.')
      }
      setActionLoadingId(null)
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
        await fetchJobs(page)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Cannot publish unpaid or ineligible job.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCloseJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to close this job? Candidates will no longer be able to apply.')) {
      return
    }
    setActionLoadingId(jobId)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await apiClient.patch<IJob>(`/company/jobs/${jobId}/close`)
      if (res.success) {
        setSuccessMsg('Job posting closed.')
        await fetchJobs(page)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to close job.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this draft job? This cannot be undone.')) {
      return
    }
    setActionLoadingId(jobId)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await apiClient.delete(`/company/jobs/${jobId}`)
      if (res.success) {
        setSuccessMsg('Draft job deleted.')
        await fetchJobs(page)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Only draft jobs can be deleted.')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Job Postings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track active openings, review applicant pipelines, and manage publication states.
          </p>
        </div>
        <Link
          href="/company/jobs/new"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition cursor-pointer"
        >
          + Post a New Job
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
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-800 flex items-center gap-2.5 animate-fadeIn">
          <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMsg}</span>
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
              Create your first opening to attract high-caliber engineering and product candidates.
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
              const isPaid = job.paymentStatus === EPaymentStatus.PAID

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

                      {/* Payment Status Pill */}
                      {isDraft && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isPaid ? 'Fee Paid ✓' : 'Posting Fee Unpaid ($10)'}
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

                    {/* Edit (allowed for draft and published) */}
                    {job.status !== EJobStatus.CLOSED && (
                      <Link
                        href={`/company/jobs/${job._id}/edit`}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition"
                      >
                        Edit
                      </Link>
                    )}

                    {/* Publish Flow Actions */}
                    {isDraft && !isPaid && (
                      <button
                        type="button"
                        onClick={() => handleInitiatePayment(job._id)}
                        disabled={isActionLoading}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        {isActionLoading ? 'Processing...' : 'Pay Fee ($10) →'}
                      </button>
                    )}

                    {isDraft && isPaid && (
                      <button
                        type="button"
                        onClick={() => handlePublishJob(job._id)}
                        disabled={isActionLoading}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        {isActionLoading ? 'Publishing...' : 'Publish Job ✓'}
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

                    {/* Delete Job (strictly allowed only for DRAFT jobs per backend rule) */}
                    {isDraft && (
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job._id)}
                        disabled={isActionLoading}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-50 cursor-pointer"
                        aria-label="Delete draft job"
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
            onPageChange={(newPage) => fetchJobs(newPage)}
          />
        </div>
      </div>
    </div>
  )
}
