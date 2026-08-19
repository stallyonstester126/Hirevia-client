'use client'

import React, { useState, useEffect } from 'react'
import { apiClient, ApiError } from '../../../lib/api-client'
import { ISeekerProfile, IExperience, IEducation } from '../../../types'
import TagInput from '../../../components/TagInput'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function SeekerProfilePage() {
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profileExists, setProfileExists] = useState(false)

  // Profile Form States
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [experience, setExperience] = useState<IExperience[]>([])
  const [education, setEducation] = useState<IEducation[]>([])

  // Temporary item editors
  const [newExp, setNewExp] = useState<IExperience>({
    company: '',
    position: '',
    startDate: '',
    endDate: null,
    description: '',
  })
  const [isCurrentExp, setIsCurrentExp] = useState(false)
  const [showExpModal, setShowExpModal] = useState(false)
  const [expEditIndex, setExpEditIndex] = useState<number | null>(null)

  const [newEdu, setNewEdu] = useState<IEducation>({
    institution: '',
    degree: '',
    startDate: '',
    endDate: null,
  })
  const [showEduModal, setShowEduModal] = useState(false)
  const [eduEditIndex, setEduEditIndex] = useState<number | null>(null)

  // Feedback alerts
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const response = await apiClient.get<ISeekerProfile>('/seeker/profile')
      if (response.success && response.data) {
        const p = response.data
        setHeadline(p.headline || '')
        setBio(p.bio || '')
        setLocation(p.location || '')
        setSkills(p.skills || [])
        setExperience(p.experience || [])
        setEducation(p.education || [])
        setProfileExists(true)
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 404) {
        // Profile does not exist yet (expected for new seekers)
        setProfileExists(false)
      } else {
        setErrorMsg(err.message || 'Failed to load profile details.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    const payload: Partial<ISeekerProfile> = {
      headline: headline.trim(),
      bio: bio.trim(),
      location: location.trim(),
      skills,
      experience: experience.map((exp) => ({
        company: exp.company.trim(),
        position: exp.position.trim(),
        startDate: new Date(exp.startDate).toISOString(),
        endDate: exp.endDate ? new Date(exp.endDate).toISOString() : null,
        description: exp.description?.trim() || '',
      })),
      education: education.map((edu) => ({
        institution: edu.institution.trim(),
        degree: edu.degree.trim(),
        startDate: new Date(edu.startDate).toISOString(),
        endDate: edu.endDate ? new Date(edu.endDate).toISOString() : null,
      })),
    }

    try {
      if (profileExists) {
        await apiClient.patch('/seeker/profile', payload)
      } else {
        await apiClient.post('/seeker/profile', payload)
        setProfileExists(true)
      }
      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile changes.')
    } finally {
      setIsSaving(false)
    }
  }

  // ================= EXPERIENCE HELPERS =================
  const openAddExp = () => {
    setNewExp({
      company: '',
      position: '',
      startDate: '',
      endDate: null,
      description: '',
    })
    setIsCurrentExp(false)
    setExpEditIndex(null)
    setShowExpModal(true)
  }

  const openEditExp = (idx: number) => {
    const item = experience[idx]
    setNewExp({
      ...item,
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : null,
    })
    setIsCurrentExp(!item.endDate)
    setExpEditIndex(idx)
    setShowExpModal(true)
  }

  const saveExpModal = () => {
    if (!newExp.company.trim() || newExp.company.trim().length < 2) {
      alert('Company name must be at least 2 characters.')
      return
    }
    if (!newExp.position.trim() || newExp.position.trim().length < 2) {
      alert('Position title must be at least 2 characters.')
      return
    }
    if (!newExp.startDate) {
      alert('Start date is required.')
      return
    }

    const expToSave: IExperience = {
      ...newExp,
      endDate: isCurrentExp ? null : newExp.endDate,
    }

    if (expEditIndex !== null) {
      const updated = [...experience]
      updated[expEditIndex] = expToSave
      setExperience(updated)
    } else {
      setExperience([...experience, expToSave])
    }
    setShowExpModal(false)
  }

  const removeExp = (idx: number) => {
    setExperience(experience.filter((_, i) => i !== idx))
  }

  // ================= EDUCATION HELPERS =================
  const openAddEdu = () => {
    setNewEdu({
      institution: '',
      degree: '',
      startDate: '',
      endDate: null,
    })
    setEduEditIndex(null)
    setShowEduModal(true)
  }

  const openEditEdu = (idx: number) => {
    const item = education[idx]
    setNewEdu({
      ...item,
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : null,
    })
    setEduEditIndex(idx)
    setShowEduModal(true)
  }

  const saveEduModal = () => {
    if (!newEdu.institution.trim() || newEdu.institution.trim().length < 2) {
      alert('Institution must be at least 2 characters.')
      return
    }
    if (!newEdu.degree.trim() || newEdu.degree.trim().length < 2) {
      alert('Degree / Field of study must be at least 2 characters.')
      return
    }
    if (!newEdu.startDate) {
      alert('Start date is required.')
      return
    }

    if (eduEditIndex !== null) {
      const updated = [...education]
      updated[eduEditIndex] = newEdu
      setEducation(updated)
    } else {
      setEducation([...education, newEdu])
    }
    setShowEduModal(false)
  }

  const removeEdu = (idx: number) => {
    setEducation(education.filter((_, i) => i !== idx))
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
          <h1 className="text-2xl font-bold text-slate-900">Professional Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Build a standout profile to highlight your experience, skills, and background to employers.
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
        {/* Basic Info Card */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Basic Information</h2>

          <div className="space-y-1.5">
            <label htmlFor="headline" className="block text-xs font-semibold text-slate-700">
              Professional Headline
            </label>
            <input
              id="headline"
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer | React, Node.js & TypeScript"
              className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="location" className="block text-xs font-semibold text-slate-700">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA or Remote"
                className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bio" className="block text-xs font-semibold text-slate-700">
              Professional Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Briefly describe your career achievements, core strengths, and what you are looking for in your next role..."
              className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition resize-y"
            />
          </div>
        </div>

        {/* Skills Card */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Skills & Competencies</h2>
          <p className="text-xs text-slate-500">
            Add key technical and soft skills that match your career focus.
          </p>
          <TagInput
            tags={skills}
            onChange={setSkills}
            placeholder="Type skill (e.g. React, Python, Docker) and press Enter..."
            label=""
          />
        </div>

        {/* Work Experience Card */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Work Experience</h2>
              <p className="text-xs text-slate-500 mt-0.5">Highlight your professional track record.</p>
            </div>
            <button
              type="button"
              onClick={openAddExp}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#146BFF] text-xs font-semibold rounded-xl border border-blue-200 transition cursor-pointer"
            >
              + Add Experience
            </button>
          </div>

          {experience.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-sm text-slate-400">No work experience added yet.</p>
              <button
                type="button"
                onClick={openAddExp}
                className="mt-2 text-xs font-semibold text-[#146BFF] hover:underline"
              >
                Add your first position
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {experience.map((exp, idx) => (
                <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{exp.position}</h3>
                    <p className="text-xs font-medium text-[#146BFF]">{exp.company}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(exp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} —{' '}
                      {exp.endDate ? new Date(exp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Present'}
                    </p>
                    {exp.description && (
                      <p className="text-xs text-slate-600 pt-1 leading-relaxed whitespace-pre-line">{exp.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditExp(idx)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      aria-label="Edit experience"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExp(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      aria-label="Delete experience"
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

        {/* Education Card */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Education</h2>
              <p className="text-xs text-slate-500 mt-0.5">Degrees, certifications, and academic background.</p>
            </div>
            <button
              type="button"
              onClick={openAddEdu}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#146BFF] text-xs font-semibold rounded-xl border border-blue-200 transition cursor-pointer"
            >
              + Add Education
            </button>
          </div>

          {education.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-sm text-slate-400">No education entries added yet.</p>
              <button
                type="button"
                onClick={openAddEdu}
                className="mt-2 text-xs font-semibold text-[#146BFF] hover:underline"
              >
                Add your degree or school
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {education.map((edu, idx) => (
                <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{edu.degree}</h3>
                    <p className="text-xs font-medium text-[#146BFF]">{edu.institution}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(edu.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} —{' '}
                      {edu.endDate ? new Date(edu.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Present'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditEdu(idx)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      aria-label="Edit education"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEdu(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      aria-label="Delete education"
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

        {/* Bottom Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* ================= EXPERIENCE MODAL ================= */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {expEditIndex !== null ? 'Edit Experience' : 'Add Experience'}
              </h3>
              <button
                type="button"
                onClick={() => setShowExpModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Company Name *</label>
                <input
                  type="text"
                  value={newExp.company}
                  onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                  placeholder="e.g. Google, Acme Corp"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#146BFF] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Position / Job Title *</label>
                <input
                  type="text"
                  value={newExp.position}
                  onChange={(e) => setNewExp({ ...newExp, position: e.target.value })}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#146BFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Start Date *</label>
                  <input
                    type="date"
                    value={newExp.startDate}
                    onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#146BFF] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">End Date</label>
                  <input
                    type="date"
                    disabled={isCurrentExp}
                    value={newExp.endDate || ''}
                    onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#146BFF] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="current-role"
                  type="checkbox"
                  checked={isCurrentExp}
                  onChange={(e) => setIsCurrentExp(e.target.checked)}
                  className="rounded text-[#146BFF] focus:ring-[#146BFF]"
                />
                <label htmlFor="current-role" className="text-xs text-slate-600 cursor-pointer">
                  I currently work in this role
                </label>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Description / Key Achievements</label>
                <textarea
                  rows={3}
                  value={newExp.description || ''}
                  onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                  placeholder="Key responsibilities and achievements..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#146BFF] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExpModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveExpModal}
                className="px-4 py-2 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs font-semibold rounded-xl"
              >
                Save Experience
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDUCATION MODAL ================= */}
      {showEduModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {eduEditIndex !== null ? 'Edit Education' : 'Add Education'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEduModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Institution / University *</label>
                <input
                  type="text"
                  value={newEdu.institution}
                  onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                  placeholder="e.g. Stanford University, MIT"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#146BFF] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Degree / Program *</label>
                <input
                  type="text"
                  value={newEdu.degree}
                  onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                  placeholder="e.g. B.S. in Computer Science"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#146BFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Start Date *</label>
                  <input
                    type="date"
                    value={newEdu.startDate}
                    onChange={(e) => setNewEdu({ ...newEdu, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#146BFF] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={newEdu.endDate || ''}
                    onChange={(e) => setNewEdu({ ...newEdu, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#146BFF] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEduModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEduModal}
                className="px-4 py-2 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs font-semibold rounded-xl"
              >
                Save Education
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
