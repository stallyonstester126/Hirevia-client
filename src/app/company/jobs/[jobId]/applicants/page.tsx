'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '../../../../../lib/api-client'
import { IApplication, IApplicationsResponse, IJob, EApplicationStatus } from '../../../../../types'
import StatusBadge from '../../../../../components/StatusBadge'
import Pagination from '../../../../../components/Pagination'
import LoadingSpinner from '../../../../../components/LoadingSpinner'

export default function JobApplicantsPage() {
  const params = useParams()
  const jobId = params.jobId as string

  const [job, setJob] = useState<IJob | null>(null)
  const [applications, setApplications] = useState<IApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  // Pagination
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })

  const [errorMsg, setErrorMsg] = useState('')

  const fetchJobInfo = async () => {
    try {
      const res = await apiClient.get<IJob>(`/company/jobs/${jobId}`)
      if (res.success && res.data) {
        setJob(res.data)
      }
    } catch {
      // Ignored
    }
  }

  const fetchApplicants = useCallback(async (targetPage = 1, statusFilter = filterStatus) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const queryParams: Record<string, any> = {
        page: targetPage,
        limit: 10,
      }
      if (statusFilter !== 'ALL') {
        queryParams.status = statusFilter
      }

      const res = await apiClient.get<IApplicationsResponse>(`/company/jobs/${jobId}/applications`, {
        params: queryParams,
      })

      if (res.success && res.data) {
        setApplications(res.data.applications || [])
        if (res.data.pagination) {
          setPagination(res.data.pagination)
          setPage(res.data.pagination.page)
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load job applicants.')
    } finally {
      setLoading(false)
    }
  }, [jobId, filterStatus])

  useEffect(() => {
    if (jobId) {
      fetchJobInfo()
      fetchApplicants(1, filterStatus)
    }

    const handleFocus = () => {
      if (jobId) {
        fetchApplicants(1, filterStatus)
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [jobId, filterStatus, fetchApplicants])


  const handleStatusTabChange = (newStatus: string) => {
    setFilterStatus(newStatus)
    setPage(1)
    fetchApplicants(1, newStatus)
  }

  const handleDownloadResume = async (applicationId: string, filename = 'Candidate_Resume.pdf') => {
    try {
      await apiClient.download(`/company/applications/${applicationId}/resume`, filename)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download candidate resume.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/company/jobs/${jobId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#146BFF] transition"
        >
          ← Back to Job Overview ({job?.title || 'Job'})
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#146BFF]">Applicant Review Pipeline</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{job?.title || 'Job Applications'}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review candidate profiles, run AI match scoring, and advance applicants through the hiring stages.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 self-start sm:self-center">
          {pagination.total} {pagination.total === 1 ? 'Applicant' : 'Applicants'}
        </span>
      </div>

      {/* Error */}
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
          { label: 'All Applicants', value: 'ALL' },
          { label: 'Submitted', value: EApplicationStatus.SUBMITTED },
          { label: 'Under Review', value: EApplicationStatus.UNDER_REVIEW },
          { label: 'Shortlisted', value: EApplicationStatus.SHORTLISTED },
          { label: 'Interview', value: EApplicationStatus.INTERVIEW },
          { label: 'Hired', value: EApplicationStatus.HIRED },
          { label: 'Rejected', value: EApplicationStatus.REJECTED },
          { label: 'Withdrawn', value: EApplicationStatus.WITHDRAWN },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleStatusTabChange(tab.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterStatus === tab.value
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applicants List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : applications.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">No applicants in this stage</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Candidates who apply for this position will appear here for review and status updates.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => {
              const candidate = typeof app.seekerId === 'object' ? app.seekerId : null
              const candidateName = candidate?.name || 'Applicant Candidate'
              const candidateEmail = candidate?.email || ''
              const resume = typeof app.resumeId === 'object' ? app.resumeId : null

              return (
                <div
                  key={app._id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#146BFF] font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {candidateName.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/company/applications/${app._id}`}>
                          <h3 className="text-sm font-bold text-slate-900 hover:text-[#146BFF] transition">
                            {candidateName}
                          </h3>
                        </Link>
                        <StatusBadge status={app.status} />
                      </div>

                      <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                        <span>{candidateEmail}</span>
                        <span>•</span>
                        <span>Applied {new Date(app.appliedAt || app.createdAt || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {resume?.originalFileName && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">{resume.originalFileName}</span>
                          </>
                        )}
                      </p>

                      {/* Evaluation Highlights Badges */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {/* Auto-Screening / AI Match */}
                        {(app.matchScore?.score !== undefined || app.autoScreeningScore !== undefined) && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-[#146BFF] border border-blue-200">
                            <span>🎯 Match:</span>
                            <span>{app.matchScore?.score ?? app.autoScreeningScore}/100</span>
                          </span>
                        )}

                        {/* Assessment */}
                        {app.testInvite && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                            app.testInvite.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <span>📝 Assessment:</span>
                            <span>
                              {app.testInvite.assessmentScore !== null && app.testInvite.assessmentScore !== undefined
                                ? `${app.testInvite.assessmentScore}/100`
                                : app.testInvite.status}
                            </span>
                          </span>
                        )}

                        {/* Voice Interview */}
                        {app.interviewInvite && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                            app.interviewInvite.status === 'COMPLETED'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            <span>🎙️ Voice Interview:</span>
                            <span>
                              {app.interviewInvite.interviewScore !== null && app.interviewInvite.interviewScore !== undefined
                                ? `${app.interviewInvite.interviewScore}/100`
                                : app.interviewInvite.status}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownloadResume(app._id, resume?.originalFileName || 'Resume.pdf')}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Download CV
                    </button>

                    <Link
                      href={`/company/applications/${app._id}`}
                      className="px-3.5 py-1.5 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs font-semibold rounded-xl shadow-xs transition shadow-blue-500/20"
                    >
                      Review & Match AI →
                    </Link>
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
            onPageChange={(newPage) => fetchApplicants(newPage, filterStatus)}
          />
        </div>
      </div>
    </div>
  )
}
