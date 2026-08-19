'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiClient, ApiError } from '../../../../lib/api-client'
import {
  IApplication,
  ISeekerProfile,
  EApplicationStatus,
  ICompanyApplicationDetailResponse,
  ICompanyAnalysisResponse,
  IJobMatchScore,
  ICVAnalysis,
  IInterviewInvite,
} from '../../../../types'
import StatusBadge from '../../../../components/StatusBadge'
import LoadingSpinner from '../../../../components/LoadingSpinner'

export default function CompanyApplicationDetailPage() {
  const params = useParams()
  const applicationId = params.applicationId as string

  const [application, setApplication] = useState<IApplication | null>(null)
  const [seekerProfile, setSeekerProfile] = useState<ISeekerProfile | null>(null)
  const [cvAnalysis, setCvAnalysis] = useState<ICVAnalysis | null>(null)
  const [matchScore, setMatchScore] = useState<IJobMatchScore | null>(null)
  const [testInvite, setTestInvite] = useState<any | null>(null)
  const [interviewInvite, setInterviewInvite] = useState<IInterviewInvite | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)

  // Alerts
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [matchErrorMsg, setMatchErrorMsg] = useState('')

  const fetchApplicationDetails = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const [detailRes, analysisRes, testInviteRes, interviewInviteRes] = await Promise.allSettled([
        apiClient.get<ICompanyApplicationDetailResponse>(`/company/applications/${applicationId}`),
        apiClient.get<ICompanyAnalysisResponse>(`/company/applications/${applicationId}/analysis`),
        apiClient.get<any>(`/company/applications/${applicationId}/test-invite`),
        apiClient.get<IInterviewInvite>(`/company/applications/${applicationId}/interview-invite`),
      ])

      if (detailRes.status === 'fulfilled' && detailRes.value.success) {
        setApplication(detailRes.value.data.application)
        setSeekerProfile(detailRes.value.data.seekerProfile)
      } else if (detailRes.status === 'rejected') {
        throw detailRes.reason
      }

      if (analysisRes.status === 'fulfilled' && analysisRes.value.success) {
        setCvAnalysis(analysisRes.value.data.analysis || null)
        setMatchScore(analysisRes.value.data.matchScore || null)
      }

      if (testInviteRes.status === 'fulfilled' && testInviteRes.value.success) {
        setTestInvite(testInviteRes.value.data || null)
      }

      if (interviewInviteRes.status === 'fulfilled' && interviewInviteRes.value.success) {
        setInterviewInvite(interviewInviteRes.value.data || null)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load application details.')
    } finally {
      setLoading(false)
    }
  }, [applicationId])


  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetails()
    }
  }, [applicationId, fetchApplicationDetails])

  // Auto-refresh on window focus and polling if auto-screening is in progress
  useEffect(() => {
    const handleFocus = () => {
      fetchApplicationDetails()
    }
    window.addEventListener('focus', handleFocus)

    let intervalId: NodeJS.Timeout | null = null
    if (application?.autoScreeningStatus === 'PENDING' || application?.autoScreeningStatus === 'PROCESSING') {
      intervalId = setInterval(() => {
        fetchApplicationDetails()
      }, 2500)
    }

    return () => {
      window.removeEventListener('focus', handleFocus)
      if (intervalId) clearInterval(intervalId)
    }
  }, [application?.autoScreeningStatus, fetchApplicationDetails])


  // ================= STATUS MACHINE HELPERS =================
  const getNextAllowedStatuses = (currentStatus?: EApplicationStatus): EApplicationStatus[] => {
    if (!currentStatus) return []
    const transitionMap: Record<EApplicationStatus, EApplicationStatus[]> = {
      [EApplicationStatus.SUBMITTED]: [EApplicationStatus.UNDER_REVIEW, EApplicationStatus.REJECTED],
      [EApplicationStatus.UNDER_REVIEW]: [EApplicationStatus.SHORTLISTED, EApplicationStatus.REJECTED],
      [EApplicationStatus.SHORTLISTED]: [EApplicationStatus.INTERVIEW, EApplicationStatus.REJECTED],
      [EApplicationStatus.INTERVIEW]: [EApplicationStatus.HIRED, EApplicationStatus.REJECTED],
      [EApplicationStatus.HIRED]: [],
      [EApplicationStatus.REJECTED]: [],
      [EApplicationStatus.WITHDRAWN]: [],
    }
    return transitionMap[currentStatus] || []
  }

  const handleUpdateStatus = async (newStatus: EApplicationStatus) => {
    setStatusUpdating(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await apiClient.patch<IApplication>(`/company/applications/${applicationId}/status`, {
        status: newStatus,
      })
      if (res.success && res.data) {
        setApplication(res.data)
        setSuccessMsg(`Candidate application moved to ${newStatus.replace('_', ' ')} stage.`)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update candidate status.')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleDownloadResume = async () => {
    try {
      const resume = typeof application?.resumeId === 'object' ? application.resumeId : null
      const filename = resume?.originalFileName || 'Candidate_Resume.pdf'
      await apiClient.download(`/company/applications/${applicationId}/resume`, filename)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download resume.')
    }
  }

  const handleCalculateMatch = async () => {
    setMatchLoading(true)
    setMatchErrorMsg('')
    try {
      const res = await apiClient.post<IJobMatchScore>(`/company/applications/${applicationId}/analysis/match`)
      if (res.success && res.data) {
        setMatchScore(res.data)
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 503) {
        setMatchErrorMsg('AI matching service is currently busy or unavailable. Please try again in a few moments.')
      } else {
        setMatchErrorMsg(err.message || 'Failed to calculate AI job match score.')
      }
    } finally {
      setMatchLoading(false)
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
        <p className="text-sm text-slate-500">{errorMsg || 'The requested candidate application could not be found.'}</p>
        <Link
          href="/company/jobs"
          className="inline-flex items-center px-4 py-2 bg-[#146BFF] text-white text-sm font-semibold rounded-xl"
        >
          ← Back to Job Postings
        </Link>
      </div>
    )
  }

  const candidate = typeof application.seekerId === 'object' ? application.seekerId : null
  const candidateName = candidate?.name || 'Applicant Candidate'
  const candidateEmail = candidate?.email || ''
  const resume = typeof application.resumeId === 'object' ? application.resumeId : null
  const job = typeof application.jobId === 'object' ? application.jobId : null
  const jobId = typeof application.jobId === 'object' ? application.jobId._id : application.jobId

  const allowedNextStatuses = getNextAllowedStatuses(application.status)
  const isTerminalStatus = allowedNextStatuses.length === 0

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/company/jobs/${jobId}/applicants`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#146BFF] transition"
        >
          ← Back to Pipeline ({job?.title || 'Job Opening'})
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

      {/* Header & Status Transition Controls Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#146BFF] font-extrabold text-xl flex items-center justify-center shrink-0">
              {candidateName.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{candidateName}</h1>
                <StatusBadge status={application.status} />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                <span>{candidateEmail}</span>
                <span>•</span>
                <span>Applied for <strong className="text-slate-800">{job?.title}</strong></span>
                <span>•</span>
                <span>{new Date(application.appliedAt || application.createdAt || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </p>
            </div>
          </div>

          {/* Status Progression Gated Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Advance Candidate:
            </span>

            {isTerminalStatus ? (
              <span className="text-xs font-semibold text-slate-400 italic px-2">
                {application.status === EApplicationStatus.WITHDRAWN
                  ? 'Withdrawn by candidate'
                  : 'Stage is final (no further transitions)'}
              </span>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {allowedNextStatuses.map((nextStatus) => {
                  const isReject = nextStatus === EApplicationStatus.REJECTED
                  const isHire = nextStatus === EApplicationStatus.HIRED

                  return (
                    <button
                      key={nextStatus}
                      type="button"
                      onClick={() => handleUpdateStatus(nextStatus)}
                      disabled={statusUpdating}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 ${
                        isReject
                          ? 'border border-rose-200 text-rose-700 bg-white hover:bg-rose-50'
                          : isHire
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-[#146BFF] hover:bg-[#0E5CE8] text-white shadow-xs'
                      }`}
                    >
                      {statusUpdating
                        ? 'Updating...'
                        : isReject
                        ? 'Reject Candidate'
                        : isHire
                        ? 'Hire Candidate 🎉'
                        : `Move to ${nextStatus.replace('_', ' ')} →`}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Candidate Profile & Cover Letter (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Submitted Resume Attachment */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-slate-900">Submitted Resume Document</h2>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#146BFF] flex items-center justify-center font-bold text-xs">
                  v{resume?.version || 1}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 break-all">{resume?.originalFileName || 'Resume Document'}</p>
                  <p className="text-[11px] text-slate-400">Attached at submission time</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadResume}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                Download Resume File
              </button>
            </div>
          </div>

          {/* Candidate Profile Details (if filled) */}
          {seekerProfile ? (
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-slate-900">Candidate Background</h2>

              {seekerProfile.headline && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Headline</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{seekerProfile.headline}</p>
                </div>
              )}

              {seekerProfile.location && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Location</span>
                  <p className="text-sm text-slate-700 mt-0.5">{seekerProfile.location}</p>
                </div>
              )}

              {seekerProfile.bio && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Bio</span>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5 whitespace-pre-line">{seekerProfile.bio}</p>
                </div>
              )}

              {/* Skills */}
              {seekerProfile.skills && seekerProfile.skills.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Claimed Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {seekerProfile.skills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience Timeline */}
              {seekerProfile.experience && seekerProfile.experience.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Work Experience</span>
                  <div className="space-y-3">
                    {seekerProfile.experience.map((exp, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                        <p className="text-xs font-bold text-slate-900">{exp.position} • <span className="text-[#146BFF]">{exp.company}</span></p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(exp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} —{' '}
                          {exp.endDate ? new Date(exp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Present'}
                        </p>
                        {exp.description && (
                          <p className="text-xs text-slate-600 pt-1 leading-relaxed whitespace-pre-line">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {seekerProfile.education && seekerProfile.education.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Education</span>
                  <div className="space-y-2">
                    {seekerProfile.education.map((edu, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                        <p className="font-bold text-slate-900">{edu.degree}</p>
                        <p className="text-slate-500">{edu.institution} ({new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'})</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs text-xs text-slate-500 italic">
              Candidate has not populated an extended profile beyond their resume document.
            </div>
          )}

          {/* Cover Letter */}
          {application.coverLetter && (
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-slate-900">Submitted Cover Letter / Note</h2>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {application.coverLetter}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI CV Analysis & Match Score (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Card 0: Automated AI Screening & Assessment Status */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#146BFF]"></span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Auto-Screening & Test</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                application.autoScreeningStatus === 'COMPLETE'
                  ? application.autoScreeningScore !== null && application.autoScreeningScore !== undefined && application.autoScreeningScore >= 70
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                  : application.autoScreeningStatus === 'PROCESSING' || application.autoScreeningStatus === 'PENDING'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {application.autoScreeningStatus === 'COMPLETE'
                  ? application.autoScreeningScore !== null && application.autoScreeningScore !== undefined && application.autoScreeningScore >= 70
                    ? 'Shortlisted by AI'
                    : 'Manual Review'
                  : application.autoScreeningStatus || 'PENDING'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {application.autoScreeningScore !== null && application.autoScreeningScore !== undefined && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-500 font-medium">Initial AI Match Score:</span>
                  <span className="font-bold text-slate-900 text-sm">{application.autoScreeningScore} / 100</span>
                </div>
              )}

              {application.advancedBy === 'SYSTEM_AI' && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] leading-relaxed">
                  ✓ Candidate met the auto-shortlist threshold (≥70) and was automatically advanced.
                </div>
              )}

              {testInvite ? (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900">Assessment Invite</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                      testInvite.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : testInvite.status === 'STARTED'
                        ? 'bg-blue-100 text-blue-800'
                        : testInvite.status === 'EXPIRED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {testInvite.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Expires: {new Date(testInvite.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 italic">No assessment invite sent for this candidate.</p>
              )}
            </div>
          </div>
          
          {/* Card 1: Job Match Score */}
          <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-6 sm:p-7 rounded-3xl text-white shadow-xl space-y-4">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-200">AI Job Match Score</h3>
              </div>

              <button
                type="button"
                onClick={handleCalculateMatch}
                disabled={matchLoading}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition cursor-pointer disabled:opacity-50"
              >
                {matchLoading ? 'Analyzing...' : matchScore ? 'Recalculate' : 'Run Match AI'}
              </button>
            </div>

            {matchErrorMsg && (
              <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-xs text-red-200">
                {matchErrorMsg}
              </div>
            )}

            {matchLoading ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-8 h-8 mx-auto text-white">
                  <LoadingSpinner />
                </div>
                <p className="text-xs text-blue-200">Groq LLM is comparing resume qualifications against job requirements...</p>
              </div>
            ) : matchScore ? (
              <div className="space-y-3.5 pt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-emerald-400">{matchScore.score}</span>
                  <span className="text-lg text-blue-200 font-bold">/ 100</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      matchScore.score >= 80
                        ? 'bg-emerald-400'
                        : matchScore.score >= 60
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${Math.min(100, matchScore.score)}%` }}
                  ></div>
                </div>

                {/* Rationale */}
                <div className="pt-2 border-t border-white/10 space-y-1">
                  <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">AI Match Rationale</span>
                  <p className="text-xs text-blue-100 leading-relaxed whitespace-pre-line">
                    {matchScore.rationale}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2 text-blue-200 text-xs">
                <p>No job-match score generated yet.</p>
                <button
                  type="button"
                  onClick={handleCalculateMatch}
                  className="mt-1 px-4 py-2 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Calculate Match Score Now →
                </button>
              </div>
            )}
          </div>

          {/* Card 1.5: AI Assessment Score & Candidate Written Answers */}
          {testInvite && (testInvite.status === 'COMPLETED' || (testInvite.responses && testInvite.responses.length > 0)) && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-7 rounded-3xl text-white shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-200">AI Assessment Evaluation</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                  {testInvite.status}
                </span>
              </div>

              {/* Assessment Score */}
              {testInvite.assessmentScore !== null && testInvite.assessmentScore !== undefined ? (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-emerald-400">{testInvite.assessmentScore}</span>
                    <span className="text-lg text-blue-200 font-bold">/ 100</span>
                  </div>

                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        testInvite.assessmentScore >= 80
                          ? 'bg-emerald-400'
                          : testInvite.assessmentScore >= 60
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${Math.min(100, testInvite.assessmentScore)}%` }}
                    ></div>
                  </div>

                  {testInvite.assessmentFeedback && (
                    <div className="pt-2 border-t border-white/10 space-y-1">
                      <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">AI Evaluation Feedback</span>
                      <p className="text-xs text-blue-100 leading-relaxed whitespace-pre-line">
                        {testInvite.assessmentFeedback}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-white/5 rounded-xl text-xs text-blue-200 italic border border-white/10">
                  AI automated grading is unavailable. Candidate responses are available below for human evaluation.
                </div>
              )}

              {/* Candidate Written Responses */}
              {testInvite.responses && testInvite.responses.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-3">
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-wider block">Candidate Written Answers</span>
                  <div className="space-y-3">
                    {testInvite.responses.map((resp: any, idx: number) => (
                      <div key={idx} className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                        <p className="text-xs font-bold text-blue-300">{resp.question}</p>
                        <p className="text-xs text-slate-100 leading-relaxed whitespace-pre-line bg-black/20 p-2.5 rounded-xl">
                          {resp.answer || '(No answer provided)'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Card 1.6: AI Voice Interview Evaluation & Full Transcript */}
          {interviewInvite && (
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-6 sm:p-7 rounded-3xl text-white shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-purple-200">AI Voice Interview</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  interviewInvite.status === 'COMPLETED'
                    ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                    : interviewInvite.status === 'STARTED'
                    ? 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
                    : interviewInvite.status === 'EXPIRED'
                    ? 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
                    : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                }`}>
                  {interviewInvite.status}
                </span>
              </div>

              {interviewInvite.status === 'COMPLETED' ? (
                <div className="space-y-4">
                  {/* Session Integrity & Completion Info */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 border-b border-white/10 text-[11px] text-purple-200">
                    {interviewInvite.endedReason && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg border border-white/10 font-medium">
                        <span>🏁</span>
                        <span>
                          {interviewInvite.endedReason === 'MAX_DURATION_REACHED'
                            ? 'Safety Timeout (8 min)'
                            : interviewInvite.endedReason === 'TAB_SWITCH_TIMEOUT'
                            ? 'Tab Switch Violation (>15s away)'
                            : interviewInvite.endedReason === 'ASSISTANT_ENDED' || interviewInvite.endedReason === 'assistant-ended-call'
                            ? 'Concluded Naturally'
                            : interviewInvite.endedReason === 'DISCONNECTED'
                            ? 'Disconnected'
                            : interviewInvite.endedReason}
                        </span>
                      </div>
                    )}

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg border border-white/10 font-medium">
                      <span>👁️</span>
                      <span>
                        Tab Switches: {interviewInvite.tabSwitchCount || 0}
                        {(interviewInvite.tabSwitchDuration || 0) > 0
                          ? ` (${interviewInvite.tabSwitchDuration}s total away)`
                          : ''}
                      </span>
                    </div>
                  </div>
                  {/* Interview Score */}
                  {interviewInvite.interviewScore !== null && interviewInvite.interviewScore !== undefined ? (
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-purple-400">{interviewInvite.interviewScore}</span>
                        <span className="text-lg text-purple-200 font-bold">/ 100</span>
                      </div>

                      <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            interviewInvite.interviewScore >= 80
                              ? 'bg-purple-400'
                              : interviewInvite.interviewScore >= 60
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                          style={{ width: `${Math.min(100, interviewInvite.interviewScore)}%` }}
                        ></div>
                      </div>

                      {interviewInvite.interviewFeedback && (
                        <div className="pt-2 border-t border-white/10 space-y-1">
                          <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider block">AI Recruiter Evaluation</span>
                          <p className="text-xs text-purple-100 leading-relaxed whitespace-pre-line">
                            {interviewInvite.interviewFeedback}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-white/5 rounded-xl text-xs text-purple-200 italic border border-white/10">
                      AI automated grading is unavailable. Raw conversation transcript is available below.
                    </div>
                  )}

                  {/* Transcript Collapsible Section */}
                  {interviewInvite.transcript && (
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">Conversation Transcript</span>
                        <button
                          type="button"
                          onClick={() => setShowTranscript((prev) => !prev)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-purple-200 text-[11px] font-semibold rounded-lg border border-white/10 transition cursor-pointer"
                        >
                          {showTranscript ? '▲ Hide Transcript' : '▼ View Transcript'}
                        </button>
                      </div>

                      {showTranscript && (
                        <div className="p-3.5 bg-black/40 rounded-2xl border border-white/10 max-h-80 overflow-y-auto space-y-2 text-xs leading-relaxed text-slate-200 whitespace-pre-line">
                          {interviewInvite.transcript}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-xs text-purple-200">
                  <p className="leading-relaxed">
                    Voice interview invitation sent to candidate. Waiting for candidate to complete the voice session with the AI hiring assistant.
                  </p>
                  <p className="text-[11px] text-purple-300/80">
                    Invite Expires: {new Date(interviewInvite.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Card 2: Extracted CV Analysis */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Extracted CV Insights</h3>
              {cvAnalysis?.estimatedExperienceLevel && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 uppercase">
                  {cvAnalysis.estimatedExperienceLevel} Level
                </span>
              )}
            </div>

            {cvAnalysis ? (
              <div className="space-y-4">
                {/* Extracted Skills */}
                {cvAnalysis.extractedSkills && cvAnalysis.extractedSkills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Extracted Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {cvAnalysis.extractedSkills.map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-blue-50 text-[#146BFF] border border-blue-200 rounded-lg text-xs font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience Summary */}
                {cvAnalysis.experienceSummary && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Experience Summary</span>
                    <p className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-200/60">
                      {cvAnalysis.experienceSummary}
                    </p>
                  </div>
                )}

                {/* Education Summary */}
                {cvAnalysis.educationSummary && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Education Summary</span>
                    <p className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-200/60">
                      {cvAnalysis.educationSummary}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                CV analysis not yet generated for this resume version.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
