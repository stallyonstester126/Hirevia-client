'use client'

import React, { useState } from 'react'
import { apiClient } from '../lib/api-client'
import { ISeekerProfile } from '../types'
import TagInput from './TagInput'

interface SeekerProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (profile: ISeekerProfile) => void
  initialProfile?: Partial<ISeekerProfile> | null
  profileExists?: boolean
}

export default function SeekerProfileModal({
  isOpen,
  onClose,
  onSaved,
  initialProfile,
  profileExists = false,
}: SeekerProfileModalProps) {
  const [headline, setHeadline] = useState(initialProfile?.headline || '')
  const [location, setLocation] = useState(initialProfile?.location || '')
  const [bio, setBio] = useState(initialProfile?.bio || '')
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills || [])

  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!headline.trim() || headline.trim().length < 2) {
      setErrorMsg('Professional Headline is required (minimum 2 characters).')
      return
    }

    setIsSaving(true)
    setErrorMsg('')

    const payload: Partial<ISeekerProfile> = {
      headline: headline.trim(),
      location: location.trim() || '',
      bio: bio.trim() || '',
      skills,
    }

    try {
      let res: { success: boolean; data: ISeekerProfile }
      if (profileExists) {
        res = await apiClient.patch<ISeekerProfile>('/seeker/profile', payload)
      } else {
        res = await apiClient.post<ISeekerProfile>('/seeker/profile', payload)
      }
      onSaved(res.data)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save professional profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-6 text-center">
        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 my-8 space-y-6 relative text-left">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#146BFF] to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                Candidate Onboarding
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Complete Your Candidate Profile
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Highlight your engineering focus, location, and core competencies to get discovered by employers.
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs sm:text-sm text-red-800 flex items-center gap-2.5">
              <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
                Professional Details
              </h3>

              {/* Headline */}
              <div className="space-y-1">
                <label htmlFor="seekerHeadline" className="block text-xs font-semibold text-slate-700">
                  Professional Headline <span className="text-red-500">*</span>
                </label>
                <input
                  id="seekerHeadline"
                  type="text"
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer | React, Node.js & TypeScript"
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition"
                />
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label htmlFor="seekerLocation" className="block text-xs font-semibold text-slate-700">
                  Current Location
                </label>
                <input
                  id="seekerLocation"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition"
                />
              </div>

              {/* Bio / Summary */}
              <div className="space-y-1">
                <label htmlFor="seekerBio" className="block text-xs font-semibold text-slate-700">
                  Professional Bio / Summary
                </label>
                <textarea
                  id="seekerBio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Briefly describe your career accomplishments, technical strengths, and preferred role..."
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition resize-y"
                />
              </div>

              {/* Skills */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Core Skills & Technologies
                </label>
                <TagInput
                  tags={skills}
                  onChange={setSkills}
                  placeholder="Type a skill (e.g. React, TypeScript, Python) and press Enter..."
                  label=""
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? 'Saving Profile...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
