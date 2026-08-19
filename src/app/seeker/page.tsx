'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '../../lib/api-client'
import { useAuth } from '../../context/AuthContext'
import { IJob, IApplicationsResponse, IResume, ISeekerProfile } from '../../types'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import SeekerProfileModal from '../../components/SeekerProfileModal'

export default function SeekerDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [applicationsCount, setApplicationsCount] = useState(0)
  const [resumesCount, setResumesCount] = useState(0)
  const [hasProfile, setHasProfile] = useState(false)
  const [profileData, setProfileData] = useState<ISeekerProfile | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileSavedMsg, setProfileSavedMsg] = useState('')
  const [recentJobs, setRecentJobs] = useState<IJob[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [appsRes, resumesRes, profileRes, jobsRes] = await Promise.allSettled([
        apiClient.get<IApplicationsResponse>('/seeker/applications', { params: { limit: 1 } }),
        apiClient.get<IResume[]>('/seeker/resumes'),
        apiClient.get<ISeekerProfile>('/seeker/profile'),
        apiClient.get<{ jobs: IJob[] }>('/jobs', { params: { limit: 4 } }),
      ])

      if (appsRes.status === 'fulfilled' && appsRes.value.success) {
        setApplicationsCount(appsRes.value.data?.pagination?.total || 0)
      }

      if (resumesRes.status === 'fulfilled' && resumesRes.value.success) {
        setResumesCount(resumesRes.value.data?.length || 0)
      }

      if (profileRes.status === 'fulfilled' && profileRes.value.success && profileRes.value.data) {
        const prof = profileRes.value.data
        setProfileData(prof)
        if (prof.headline && prof.headline.trim().length > 0) {
          setHasProfile(true)
        } else {
          setHasProfile(false)
          setShowProfileModal(true)
        }
      } else {
        setHasProfile(false)
        setShowProfileModal(true)
      }

      if (jobsRes.status === 'fulfilled' && jobsRes.value.success) {
        setRecentJobs(jobsRes.value.data?.jobs || [])
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSaved = (saved: ISeekerProfile) => {
    setProfileData(saved)
    setHasProfile(true)
    setProfileSavedMsg('Professional profile saved successfully! Your candidate profile is now active.')
    setTimeout(() => setProfileSavedMsg(''), 5000)
  }

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Onboarding Candidate Profile Modal */}
      <SeekerProfileModal
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
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-1 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Incomplete Profile Callout Banner if user skipped modal */}
      {!hasProfile && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#146BFF] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Your Candidate Profile is Incomplete</h3>
              <p className="text-xs text-slate-600">
                Complete your professional headline, location, bio, and key skills to get matched with top engineering opportunities.
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
      <div className="bg-gradient-to-r from-[#0E5CE8] via-[#146BFF] to-[#0D55D8] rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/15 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Candidate Portal</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Candidate'}! 👋
          </h1>
          <p className="text-sm text-blue-100/90 max-w-xl leading-relaxed">
            Track your job applications, optimize your resume with AI insights, and explore the newest engineering & product roles.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <Link
            href="/seeker/jobs"
            className="px-5 py-2.5 bg-white hover:bg-blue-50 text-[#146BFF] text-xs sm:text-sm font-bold rounded-xl shadow-xs transition"
          >
            Explore Jobs →
          </Link>
          <Link
            href="/seeker/resumes"
            className="px-4 py-2.5 bg-blue-700/60 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl border border-blue-400/40 transition"
          >
            Manage Resumes
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <Link
          href="/seeker/applications"
          className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Applications</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#146BFF] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{applicationsCount}</p>
          <p className="text-xs text-[#146BFF] font-medium group-hover:underline">View tracking details →</p>
        </Link>

        {/* Metric 2 */}
        <Link
          href="/seeker/resumes"
          className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resumes Uploaded</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{resumesCount}</p>
          <p className="text-xs text-emerald-600 font-medium group-hover:underline">
            {resumesCount > 0 ? 'AI CV Analysis Ready →' : 'Upload CV document →'}
          </p>
        </Link>

        {/* Metric 3 */}
        <Link
          href="/seeker/profile"
          className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate Profile</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{hasProfile ? 'Active' : 'Incomplete'}</p>
          <p className="text-xs text-purple-600 font-medium group-hover:underline">
            {hasProfile ? 'Edit experience & skills →' : 'Complete profile info →'}
          </p>
        </Link>
      </div>

      {/* Featured Openings Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Featured Job Openings</h2>
            <p className="text-xs text-slate-500">Explore published positions ready for your application.</p>
          </div>
          <Link
            href="/seeker/jobs"
            className="text-xs font-semibold text-[#146BFF] hover:underline"
          >
            View all jobs →
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400 text-sm">
            No published jobs available right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentJobs.map((job) => {
              const companyName = typeof job.companyId === 'object' && job.companyId?.name
                ? job.companyId.name
                : 'Featured Company'

              return (
                <div
                  key={job._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase">{companyName}</span>
                      <StatusBadge status={job.status} size="sm" />
                    </div>
                    <Link href={`/seeker/jobs/${job._id}`}>
                      <h3 className="text-base font-bold text-slate-900 hover:text-[#146BFF] transition line-clamp-1">
                        {job.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500">
                      {job.location?.city ? `${job.location.city}, ${job.location.country}` : 'Remote'} • {job.workplaceType} • {job.employmentType?.replace('_', ' ')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {job.salary ? `${job.salary.currency || 'USD'} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}` : 'Competitive'}
                    </span>
                    <Link
                      href={`/seeker/jobs/${job._id}`}
                      className="text-xs font-semibold text-[#146BFF] hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
