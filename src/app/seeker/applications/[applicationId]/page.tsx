'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient, ApiError } from '../../../../lib/api-client'
import { IApplication, EApplicationStatus } from '../../../../types'
import StatusBadge from '../../../../components/StatusBadge'
import LoadingSpinner from '../../../../components/LoadingSpinner'

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.applicationId as string

  const [application, setApplication] = useState<IApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (applicationId) {
      fetchApplication()
    }
  }, [applicationId])

  const fetchApplication = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await apiClient.get<IApplication>(`/seeker/applications/${applicationId}`)
      if (res.success && res.data) {
        setApplication(res.data)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Application not found.')
    } finally {
      setLoading(false)
    }
  }

  const isWithdrawable = (status?: EApplicationStatus) => {
    if (!status) return false
    const unwithdrawable = [
      EApplicationStatus.HIRED,
      EApplicationStatus.REJECTED,
      EApplicationStatus.WITHDRAWN,
    ]
    return !unwithdrawable.includes(status)
  }

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return
    }

    setIsWithdrawing(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await apiClient.patch<IApplication>(`/seeker/applications/${applicationId}/withdraw`)
      if (res.success) {
        setSuccessMsg('Application has been withdrawn successfully.')
        await fetchApplication()
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg('Failed to withdraw application.')
      }
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleDownloadResume = async (resumeId: string, filename: string) => {
    try {
      await apiClient.download(`/seeker/resumes/${resumeId}/file`, filename)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download resume.')
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Application Not Found</h2>
        <p className="text-sm text-slate-500">{errorMsg || 'The requested application could not be found.'}</p>
        <Link
          href="/seeker/applications"
          className="inline-flex items-center px-4 py-2 bg-[#146BFF] text-white text-sm font-semibold rounded-xl"
        >
          ← Back to Applications
        </Link>
      </div>
    )
  }

  const job = typeof application.jobId === 'object' ? application.jobId : null
  const resume = typeof application.resumeId === 'object' ? application.resumeId : null
  const companyName = typeof job?.companyId === 'object' && job.companyId?.name
    ? job.companyId.name
    : 'Hiring Company'

  const canWithdraw = isWithdrawable(application.status)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/seeker/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#146BFF] transition"
        >
          ← Back to My Applications
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

      {/* Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#146BFF] uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                {companyName}
              </span>
              <StatusBadge status={application.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {job?.title || 'Application Submission'}
            </h1>

            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>Applied on {new Date(application.appliedAt || application.createdAt || '').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span>•</span>
              <span className="font-mono text-slate-400">ID: {application._id}</span>
            </p>
          </div>

          {/* Action */}
          {canWithdraw && (
            <div className="shrink-0">
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                {isWithdrawing ? 'Withdrawing Application...' : 'Withdraw Application'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Application Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attached Resume */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900">Submitted Resume</h2>
          {resume ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#146BFF] flex items-center justify-center font-bold text-xs">
                  v{resume.version || 1}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 break-all">{resume.originalFileName || 'Resume'}</p>
                  <p className="text-[11px] text-slate-400">Uploaded {resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : 'Recently'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadResume(resume._id, resume.originalFileName || 'Resume.pdf')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Download
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Resume record details unavailable.</p>
          )}
        </div>

        {/* Job Overview */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900">Job Overview</h2>
          {job ? (
            <div className="space-y-2 text-xs text-slate-600">
              <p><strong className="text-slate-900 font-semibold">Location:</strong> {job.location?.city ? `${job.location.city}, ${job.location.country}` : 'Remote'}</p>
              <p><strong className="text-slate-900 font-semibold">Workplace:</strong> {job.workplaceType}</p>
              <p><strong className="text-slate-900 font-semibold">Employment:</strong> {job.employmentType?.replace('_', ' ')}</p>
              <div className="pt-2">
                <Link
                  href={`/seeker/jobs/${job._id}`}
                  className="text-xs font-semibold text-[#146BFF] hover:underline"
                >
                  View Full Job Posting →
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Job posting details unavailable.</p>
          )}
        </div>
      </div>

      {/* Cover Letter */}
      {application.coverLetter && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900">Submitted Cover Letter</h2>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {application.coverLetter}
          </div>
        </div>
      )}
    </div>
  )
}
