'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '../../../../lib/api-client'
import { IJob } from '../../../../types'
import JobForm from '../../../../components/JobForm'

export default function NewJobPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCreateJob = async (jobData: Partial<IJob>) => {
    setIsSubmitting(true)
    setErrorMsg('')
    try {
      const res = await apiClient.post<IJob>('/company/jobs', jobData)
      if (res.success && res.data) {
        // Redirect to newly created job detail page
        router.push(`/company/jobs/${res.data._id}`)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create job posting.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <Link
          href="/company/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#146BFF] transition"
        >
          ← Back to Job Postings
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Post a New Job Opportunity</h1>
        <p className="text-sm text-slate-500">
          Create a draft job opening. Once created, pay the posting fee to publish it live to the talent marketplace.
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
        onSubmit={handleCreateJob}
        isSubmitting={isSubmitting}
        submitButtonText="Create Draft Job →"
      />
    </div>
  )
}
