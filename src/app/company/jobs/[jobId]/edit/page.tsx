'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '../../../../../lib/api-client'
import { IJob, EJobStatus } from '../../../../../types'
import JobForm from '../../../../../components/JobForm'
import LoadingSpinner from '../../../../../components/LoadingSpinner'

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const [job, setJob] = useState<IJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (jobId) {
      fetchJob()
    }
  }, [jobId])

  const fetchJob = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await apiClient.get<IJob>(`/company/jobs/${jobId}`)
      if (res.success && res.data) {
        setJob(res.data)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Job posting not found.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateJob = async (jobData: Partial<IJob>) => {
    setIsSubmitting(true)
    setErrorMsg('')
    try {
      const res = await apiClient.patch<IJob>(`/company/jobs/${jobId}`, jobData)
      if (res.success && res.data) {
        router.push(`/company/jobs/${jobId}`)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update job posting.')
      setIsSubmitting(false)
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
          ← Back to Job Postings
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <Link
          href={`/company/jobs/${jobId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#146BFF] transition"
        >
          ← Back to Job Details
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Edit Job: {job.title}</h1>
        <p className="text-sm text-slate-500">
          Update the responsibilities, requirements, compensation, and criteria for this position.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-800 flex items-center gap-2.5 animate-fadeIn">
          <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      <JobForm
        initialData={job}
        onSubmit={handleUpdateJob}
        onCancel={() => router.push(`/company/jobs/${jobId}`)}
        isSubmitting={isSubmitting}
        submitButtonText="Save Changes →"
      />
    </div>
  )
}
