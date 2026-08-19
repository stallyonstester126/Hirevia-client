'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../../../lib/api-client'
import { IJob, IJobsResponse, EEmploymentType, EExperienceLevel, EWorkplaceType } from '../../../types'
import JobCard from '../../../components/JobCard'
import Pagination from '../../../components/Pagination'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function SeekerJobsPage() {
  const [jobs, setJobs] = useState<IJob[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Filter States
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [employmentType, setEmploymentType] = useState<string>('')
  const [experienceLevel, setExperienceLevel] = useState<string>('')
  const [workplaceType, setWorkplaceType] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  })

  const fetchJobs = useCallback(async (targetPage = 1) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const params: Record<string, any> = {
        page: targetPage,
        limit: 12,
      }
      if (search.trim()) params.search = search.trim()
      if (location.trim()) params.location = location.trim()
      if (employmentType) params.employmentType = employmentType
      if (experienceLevel) params.experienceLevel = experienceLevel
      if (workplaceType) params.workplaceType = workplaceType

      const res = await apiClient.get<IJobsResponse>('/jobs', { params })
      if (res.success && res.data) {
        setJobs(res.data.jobs || [])
        if (res.data.pagination) {
          setPagination(res.data.pagination)
          setPage(res.data.pagination.page)
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch job postings.')
    } finally {
      setLoading(false)
    }
  }, [search, location, employmentType, experienceLevel, workplaceType])

  useEffect(() => {
    fetchJobs(1)
  }, [fetchJobs])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchJobs(1)
  }

  const handleClearFilters = () => {
    setSearch('')
    setLocation('')
    setEmploymentType('')
    setExperienceLevel('')
    setWorkplaceType('')
    setPage(1)
  }

  const hasActiveFilters = Boolean(search || location || employmentType || experienceLevel || workplaceType)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Explore Job Opportunities</h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover verified openings across top engineering, design, and product teams.
          </p>
        </div>

        {/* Search & Location Bar */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Keyword Search */}
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, skill, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#146BFF] focus:outline-none focus:ring-4 focus:ring-blue-50 transition"
            />
          </div>

          {/* Location Search */}
          <div className="md:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, country, or location..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#146BFF] focus:outline-none focus:ring-4 focus:ring-blue-50 transition"
            />
          </div>

          {/* Submit Search */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              Search Jobs
            </button>
          </div>
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          {/* Workplace Type */}
          <select
            value={workplaceType}
            onChange={(e) => setWorkplaceType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#146BFF]"
          >
            <option value="">All Workplace Types</option>
            {Object.values(EWorkplaceType).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Employment Type */}
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#146BFF]"
          >
            <option value="">All Employment Types</option>
            {Object.values(EEmploymentType).map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>

          {/* Experience Level */}
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#146BFF]"
          >
            <option value="">All Experience Levels</option>
            {Object.values(EExperienceLevel).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-[#146BFF] hover:underline px-2 py-1"
            >
              Reset Filters ✕
            </button>
          )}
        </div>
      </div>

      {/* Errors */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-800 flex items-center gap-2.5 animate-fadeIn">
          <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Jobs Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <LoadingSpinner />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900">No jobs match your search criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or exploring different workplace and employment categories.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-2 px-4 py-2 bg-blue-50 text-[#146BFF] text-xs font-semibold rounded-xl hover:bg-blue-100 transition"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs">
            <Pagination
              pagination={pagination}
              onPageChange={(newPage) => fetchJobs(newPage)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
