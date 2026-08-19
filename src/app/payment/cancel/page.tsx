'use client'

import React from 'react'
import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-xs">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold text-slate-900">Payment Canceled</h1>
          <p className="text-sm text-slate-500">
            The Stripe checkout process was cancelled. Your draft job posting was saved and can be published whenever you are ready.
          </p>
        </div>

        <div className="pt-3 space-y-2">
          <Link
            href="/company/jobs"
            className="block w-full py-3 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition text-center"
          >
            Return to Job Postings →
          </Link>
          <Link
            href="/company"
            className="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition text-center"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
