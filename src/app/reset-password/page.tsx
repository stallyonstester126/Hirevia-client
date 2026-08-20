'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import LoadingSpinner from '@/components/LoadingSpinner'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const code = searchParams.get('code') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (!token) {
      setValidationError('Invalid or missing password reset token. Please request a new link.')
      return
    }

    if (!password) {
      setValidationError('Please enter your new password.')
      return
    }

    // Password validation using regex: min 8, max 24, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,24}$/
    if (!passwordRegex.test(password)) {
      setValidationError(
        'Password must be 8-24 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (no spaces).'
      )
      return
    }

    if (password !== confirmPassword) {
      setValidationError('New password and confirmation password do not match.')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiClient.post<any>('/reset-password', {
        token,
        newPassword: password,
        ...(code ? { code } : {})
      })

      if (res.success) {
        setSuccessMsg(res.message || 'Your password has been reset successfully!')
        setSuccess(true)
      } else {
        setValidationError(res.message || 'Failed to reset password. Please try again or request a new reset link.')
      }
    } catch (err: any) {
      setValidationError(err.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token && !success) {
    return (
      <div className="max-w-md w-full space-y-6 bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Missing Reset Link</h2>
        <p className="text-sm text-slate-400">
          No valid password reset token was provided. Please request a new password reset link.
        </p>
        <div className="pt-2 space-y-3">
          <Link
            href="/forgot-password"
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all"
          >
            Request Password Reset
          </Link>
          <Link
            href="/login"
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800 transition-colors"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md w-full space-y-8 bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative z-10 text-center">
      {/* Header */}
      <div>
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5 shadow-inner">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create New Password
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter a strong new password for your Hirevia account.
        </p>
      </div>

      {validationError && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-sm text-red-400 text-left flex items-start gap-3">
          <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{validationError}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-white text-base">Password Updated!</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              {successMsg || 'Your password has been successfully reset. You can now use your new credentials to log in.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all duration-150"
            >
              Sign In with New Password →
            </Link>
          </div>
        </div>
      ) : (
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4 text-left">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm shadow-inner pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Must be 8-24 characters with uppercase, lowercase, number, and symbol.
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm shadow-inner pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all duration-150 disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner /> : 'Set New Password'}
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
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="py-20 flex justify-center items-center">
            <LoadingSpinner />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}

