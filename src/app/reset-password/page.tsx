'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import LoadingSpinner from '@/components/LoadingSpinner'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const urlToken = searchParams.get('token') || ''
  const urlCode = searchParams.get('code') || ''

  // Step state: 1 = Enter OTP, 2 = Set New Password, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [token, setToken] = useState(urlToken)
  const [code, setCode] = useState(urlCode)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Step 1: Verify 6-digit OTP Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    const cleanCode = code.trim()
    if (!cleanCode || cleanCode.length !== 6) {
      setValidationError('Please enter a valid 6-digit verification code.')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiClient.post<any>('/verify-reset-code', { code: cleanCode })
      if (res.success) {
        setStep(2)
      } else {
        setValidationError(res.message || 'Invalid verification code. Please check your email or request a new one.')
      }
    } catch (err: any) {
      setValidationError(err.message || 'Verification code is invalid or has expired. Please request a new code.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Set New Password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (!password) {
      setValidationError('Please enter your new password.')
      return
    }

    // Password validation: min 8, max 24, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
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
      const payload: Record<string, any> = {
        newPassword: password,
      }
      if (code) payload.code = code.trim()
      if (token) payload.token = token.trim()

      const res = await apiClient.post<any>('/reset-password', payload)

      if (res.success) {
        setSuccessMsg(res.message || 'Your password has been reset successfully!')
        setStep(3)
      } else {
        setValidationError(res.message || 'Failed to reset password. Please try again.')
      }
    } catch (err: any) {
      setValidationError(err.message || 'Failed to reset password. The code or link may have expired.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full space-y-8 bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative z-10 text-center">
      {/* STEP 1: Enter & Verify 6-digit OTP code */}
      {step === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5 shadow-inner">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enter Verification Code
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Enter the 6-digit OTP code sent to your email address.
            </p>
          </div>

          {validationError && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-sm text-red-400 text-left flex items-start gap-3 animate-fadeIn">
              <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{validationError}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleVerifyCode}>
            <div className="text-left space-y-1.5">
              <label htmlFor="code" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider text-center">
                6-Digit OTP Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                maxLength={6}
                autoFocus
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="appearance-none block w-full px-4 py-3.5 bg-slate-950/60 border border-slate-700/80 rounded-xl placeholder-slate-500 text-white font-mono text-center tracking-[0.35em] text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-inner"
                placeholder="123456"
              />
              <p className="text-[11px] text-slate-400 text-center pt-1">
                Please check your inbox or spam folder for your 6-digit code.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isLoading || code.trim().length !== 6}
                className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all duration-150 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <LoadingSpinner /> : 'Verify Code →'}
              </button>

              <Link
                href="/forgot-password"
                className="w-full flex items-center justify-center py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Request a new code
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Modal / Screen to Enter New Password */}
      {step === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 shadow-inner">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full mb-2">
              <span>✓ Code Verified</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Create New Password
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Enter and confirm your new secure password.
            </p>
          </div>

          {validationError && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-sm text-red-400 text-left flex items-start gap-3 animate-fadeIn">
              <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{validationError}</span>
            </div>
          )}

          <form className="space-y-4 text-left" onSubmit={handleSetNewPassword}>
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm shadow-inner pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
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
                8-24 characters with uppercase, lowercase, number, and symbol.
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
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
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
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

            <div className="space-y-3 pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all duration-150 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <LoadingSpinner /> : 'Save New Password & Finish →'}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setValidationError(''); }}
                className="w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
              >
                ← Back to verification code
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: Success Confirmation */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl text-left space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-white text-lg">Password Changed Successfully!</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              {successMsg || 'Your new password is now active. You can immediately sign in to your Hirevia account.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all duration-150"
            >
              Sign In to Your Account →
            </Link>
          </div>
        </div>
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

