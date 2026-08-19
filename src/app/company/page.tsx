'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '../../lib/api-client'
import { useAuth } from '../../context/AuthContext'
import { IJob, IJobsResponse, EJobStatus, EPaymentStatus, ICompanyProfile } from '../../types'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import CompanyProfileModal from '../../components/CompanyProfileModal'

export default function CompanyDashboard() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<IJob[]>([])
  const [hasProfile, setHasProfile] = useState(false)
  const [profileData, setProfileData] = useState<ICompanyProfile | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileSavedMsg, setProfileSavedMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [jobsRes, profileRes] = await Promise.allSettled([
        apiClient.get<IJobsResponse>('/company/jobs', { params: { limit: 6 } }),
        apiClient.get<ICompanyProfile>('/company/profile'),
      ])

      if (jobsRes.status === 'fulfilled' && jobsRes.value.success) {
        setJobs(jobsRes.value.data.jobs || [])
      }

      if (profileRes.status === 'fulfilled' && profileRes.value.success && profileRes.value.data) {
        const prof = profileRes.value.data
        setProfileData(prof)
        if (prof.companyName && prof.companyName.trim().length > 0) {
          setHasProfile(true)
        } else {
          setHasProfile(false)
          setShowProfileModal(true)
        }
      } else {
        // Profile not found or not created yet
        setHasProfile(false)
        setShowProfileModal(true)
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSaved = (saved: ICompanyProfile) => {
    setProfileData(saved)
    setHasProfile(true)
    setProfileSavedMsg('Company profile saved successfully! Your organization details are now active.')
    setTimeout(() => setProfileSavedMsg(''), 5000)
  }

  const publishedCount = jobs.filter((j) => j.status === EJobStatus.PUBLISHED).length
  const draftCount = jobs.filter((j) => j.status === EJobStatus.DRAFT).length
  const closedCount = jobs.filter((j) => j.status === EJobStatus.CLOSED).length

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Onboarding Profile Modal */}
      <CompanyProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSaved={handleProfileSaved}
        initialProfile={profileData}
        profileExists={!!profileData?._id}
      />

      {/* Success Notification */}
      {profileSavedMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-sm text-emerald-900 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-xs sm:text-sm">{profileSavedMsg}</p>
          </div>
          <button
            onClick={() => setProfileSavedMsg('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Incomplete Profile Callout Banner if user skipped modal */}
      {!hasProfile && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Your Company Profile is Incomplete</h3>
              <p className="text-xs text-slate-600">
                Complete your brand overview, headquarters, and contact info so candidates can learn about your organization.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            className="px-4 py-2 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0 cursor-pointer"
          >
            Complete Profile Now →
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-slate-900/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Employer Recruitment Portal</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {profileData?.companyName || user?.name || 'Recruiting Team'}! 👋
          </h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            Manage your open engineering positions, pay posting fees with Stripe, review applicants, and leverage AI job-match scoring.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <Link
            href="/company/jobs/new"
            className="px-5 py-2.5 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition shadow-blue-500/20"
          >
            + Post a New Job
          </Link>
          <Link
            href="/company/profile"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/20 transition"
          >
            Company Profile
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <Link
          href="/company/jobs"
          className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Published Jobs</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{publishedCount}</p>
          <p className="text-xs text-emerald-600 font-medium group-hover:underline">Accepting live applications →</p>
        </Link>

        {/* Metric 2 */}
        <Link
          href="/company/jobs"
          className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Draft Jobs</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{draftCount}</p>
          <p className="text-xs text-amber-600 font-medium group-hover:underline">
            {draftCount > 0 ? 'Awaiting Stripe payment & publish →' : 'No pending drafts →'}
          </p>
        </Link>

        {/* Metric 3 */}
        <Link
          href="/company/profile"
          className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Brand</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{hasProfile ? 'Active' : 'Incomplete'}</p>
          <p className="text-xs text-purple-600 font-medium group-hover:underline">
            {hasProfile ? 'Edit organization info →' : 'Complete company details →'}
          </p>
        </Link>
      </div>

      {/* Recent Openings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Job Postings</h2>
            <p className="text-xs text-slate-500">Overview of your most recent openings and pipelines.</p>
          </div>
          <Link
            href="/company/jobs"
            className="text-xs font-semibold text-[#146BFF] hover:underline"
          >
            View all postings ({jobs.length}) →
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-3">
            <p className="text-sm text-slate-500">You haven&apos;t created any job openings yet.</p>
            <Link
              href="/company/jobs/new"
              className="inline-flex items-center px-4 py-2 bg-[#146BFF] text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              + Create Your First Job
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition flex flex-col justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={job.status} size="sm" />
                    {job.status === EJobStatus.DRAFT && (
                      <span className="text-[11px] font-semibold text-amber-600">
                        {job.paymentStatus === EPaymentStatus.PAID ? 'Fee Paid' : 'Payment Required'}
                      </span>
                    )}
                  </div>
                  <Link href={`/company/jobs/${job._id}`}>
                    <h3 className="text-base font-bold text-slate-900 hover:text-[#146BFF] transition line-clamp-1">
                      {job.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500">
                    {job.workplaceType} • {job.employmentType?.replace('_', ' ')} • {job.location?.city ? `${job.location.city}, ${job.location.country}` : 'Remote'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/company/jobs/${job._id}/applicants`}
                    className="text-xs font-semibold text-[#146BFF] hover:underline"
                  >
                    View Applicants Pipeline →
                  </Link>
                  <Link
                    href={`/company/jobs/${job._id}`}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
