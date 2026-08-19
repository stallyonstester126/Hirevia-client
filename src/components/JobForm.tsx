import React, { useState } from 'react'
import { IJob, EEmploymentType, EExperienceLevel, EWorkplaceType } from '../types'
import TagInput from './TagInput'

interface JobFormProps {
  initialData?: Partial<IJob>
  onSubmit: (jobData: Partial<IJob>) => Promise<void>
  isSubmitting: boolean
  submitButtonText?: string
}

export default function JobForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitButtonText = 'Save Job Posting',
}: JobFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [responsibilitiesText, setResponsibilitiesText] = useState(
    initialData?.responsibilities ? initialData.responsibilities.join('\n') : ''
  )
  const [requirementsText, setRequirementsText] = useState(
    initialData?.requirements ? initialData.requirements.join('\n') : ''
  )
  const [skills, setSkills] = useState<string[]>(initialData?.skills || [])
  const [employmentType, setEmploymentType] = useState<EEmploymentType>(
    initialData?.employmentType || EEmploymentType.FULL_TIME
  )
  const [experienceLevel, setExperienceLevel] = useState<EExperienceLevel>(
    initialData?.experienceLevel || EExperienceLevel.MID
  )
  const [workplaceType, setWorkplaceType] = useState<EWorkplaceType>(
    initialData?.workplaceType || EWorkplaceType.REMOTE
  )
  const [city, setCity] = useState(initialData?.location?.city || '')
  const [country, setCountry] = useState(initialData?.location?.country || '')
  const [salaryMin, setSalaryMin] = useState<number | string>(
    initialData?.salary?.min !== undefined ? initialData.salary.min : ''
  )
  const [salaryMax, setSalaryMax] = useState<number | string>(
    initialData?.salary?.max !== undefined ? initialData.salary.max : ''
  )
  const [currency, setCurrency] = useState(initialData?.salary?.currency || 'USD')
  const [period, setPeriod] = useState(initialData?.salary?.period || 'YEARLY')

  const [validationError, setValidationError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (!title.trim() || title.trim().length < 2) {
      setValidationError('Job title must be at least 2 characters.')
      return
    }

    if (!description.trim()) {
      setValidationError('Job description is required.')
      return
    }

    if (!city.trim() || !country.trim()) {
      setValidationError('Both city and country are required for location.')
      return
    }

    const minNum = Number(salaryMin)
    const maxNum = Number(salaryMax)

    if (isNaN(minNum) || minNum < 0) {
      setValidationError('Minimum salary must be a positive number.')
      return
    }

    if (isNaN(maxNum) || maxNum < minNum) {
      setValidationError('Maximum salary must be greater than or equal to minimum salary.')
      return
    }

    const responsibilities = responsibilitiesText
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean)

    const requirements = requirementsText
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean)

    const payload: Partial<IJob> = {
      title: title.trim(),
      description: description.trim(),
      responsibilities,
      requirements,
      skills,
      employmentType,
      experienceLevel,
      workplaceType,
      location: {
        city: city.trim(),
        country: country.trim(),
      },
      salary: {
        min: minNum,
        max: maxNum,
        currency: currency.trim() || 'USD',
        period: period.trim() || 'YEARLY',
      },
    }

    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {validationError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-800 flex items-center gap-2.5 animate-fadeIn">
          <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{validationError}</span>
        </div>
      )}

      {/* Card 1: Basic Role Details */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Role & Overview</h2>

        <div className="space-y-1.5">
          <label htmlFor="job-title" className="block text-xs font-semibold text-slate-700">
            Job Title *
          </label>
          <input
            id="job-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lead Full-Stack Engineer, Senior Product Designer"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="job-workplace" className="block text-xs font-semibold text-slate-700">
              Workplace Type *
            </label>
            <select
              id="job-workplace"
              value={workplaceType}
              onChange={(e) => setWorkplaceType(e.target.value as EWorkplaceType)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#146BFF]"
            >
              {Object.values(EWorkplaceType).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="job-employment" className="block text-xs font-semibold text-slate-700">
              Employment Type *
            </label>
            <select
              id="job-employment"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EEmploymentType)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#146BFF]"
            >
              {Object.values(EEmploymentType).map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="job-experience" className="block text-xs font-semibold text-slate-700">
              Experience Level *
            </label>
            <select
              id="job-experience"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as EExperienceLevel)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#146BFF]"
            >
              {Object.values(EExperienceLevel).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="job-city" className="block text-xs font-semibold text-slate-700">
              City *
            </label>
            <input
              id="job-city"
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. San Francisco or Remote"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="job-country" className="block text-xs font-semibold text-slate-700">
              Country *
            </label>
            <input
              id="job-country"
              type="text"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. United States or Worldwide"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="job-description" className="block text-xs font-semibold text-slate-700">
            Job Description *
          </label>
          <textarea
            id="job-description"
            rows={5}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the role, engineering challenges, and team expectations..."
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] resize-y"
          />
        </div>
      </div>

      {/* Card 2: Compensation */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Compensation Package</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="space-y-1.5">
            <label htmlFor="job-salary-min" className="block text-xs font-semibold text-slate-700">
              Min Salary *
            </label>
            <input
              id="job-salary-min"
              type="number"
              min="0"
              required
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder="100000"
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#146BFF]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="job-salary-max" className="block text-xs font-semibold text-slate-700">
              Max Salary *
            </label>
            <input
              id="job-salary-max"
              type="number"
              min="0"
              required
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder="150000"
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#146BFF]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="job-currency" className="block text-xs font-semibold text-slate-700">
              Currency *
            </label>
            <input
              id="job-currency"
              type="text"
              required
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              placeholder="USD"
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#146BFF]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="job-period" className="block text-xs font-semibold text-slate-700">
              Period *
            </label>
            <select
              id="job-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#146BFF]"
            >
              <option value="YEARLY">YEARLY</option>
              <option value="MONTHLY">MONTHLY</option>
              <option value="HOURLY">HOURLY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Card 3: Skills & Criteria */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Skills & Criteria</h2>

        <TagInput
          tags={skills}
          onChange={setSkills}
          placeholder="Type a skill and press Enter (e.g. React, Node.js, AWS)..."
          label="Required Skills & Tech Stack"
        />

        <div className="space-y-1.5">
          <label htmlFor="job-responsibilities" className="block text-xs font-semibold text-slate-700">
            Key Responsibilities (One item per line)
          </label>
          <textarea
            id="job-responsibilities"
            rows={3}
            value={responsibilitiesText}
            onChange={(e) => setResponsibilitiesText(e.target.value)}
            placeholder="Lead development of core microservices&#10;Mentor junior engineers&#10;Participate in architecture reviews"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] resize-y"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="job-requirements" className="block text-xs font-semibold text-slate-700">
            Requirements & Qualifications (One item per line)
          </label>
          <textarea
            id="job-requirements"
            rows={3}
            value={requirementsText}
            onChange={(e) => setRequirementsText(e.target.value)}
            placeholder="5+ years of experience with Node.js and TypeScript&#10;Experience with Docker & Kubernetes&#10;Strong communication skills"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] resize-y"
          />
        </div>
      </div>

      {/* Submit Button Bar */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? 'Saving Job...' : submitButtonText}
        </button>
      </div>
    </form>
  )
}
