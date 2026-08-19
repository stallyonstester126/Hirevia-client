'use client'

import React, { useState, useEffect } from 'react'
import { apiClient, ApiError } from '../../../lib/api-client'
import { ICompanyProfile } from '../../../types'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profileExists, setProfileExists] = useState(false)

  // Form states
  const [companyName, setCompanyName] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  // Alerts
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const response = await apiClient.get<ICompanyProfile>('/company/profile')
      if (response.success && response.data) {
        const p = response.data
        setCompanyName(p.companyName || '')
        setDescription(p.description || '')
        setWebsite(p.website || '')
        setIndustry(p.industry || '')
        setLocation(p.location || '')
        setPhone(p.phone || '')
        setLogoUrl(p.logoUrl || '')
        setProfileExists(true)
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 404) {
        setProfileExists(false)
      } else {
        setErrorMsg(err.message || 'Failed to load company profile.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim() || companyName.trim().length < 2) {
      setErrorMsg('Company name must be at least 2 characters.')
      return
    }

    setIsSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    const payload: Partial<ICompanyProfile> = {
      companyName: companyName.trim(),
      description: description.trim() || '',
      website: website.trim() || '',
      industry: industry.trim() || '',
      location: location.trim() || '',
      phone: phone.trim() || '',
      logoUrl: logoUrl.trim() || '',
    }

    try {
      if (profileExists) {
        await apiClient.patch('/company/profile', payload)
      } else {
        await apiClient.post('/company/profile', payload)
        setProfileExists(true)
      }
      setSuccessMsg('Company profile updated successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save company profile.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your company branding, overview, and contact information visible to job candidates.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-60 cursor-pointer"
        >
          {isSaving ? 'Saving Changes...' : 'Save Profile'}
        </button>
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

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <h2 className="text-lg font-bold text-slate-900">Organization Details</h2>

          {/* Company Name */}
          <div className="space-y-1.5">
            <label htmlFor="companyName" className="block text-xs font-semibold text-slate-700">
              Company / Brand Name *
            </label>
            <input
              id="companyName"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Stripe, Acme Corp"
              className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition"
            />
          </div>

          {/* Industry & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="industry" className="block text-xs font-semibold text-slate-700">
                Industry / Sector
              </label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Software & SaaS, FinTech, E-Commerce"
                className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="location" className="block text-xs font-semibold text-slate-700">
                Headquarters Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA or London, UK"
                className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition"
              />
            </div>
          </div>

          {/* Website & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="website" className="block text-xs font-semibold text-slate-700">
                Website URL
              </label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-700">
                Contact Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div className="space-y-1.5">
            <label htmlFor="logoUrl" className="block text-xs font-semibold text-slate-700">
              Company Logo URL
            </label>
            <input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-xs font-semibold text-slate-700">
              About the Company / Mission
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell candidates about your mission, company culture, values, and engineering vision..."
              className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition resize-y"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? 'Saving Changes...' : 'Save Company Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
