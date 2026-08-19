import React from 'react'
import Link from 'next/link'

export default function VerifyEmailInstructionsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
        <p className="text-sm text-gray-600">
          We have sent an onboarding confirmation link to your email address. Please open it and click the confirmation link to activate your account.
        </p>
        <p className="text-xs text-gray-500">
          Note: If you do not see the email, please check your spam or junk folder.
        </p>
        <div className="pt-4 space-y-2">
          <Link
            href="/login"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-indigo-600 transition-colors"
          >
            Go to Login
          </Link>
          <Link
            href="/register"
            className="w-full flex justify-center py-2.5 px-4 border border-gray-300 border text-sm font-semibold rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-colors"
          >
            Back to Register
          </Link>
        </div>
      </div>
    </div>
  )
}
