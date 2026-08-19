import React from 'react'
import { EApplicationStatus, EJobStatus } from '../types'

interface StatusBadgeProps {
  status: EApplicationStatus | EJobStatus | string
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold'

  switch (status) {
    case EApplicationStatus.SUBMITTED:
      return (
        <span className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
          Submitted
        </span>
      )
    case EApplicationStatus.UNDER_REVIEW:
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
          Under Review
        </span>
      )
    case EApplicationStatus.SHORTLISTED:
      return (
        <span className={`inline-flex items-center rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></span>
          Shortlisted
        </span>
      )
    case EApplicationStatus.INTERVIEW:
      return (
        <span className={`inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
          Interview
        </span>
      )
    case EApplicationStatus.HIRED:
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
          Hired 🎉
        </span>
      )
    case EApplicationStatus.REJECTED:
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
          Rejected
        </span>
      )
    case EApplicationStatus.WITHDRAWN:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
          Withdrawn
        </span>
      )
    case EJobStatus.PUBLISHED:
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
          Active
        </span>
      )
    case EJobStatus.DRAFT:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
          Draft
        </span>
      )
    case EJobStatus.CLOSED:
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
          Closed
        </span>
      )
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          {status}
        </span>
      )
  }
}
