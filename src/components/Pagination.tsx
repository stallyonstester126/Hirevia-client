import React from 'react'
import { IPagination } from '../types'

interface PaginationProps {
  pagination: IPagination
  onPageChange: (page: number) => void
}

export default function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, total } = pagination

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      <p className="text-sm text-slate-500">
        Showing page <span className="font-semibold text-slate-900">{page}</span> of{' '}
        <span className="font-semibold text-slate-900">{totalPages}</span> ({total} total results)
      </p>

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
        >
          Previous
        </button>

        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
            let pageNum = idx + 1
            if (totalPages > 5) {
              if (page > 3 && page < totalPages - 2) {
                pageNum = page - 2 + idx
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + idx
              }
            }

            const isActive = pageNum === page

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`w-9 h-9 text-sm font-semibold rounded-xl transition ${
                  isActive
                    ? 'bg-[#146BFF] text-white shadow-sm shadow-blue-500/25'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
        >
          Next
        </button>
      </div>
    </div>
  )
}
