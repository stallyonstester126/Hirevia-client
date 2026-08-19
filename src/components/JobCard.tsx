import React from 'react'
import Link from 'next/link'
import { IJob, EWorkplaceType } from '../types'

interface JobCardProps {
  job: IJob
}

export default function JobCard({ job }: JobCardProps) {
  const companyName = typeof job.companyId === 'object' && job.companyId?.name
    ? job.companyId.name
    : 'Featured Company'

  const formattedSalary = job.salary
    ? `${job.salary.currency || 'USD'} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} / ${job.salary.period?.toLowerCase() || 'month'}`
    : null

  const workplaceBadgeColor = {
    [EWorkplaceType.REMOTE]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    [EWorkplaceType.HYBRID]: 'bg-purple-50 text-purple-700 border-purple-200',
    [EWorkplaceType.ONSITE]: 'bg-blue-50 text-blue-700 border-blue-200',
  }[job.workplaceType] || 'bg-slate-50 text-slate-700 border-slate-200'

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 hover:shadow-[0_12px_30px_-10px_rgba(20,107,255,0.12)] hover:border-blue-300 transition-all duration-200 flex flex-col justify-between">
      <div className="space-y-3.5">
        {/* Top badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {companyName}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${workplaceBadgeColor}`}>
              {job.workplaceType}
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {job.employmentType?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Title */}
        <div>
          <Link href={`/seeker/jobs/${job._id}`} className="block">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-[#146BFF] transition-colors line-clamp-1">
              {job.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.location?.city ? `${job.location.city}, ${job.location.country}` : 'Remote / Worldwide'}
          </p>
        </div>

        {/* Description snippet */}
        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {job.description}
        </p>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {job.skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="text-xs font-medium bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/60"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="text-xs font-medium text-slate-400 px-1.5 py-1">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer / CTA */}
      <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between gap-4">
        <div>
          {formattedSalary ? (
            <div>
              <span className="text-xs text-slate-400 block font-medium">Compensation</span>
              <span className="text-sm font-bold text-slate-900">{formattedSalary}</span>
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-500">Competitive salary</span>
          )}
        </div>

        <Link
          href={`/seeker/jobs/${job._id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition shadow-blue-500/20"
        >
          View Details
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
