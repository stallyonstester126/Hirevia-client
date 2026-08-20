'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient, ApiError } from '../../../../lib/api-client'
import { useAuth } from '../../../../context/AuthContext'
import { IJob, IResume, EJobStatus, EWorkplaceType, EUserRoles } from '../../../../types'
import LoadingSpinner from '../../../../components/LoadingSpinner'

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const jobId = params.jobId as string

  const [job, setJob] = useState<IJob | null>(null)
  const [resumes, setResumes] = useState<IResume[]>([])
  const [loading, setLoading] = useState(true)

  // Apply Modal State
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('')
  const [applyErrorMsg, setApplyErrorMsg] = useState('')
  const [applySuccessMsg, setApplySuccessMsg] = useState('')
  const [hasAppliedAlready, setHasAppliedAlready] = useState(false)
  const [existingApplication, setExistingApplication] = useState<{
    _id: string
    status: string
    appliedAt?: string
  } | null>(null)
  const [isCheckingApplied, setIsCheckingApplied] = useState(false)

  useEffect(() => {
    if (jobId) {
      fetchJobDetails()
      if (isAuthenticated && user?.role === EUserRoles.SEEKER) {
        fetchResumes()
        checkApplicationStatus()
      }
    }
  }, [jobId, isAuthenticated, user])

  const checkApplicationStatus = async () => {
    setIsCheckingApplied(true)
    try {
      const res = await apiClient.get<{ hasApplied: boolean; application?: any }>(`/jobs/${jobId}/application-status`)
      if (res.success && res.data) {
        if (res.data.hasApplied) {
          setHasAppliedAlready(true)
          if (res.data.application) {
            setExistingApplication(res.data.application)
          }
        }
      }
    } catch {
      // Fallback: check seeker applications list
      try {
        const appsRes = await apiClient.get<any>('/seeker/applications', { params: { limit: 100 } })
        if (appsRes.success && appsRes.data?.applications) {
          const matchingApp = appsRes.data.applications.find((app: any) => {
            const jId = typeof app.jobId === 'object' ? app.jobId?._id : app.jobId
            return jId === jobId
          })
          if (matchingApp) {
            setHasAppliedAlready(true)
            setExistingApplication({
              _id: matchingApp._id,
              status: matchingApp.status,
              appliedAt: matchingApp.appliedAt || matchingApp.createdAt,
            })
          }
        }
      } catch {
        // Fallback ignored
      }
    } finally {
      setIsCheckingApplied(false)
    }
  }

  const fetchJobDetails = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await apiClient.get<IJob>(`/jobs/${jobId}`)
      if (res.success && res.data) {
        setJob(res.data)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Job posting not found or no longer available.')
    } finally {
      setLoading(false)
    }
  }

  const fetchResumes = async () => {
    try {
      const res = await apiClient.get<IResume[]>('/seeker/resumes')
      if (res.success && res.data) {
        setResumes(res.data)
        const active = res.data.find((r) => r.isActive) || res.data[0]
        if (active) {
          setSelectedResumeId(active._id)
        }
      }
    } catch {
      // Ignored if resumes fail to fetch
    }
  }

  const handleOpenApplyModal = () => {
    if (!isAuthenticated || !user) {
      router.push(`/login?redirect=/seeker/jobs/${jobId}`)
      return
    }
    setApplyErrorMsg('')
    setApplySuccessMsg('')
    setApplyModalOpen(true)
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResumeId) {
      setApplyErrorMsg('Please select a resume version to submit.')
      return
    }

    setIsApplying(true)
    setApplyErrorMsg('')
    setApplySuccessMsg('')

    try {
      const res = await apiClient.post<any>(`/jobs/${jobId}/apply`, {
        resumeId: selectedResumeId,
        coverLetter: coverLetter.trim() || undefined,
      })

      if (res.success) {
        setApplySuccessMsg('Application submitted successfully!')
        setHasAppliedAlready(true)
        if (res.data?._id) {
          setExistingApplication(res.data)
        }
        setTimeout(() => {
          setApplyModalOpen(false)
          router.push('/seeker/applications')
        }, 2000)
      }
    } catch (err: any) {
      if (err instanceof ApiError && (err.statusCode === 409 || err.message?.includes('already applied'))) {
        setHasAppliedAlready(true)
        setApplyErrorMsg("You have already applied for this job. Check 'My Applications' to track your status.")
      } else {
        setApplyErrorMsg(err.message || 'Failed to submit application.')
      }
    } finally {
      setIsApplying(false)
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
        <p className="text-sm text-slate-500">{errorMsg || 'The requested job posting does not exist or has been unpublished.'}</p>
        <Link
          href="/seeker/jobs"
          className="inline-flex items-center px-4 py-2 bg-[#146BFF] text-white text-sm font-semibold rounded-xl"
        >
          ← Back to All Jobs
        </Link>
      </div>
    )
  }

  const companyName = typeof job.companyId === 'object' && job.companyId?.name
    ? job.companyId.name
    : 'Featured Company'

  const formattedSalary = job.salary
    ? `${job.salary.currency || 'USD'} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} / ${job.salary.period?.toLowerCase() || 'month'}`
    : 'Competitive Salary'

  const isPublished = job.status === EJobStatus.PUBLISHED

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/seeker/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#146BFF] transition"
        >
          ← Back to Job Search
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#146BFF] uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                {companyName}
              </span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                {job.workplaceType}
              </span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                {job.employmentType?.replace('_', ' ')}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {job.title}
            </h1>

            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {job.location?.city ? `${job.location.city}, ${job.location.country}` : 'Remote'}
              <span className="mx-1">•</span>
              <span>Posted {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </p>
          </div>

          {/* Apply Button / Already Applied State */}
          <div className="shrink-0 flex flex-col items-start sm:items-end gap-2">
            {hasAppliedAlready ? (
              <div className="flex flex-col sm:items-end gap-1.5 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-xs">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Already Applied</span>
                  </div>
                  <Link
                    href={existingApplication?._id ? `/seeker/applications/${existingApplication._id}` : '/seeker/applications'}
                    className="px-4 py-2.5 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition shadow-blue-500/20 flex items-center gap-1"
                  >
                    Track Status →
                  </Link>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  Application submitted {existingApplication?.appliedAt ? `on ${new Date(existingApplication.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'to this opening'}
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleOpenApplyModal}
                  disabled={!isPublished || isCheckingApplied}
                  className={`px-6 py-3 text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer ${
                    isPublished
                      ? 'bg-[#146BFF] hover:bg-[#0E5CE8] text-white shadow-blue-500/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isPublished ? (
                    <>
                      Apply Now
                      <span>→</span>
                    </>
                  ) : (
                    'Applications Closed'
                  )}
                </button>
                {!isPublished && (
                  <span className="text-xs text-rose-500">This role is no longer accepting new applicants.</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Experience Level</span>
            <span className="text-sm font-bold text-slate-800">{job.experienceLevel}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Workplace</span>
            <span className="text-sm font-bold text-slate-800">{job.workplaceType}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Employment</span>
            <span className="text-sm font-bold text-slate-800">{job.employmentType?.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Compensation</span>
            <span className="text-sm font-bold text-slate-800">{formattedSalary}</span>
          </div>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About the role */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Job Description</h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h2 className="text-lg font-bold text-slate-900">Key Responsibilities</h2>
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
              <h2 className="text-lg font-bold text-slate-900">Requirements & Qualifications</h2>
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

        {/* Right 1 Col: Skills & Company Sidebar */}
        <div className="space-y-6">
          {/* Required Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900">Required Skills</h3>
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

          {/* Apply / Status CTA Card */}
          {hasAppliedAlready ? (
            <div className="bg-emerald-50/70 p-6 rounded-3xl border border-emerald-200/80 space-y-3.5 text-center animate-fadeIn shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-emerald-950">Application Submitted ✓</h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  You have already applied for this opening. You can monitor your application review and interview status anytime.
                </p>
              </div>
              <Link
                href={existingApplication?._id ? `/seeker/applications/${existingApplication._id}` : '/seeker/applications'}
                className="inline-flex items-center justify-center w-full py-3 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-semibold rounded-xl shadow-md transition shadow-blue-500/20"
              >
                Track in My Applications →
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 space-y-3 text-center">
              <h3 className="text-base font-bold text-slate-900">Interested in this role?</h3>
              <p className="text-xs text-slate-600">
                Submit your resume directly to the hiring team with one click.
              </p>
              <button
                type="button"
                onClick={handleOpenApplyModal}
                disabled={!isPublished || isCheckingApplied}
                className="w-full py-3 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-60 cursor-pointer"
              >
                {isPublished ? 'Apply Now →' : 'Applications Closed'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= APPLY MODAL ================= */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Apply to {job.title}</h3>
                <p className="text-xs text-slate-500">{companyName}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {applySuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-center gap-2 animate-fadeIn">
                <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{applySuccessMsg}</span>
              </div>
            )}

            {applyErrorMsg && (
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs sm:text-sm text-red-800 flex items-center gap-2 animate-fadeIn">
                <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{applyErrorMsg}</span>
              </div>
            )}

            {resumes.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-slate-600">
                  You haven&apos;t uploaded any resumes to your profile yet.
                </p>
                <Link
                  href="/seeker/resumes"
                  className="inline-flex items-center px-4 py-2 bg-[#146BFF] text-white text-xs font-semibold rounded-xl"
                >
                  Go to Resume Upload →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                {/* Resume selection */}
                <div className="space-y-1.5">
                  <label htmlFor="resume-select" className="block text-xs font-semibold text-slate-700">
                    Select Resume Version *
                  </label>
                  <select
                    id="resume-select"
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#146BFF]"
                  >
                    {resumes.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.originalFileName} (Version {r.version}) {r.isActive ? '— Active' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Cover letter */}
                <div className="space-y-1.5">
                  <label htmlFor="cover-letter" className="block text-xs font-semibold text-slate-700">
                    Cover Letter / Note to Employer (Optional)
                  </label>
                  <textarea
                    id="cover-letter"
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Introduce yourself and explain why you're a great fit for this position..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#146BFF] resize-y"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isApplying || hasAppliedAlready}
                    className="px-5 py-2 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-60 cursor-pointer"
                  >
                    {isApplying ? 'Submitting Application...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
