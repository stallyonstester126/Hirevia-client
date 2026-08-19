'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { apiClient, ApiError } from '../../../lib/api-client'
import { IApplication, IApplicationsResponse, EApplicationStatus } from '../../../types'
import StatusBadge from '../../../components/StatusBadge'
import Pagination from '../../../components/Pagination'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ConfirmationModal from '../../../components/ConfirmationModal'

export default function SeekerApplicationsPage() {
  const [applications, setApplications] = useState<IApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)

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

  const fetchApplications = useCallback(async (targetPage = 1) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await apiClient.get<IApplicationsResponse>('/seeker/applications', {
        params: { page: targetPage, limit: 10 },
      })
      if (res.success && res.data) {
        setApplications(res.data.applications || [])
        if (res.data.pagination) {
          setPagination(res.data.pagination)
          setPage(res.data.pagination.page)
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch your applications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplications(1)
  }, [fetchApplications])

  const isWithdrawable = (status: EApplicationStatus) => {
    const unwithdrawable = [
      EApplicationStatus.HIRED,
      EApplicationStatus.REJECTED,
      EApplicationStatus.WITHDRAWN,
    ]
    return !unwithdrawable.includes(status)
  }

  const handleWithdraw = (applicationId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Withdraw Application?',
      message: 'Are you sure you want to withdraw this job application? This action cannot be undone and you will not be considered further.',
      confirmText: 'Withdraw Application',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
        setWithdrawingId(applicationId)
        setErrorMsg('')
        setSuccessMsg('')

        try {
          const res = await apiClient.patch<IApplication>(`/seeker/applications/${applicationId}/withdraw`)
          if (res.success) {
            setSuccessMsg('Application withdrawn successfully.')
            await fetchApplications(page)
          }
        } catch (err: any) {
          if (err instanceof ApiError) {
            setErrorMsg(err.message)
          } else {
            setErrorMsg('Failed to withdraw application.')
          }
        } finally {
          setWithdrawingId(null)
        }
      },
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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

      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Application Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track real-time candidate review statuses, interview stages, and feedback.
          </p>
        </div>
        <Link
          href="/seeker/jobs"
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#146BFF] text-xs font-semibold rounded-xl border border-blue-200 transition"
        >
          Explore More Jobs →
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

      {/* Applications Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : applications.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">No applications submitted yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Browse available openings in the job marketplace and start submitting your profile.
            </p>
            <div className="pt-2">
              <Link
                href="/seeker/jobs"
                className="px-5 py-2.5 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs font-semibold rounded-xl inline-block"
              >
                Find Jobs
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => {
              const job = typeof app.jobId === 'object' ? app.jobId : null
              const jobTitle = job?.title || 'Position'
              const companyName = typeof job?.companyId === 'object' && job?.companyId?.name
                ? job.companyId.name
                : 'Company'

              const canWithdraw = isWithdrawable(app.status)

              return (
                <div
                  key={app._id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/seeker/applications/${app._id}`}>
                        <h3 className="text-base font-bold text-slate-900 hover:text-[#146BFF] transition">
                          {jobTitle}
                        </h3>
                      </Link>
                      <StatusBadge status={app.status} />
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{companyName}</span>
                      <span>•</span>
                      <span>Applied {new Date(app.appliedAt || app.createdAt || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <Link
                      href={`/seeker/applications/${app._id}`}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                    >
                      View Details
                    </Link>

                    {canWithdraw && (
                      <button
                        type="button"
                        onClick={() => handleWithdraw(app._id)}
                        disabled={withdrawingId === app._id}
                        className="px-3 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
                      >
                        {withdrawingId === app._id ? 'Withdrawing...' : 'Withdraw'}
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
            onPageChange={(newPage) => fetchApplications(newPage)}
          />
        </div>
      </div>
    </div>
  )
}
