'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!email || !email.trim()) {
      setErrorMsg('Please enter your email address.')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiClient.post<any>('/forgot-password', { email: email.trim().toLowerCase() })
      if (res.success) {
        setSuccessMsg(res.message || 'Password reset instructions have been sent to your email.')
        setSubmitted(true)
      } else {
        setErrorMsg(res.message || 'Unable to send password reset email. Please try again.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please check your email and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setErrorMsg('')
    setSuccessMsg('')
    setIsLoading(true)
    try {
      const res = await apiClient.post<any>('/forgot-password', { email: email.trim().toLowerCase() })
      if (res.success) {
        setSuccessMsg('Reset email has been resent! Please check your inbox and spam folder.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative z-10 text-center">
        {/* Header */}
        <div>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5 shadow-inner">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Forgot Password
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter your email and we&apos;ll send you a secure link to reset your password.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-sm text-red-400 text-left flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/30 p-5 rounded-2xl text-left space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Reset Email Dispatched</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                We sent password reset instructions to <strong className="text-white">{email}</strong>.
              </p>
              <p className="text-xs text-slate-400 pt-1">
                Please check your inbox (and spam/junk folder) and click the link or follow the instructions to set your new password.
              </p>
            </div>

            {successMsg && (
              <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                {successMsg}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Link
                href={`/reset-password?email=${encodeURIComponent(email)}`}
                className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all duration-150"
              >
                Enter OTP Code & Reset Password →
              </Link>

              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3 px-4 border border-slate-700 hover:border-slate-600 text-sm font-semibold rounded-xl text-slate-200 bg-slate-800 hover:bg-slate-750 transition-all duration-150 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <LoadingSpinner /> : 'Resend Reset Email'}
              </button>

              <button
                type="button"
                onClick={() => { setSubmitted(false); setEmail(''); }}
                className="w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
              >
                Try a different email address
              </button>

              <Link
                href="/login"
                className="w-full flex items-center justify-center py-3 px-4 border border-slate-800 text-sm font-semibold rounded-xl text-slate-300 hover:text-white bg-slate-950/40 hover:bg-slate-800/60 transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="text-left">
              <label htmlFor="email-address" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Account Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm shadow-inner"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all duration-150 disabled:opacity-50"
              >
                {isLoading ? <LoadingSpinner /> : 'Send Reset Instructions'}
              </button>
              <Link
                href="/login"
                className="w-full flex items-center justify-center py-3 px-4 border border-slate-800 text-sm font-semibold rounded-xl text-slate-300 hover:text-white bg-slate-950/40 hover:bg-slate-800/60 transition-colors"
              >
                Cancel and Return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

