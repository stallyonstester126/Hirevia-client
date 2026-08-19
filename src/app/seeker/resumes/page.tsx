'use client'

import React, { useState, useEffect, useRef } from 'react'
import { apiClient, ApiError } from '../../../lib/api-client'
import { IResume, ICVAnalysis } from '../../../types'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ConfirmationModal from '../../../components/ConfirmationModal'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']

export default function SeekerResumesPage() {
  const [resumes, setResumes] = useState<IResume[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Selected Analysis
  const [activeAnalysis, setActiveAnalysis] = useState<ICVAnalysis | null>(null)
  const [analyzingResumeId, setAnalyzingResumeId] = useState<string | null>(null)
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)

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

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await apiClient.get<IResume[]>('/seeker/resumes')
      if (res.success && res.data) {
        // Sort by version desc
        const sorted = [...res.data].sort((a, b) => b.version - a.version)
        setResumes(sorted)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load resumes.')
    } finally {
      setLoading(false)
    }
  }

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Invalid file format (${ext}). Allowed formats are: PDF, DOC, DOCX.`
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      return `File size (${sizeMB}MB) exceeds the maximum limit of 10MB.`
    }
    return null
  }

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setErrorMsg(validationError)
      return
    }

    setErrorMsg('')
    setSuccessMsg('')
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await apiClient.upload<IResume>('/seeker/resumes', formData)
      if (res.success) {
        setSuccessMsg(`Resume "${file.name}" uploaded successfully! (Version ${res.data?.version || 'new'})`)
        await fetchResumes()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload resume document.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleDownload = async (resume: IResume) => {
    try {
      await apiClient.download(`/seeker/resumes/${resume._id}/file`, resume.originalFileName)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download resume file.')
    }
  }

  const handleDelete = (resume: IResume) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Resume Version?',
      message: `Are you sure you want to delete "${resume.originalFileName}" (Version ${resume.version})? This action cannot be undone.`,
      confirmText: 'Delete Resume',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
        setErrorMsg('')
        setSuccessMsg('')
        try {
          await apiClient.delete(`/seeker/resumes/${resume._id}`)
          setSuccessMsg('Resume version removed.')
          await fetchResumes()
        } catch (err: any) {
          if (err instanceof ApiError && err.statusCode === 409) {
            setErrorMsg('Deletion blocked: This resume is referenced by an active job application.')
          } else {
            setErrorMsg(err.message || 'Failed to delete resume.')
          }
        }
      },
    })
  }

  const handleAnalyzeResume = async (resumeId: string, force = false) => {
    setAnalyzingResumeId(resumeId)
    setAnalysisLoading(true)
    setAnalysisModalOpen(true)
    setErrorMsg('')

    try {
      const res = await apiClient.post<ICVAnalysis>(`/seeker/resumes/${resumeId}/analyze${force ? '?force=true' : ''}`)
      if (res.success && res.data) {
        setActiveAnalysis(res.data)
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 503) {
        setActiveAnalysis({
          resumeId,
          seekerId: '',
          extractedSkills: [],
          experienceSummary: '',
          educationSummary: '',
          estimatedExperienceLevel: '',
          suggestions: [],
          status: 'FAILED',
        })
        setErrorMsg('AI analysis service is temporarily busy or unavailable. Please try again in a few moments.')
      } else {
        setErrorMsg(err.message || 'Failed to run AI CV analysis.')
        setAnalysisModalOpen(false)
      }
    } finally {
      setAnalysisLoading(false)
      setAnalyzingResumeId(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB'
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }
    return Math.round(bytes / 1024) + ' KB'
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resume & CV Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload multiple resume versions and use AI analysis to optimize your candidate profile.
          </p>
        </div>
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

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`bg-white p-8 rounded-2xl border-2 border-dashed transition-all duration-200 text-center ${
          dragOver ? 'border-[#146BFF] bg-blue-50/50 scale-[1.005]' : 'border-slate-300 hover:border-blue-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files[0])
            }
          }}
          className="hidden"
          id="resume-upload-input"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#146BFF] mx-auto flex items-center justify-center shadow-xs">
            {uploading ? (
              <svg className="animate-spin h-6 w-6 text-[#146BFF]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          <div>
            <label
              htmlFor="resume-upload-input"
              className="text-sm font-bold text-[#146BFF] hover:underline cursor-pointer"
            >
              Click to upload
            </label>{' '}
            <span className="text-sm text-slate-500">or drag and drop your file here</span>
          </div>

          <p className="text-xs text-slate-400">
            Supported formats: PDF, DOC, DOCX (Max size: 10MB). Uploading sets the new version as active.
          </p>

          {uploading && (
            <div className="pt-2">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#146BFF] h-2 rounded-full animate-pulse w-full"></div>
              </div>
              <p className="text-xs text-[#146BFF] font-medium mt-1">Uploading document and registering version...</p>
            </div>
          )}
        </div>
      </div>

      {/* Resumes List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Uploaded Resume Versions</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage versions, download copies, and trigger AI analysis insights.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {resumes.length} {resumes.length === 1 ? 'version' : 'versions'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : resumes.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm">No resume uploaded yet. Upload a CV above to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {resumes.map((resume) => (
              <div
                key={resume._id}
                className="p-5 sm:p-6 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#146BFF] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 break-all">{resume.originalFileName}</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        v{resume.version}
                      </span>
                      {resume.isActive && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active Version
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{formatFileSize(resume.fileSize)}</span>
                      <span>•</span>
                      <span>Uploaded {new Date(resume.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAnalyzeResume(resume._id)}
                    disabled={analyzingResumeId === resume._id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {analyzingResumeId === resume._id ? 'Analyzing...' : 'AI CV Analysis'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(resume)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Download
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(resume)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    aria-label="Delete resume"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= AI ANALYSIS MODAL ================= */}
      {analysisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">AI CV Analysis</h3>
                  <p className="text-xs text-slate-500">AI-powered candidate insights & suggestions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnalysisModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {analysisLoading ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-12 h-12 mx-auto">
                  <LoadingSpinner />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">Analyzing your resume with AI model...</p>
                  <p className="text-xs text-slate-500">Extracting skills, experience timeline, and generating optimization suggestions.</p>
                </div>
              </div>
            ) : activeAnalysis?.status === 'FAILED' ? (
              <div className="py-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-slate-900">AI Analysis Currently Unavailable</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  The AI parser is temporarily unavailable or hit a rate limit. Please try re-analyzing in a moment.
                </p>
                <button
                  type="button"
                  onClick={() => activeAnalysis?.resumeId && handleAnalyzeResume(activeAnalysis.resumeId, true)}
                  className="px-4 py-2 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs font-semibold rounded-xl"
                >
                  Retry Analysis
                </button>
              </div>
            ) : activeAnalysis ? (
              <div className="space-y-6">
                {/* Level badge */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Experience Level</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{activeAnalysis.estimatedExperienceLevel || 'Mid-Level'}</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-bold uppercase">
                    Status: {activeAnalysis.status}
                  </span>
                </div>

                {/* Extracted Skills */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Extracted Technical & Soft Skills</h4>
                  {activeAnalysis.extractedSkills && activeAnalysis.extractedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activeAnalysis.extractedSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-blue-50 text-[#146BFF] border border-blue-200 rounded-lg text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No skills extracted.</p>
                  )}
                </div>

                {/* Experience Summary */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Experience Summary</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {activeAnalysis.experienceSummary || 'No experience summary available.'}
                  </div>
                </div>

                {/* Education Summary */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Education Summary</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {activeAnalysis.educationSummary || 'No education summary available.'}
                  </div>
                </div>

                {/* Suggestions */}
                {activeAnalysis.suggestions && activeAnalysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Optimization Suggestions</h4>
                    <div className="space-y-2">
                      {activeAnalysis.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs text-amber-900">
                          <span className="text-amber-600 font-bold mt-0.5">•</span>
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer re-analyze */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleAnalyzeResume(activeAnalysis.resumeId, true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                  >
                    Force Re-Analyze
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalysisModalOpen(false)}
                    className="px-4 py-2 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs font-semibold rounded-xl"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
