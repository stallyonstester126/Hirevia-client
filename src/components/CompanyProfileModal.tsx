'use client'

import React, { useState } from 'react'
import { apiClient } from '../lib/api-client'
import { ICompanyProfile } from '../types'

interface CompanyProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (profile: ICompanyProfile) => void
  initialProfile?: Partial<ICompanyProfile> | null
  profileExists?: boolean
}

export default function CompanyProfileModal({
  isOpen,
  onClose,
  onSaved,
  initialProfile,
  profileExists = false,
}: CompanyProfileModalProps) {
  const [companyName, setCompanyName] = useState(initialProfile?.companyName || '')
  const [industry, setIndustry] = useState(initialProfile?.industry || '')
  const [location, setLocation] = useState(initialProfile?.location || '')
  const [website, setWebsite] = useState(initialProfile?.website || '')
  const [phone, setPhone] = useState(initialProfile?.phone || '')
  const [logoUrl, setLogoUrl] = useState(initialProfile?.logoUrl || '')
  const [description, setDescription] = useState(initialProfile?.description || '')

  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim() || companyName.trim().length < 2) {
      setErrorMsg('Company / Brand Name is required (minimum 2 characters).')
      return
    }

    setIsSaving(true)
    setErrorMsg('')

    const payload: Partial<ICompanyProfile> = {
      companyName: companyName.trim(),
      industry: industry.trim() || '',
      location: location.trim() || '',
      website: website.trim() || '',
      phone: phone.trim() || '',
      logoUrl: logoUrl.trim() || '',
      description: description.trim() || '',
    }

    try {
      let res: { success: boolean; data: ICompanyProfile }
      if (profileExists) {
        res = await apiClient.patch<ICompanyProfile>('/company/profile', payload)
      } else {
        res = await apiClient.post<ICompanyProfile>('/company/profile', payload)
      }
      onSaved(res.data)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save company profile. Please try again.')
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                Onboarding Setup
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Complete Your Company Profile
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage your company branding, overview, and contact information visible to job candidates.
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
                Organization Details
              </h3>

              {/* Company Name */}
              <div className="space-y-1">
                <label htmlFor="modalCompanyName" className="block text-xs font-semibold text-slate-700">
                  Company / Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="modalCompanyName"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Stripe, Acme Corp"
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition"
                />
              </div>

              {/* Industry & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="modalIndustry" className="block text-xs font-semibold text-slate-700">
                    Industry / Sector
                  </label>
                  <input
                    id="modalIndustry"
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Software & SaaS, FinTech, E-Commerce"
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modalLocation" className="block text-xs font-semibold text-slate-700">
                    Headquarters Location
                  </label>
                  <input
                    id="modalLocation"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA or London, UK"
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition"
                  />
                </div>
              </div>

              {/* Website & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="modalWebsite" className="block text-xs font-semibold text-slate-700">
                    Website URL
                  </label>
                  <input
                    id="modalWebsite"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modalPhone" className="block text-xs font-semibold text-slate-700">
                    Contact Phone Number
                  </label>
                  <input
                    id="modalPhone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition"
                  />
                </div>
              </div>

              {/* Logo URL */}
              <div className="space-y-1">
                <label htmlFor="modalLogoUrl" className="block text-xs font-semibold text-slate-700">
                  Company Logo URL
                </label>
                <input
                  id="modalLogoUrl"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition"
                />
              </div>

              {/* Description / Mission */}
              <div className="space-y-1">
                <label htmlFor="modalDescription" className="block text-xs font-semibold text-slate-700">
                  About the Company / Mission
                </label>
                <textarea
                  id="modalDescription"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell candidates about your mission, company culture, values, and engineering vision..."
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition resize-y"
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
