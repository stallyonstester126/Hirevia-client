'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../../context/AuthContext'
import { EUserRoles } from '../../types'
import GoogleRoleModal from '../../components/GoogleRoleModal'

export default function LoginPage() {
  const { login, user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showGoogleRoleModal, setShowGoogleRoleModal] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const errorParam = params.get('error')
      if (errorParam) {
        setSubmitError(decodeURIComponent(errorParam))
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === EUserRoles.SEEKER) {
        router.replace('/seeker')
      } else if (user.role === EUserRoles.COMPANY) {
        router.replace('/company')
      }
    }
  }, [isAuthenticated, user, router])

  const handleGoogleBtnClick = () => {
    setShowGoogleRoleModal(true)
  }

  const handleRoleSelectedForGoogle = (selectedRole: EUserRoles) => {
    setShowGoogleRoleModal(false)
    setIsGoogleLoading(true)
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1'
    const baseApiUrl = rawApiUrl.endsWith('/v1')
      ? rawApiUrl
      : `${rawApiUrl.replace(/\/+$/, '')}/v1`
    window.location.href = `${baseApiUrl}/auth/google?role=${selectedRole}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
    setSubmitError('')

    // Basic Validation
    if (!email) {
      setValidationError('Email is required.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.')
      return
    }
    if (!password) {
      setValidationError('Password is required.')
      return
    }

    setIsSubmitting(true)
    try {
      await login({ email, password })
    } catch (err: any) {
      setSubmitError(err.message || 'Invalid email or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EEF4FF] via-[#F4F8FF] to-[#E5EEFC] p-4 sm:p-6 lg:p-8">
      {/* Centered Two-Column Card */}
      <div className="w-full max-w-[960px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(20,107,255,0.12)] border border-slate-100/90 overflow-hidden flex flex-col md:flex-row min-h-[620px] transition-all duration-300">
        
        {/* ================= LEFT SIDE: BRANDING & VISUAL ================= */}
        <div className="w-full md:w-[44%] bg-gradient-to-b from-[#0E5CE8] via-[#146BFF] to-[#0D55D8] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden text-white">
          
          {/* Subtle Background Decorative Graphic Overlays */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M-50 200 C 100 280, 200 120, 450 300 C 500 350, 550 450, 600 500" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
              <path d="M-100 350 C 50 420, 250 220, 500 450" stroke="white" strokeWidth="1" opacity="0.4" />
              <circle cx="350" cy="80" r="120" stroke="white" strokeWidth="1" opacity="0.15" />
            </svg>
          </div>

          {/* Decorative Dot Grid (Top Right) */}
          <div className="absolute top-8 right-8 pointer-events-none opacity-25">
            <div className="grid grid-cols-4 gap-2.5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
              ))}
            </div>
          </div>

          {/* Decorative Dot Grid (Bottom Left) */}
          <div className="absolute bottom-8 left-8 pointer-events-none opacity-20">
            <div className="grid grid-cols-4 gap-2.5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
              ))}
            </div>
          </div>

          {/* Header Brand Section */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md shadow-blue-900/20">
                <span className="text-[#146BFF] font-black text-lg leading-none">H</span>
              </div>
              <span className="font-extrabold text-white text-xl tracking-wider">HIREVIA</span>
            </div>

            <div className="space-y-2 pt-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Welcome back!
              </h1>
              <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed font-normal">
                Sign in to continue your journey with Hirevia
              </p>
            </div>
          </div>

          {/* Main 3D Visual Asset */}
          <div className="relative z-10 py-6 sm:py-8 flex items-center justify-center">
            <div className="relative w-full max-w-[280px] sm:max-w-[310px] aspect-[4/3] flex items-center justify-center">
              <Image
                src="/icon/login.jpg"
                alt="Hirevia Platform Illustration"
                width={360}
                height={270}
                className="w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.22)] select-none rounded-2xl"
                priority
              />
            </div>
          </div>

          {/* Footer note/spacer to balance layout */}
          <div className="relative z-10 text-xs text-blue-100/60 hidden md:block">
            Hirevia Recruitment & Job Search Platform
          </div>
        </div>

        {/* ================= RIGHT SIDE: LOGIN FORM ================= */}
        <div className="w-full md:w-[56%] bg-white p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-[380px] w-full mx-auto space-y-6">
            
            {/* Form Title & Subtitle */}
            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-slate-500 text-sm">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Error Alerts */}
            {validationError && (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs sm:text-sm text-amber-800 flex items-start gap-2.5 animate-fadeIn" role="alert">
                <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{validationError}</span>
              </div>
            )}

            {submitError && (
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs sm:text-sm text-red-800 flex items-start gap-2.5 animate-fadeIn" role="alert">
                <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{submitError}</span>
              </div>
            )}

            {/* Main Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <label htmlFor="email-address" className="block text-xs font-semibold text-slate-700">
                  Email address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition duration-150 ease-in-out"
                    placeholder="stallyons.tester125@gmail.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition duration-150 ease-in-out"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition focus:outline-none"
                    aria-label={showPassword ? 'Hide secret input' : 'Reveal secret input'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end pt-0.5">
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#146BFF] hover:text-blue-700 transition duration-150"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full flex items-center justify-center py-3 px-5 border border-transparent text-sm font-semibold rounded-xl text-white bg-[#146BFF] hover:bg-[#0E5CE8] active:bg-[#0D55D8] focus:outline-none focus:ring-4 focus:ring-blue-100 shadow-md shadow-blue-500/20 transition-all duration-150 ease-in-out disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Sign In
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
                    </span>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium">or continue with</span>
              </div>
            </div>

            {/* Continue with Google Button */}
            <div>
              <button
                type="button"
                onClick={handleGoogleBtnClick}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-200 hover:border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm shadow-sm transition duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <span className="flex items-center gap-2 text-slate-500">
                    <svg className="animate-spin h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Connecting to Google...
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </div>

            {/* Account Creation Footer */}
            <div className="pt-2 text-center">
              <p className="text-xs sm:text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-[#146BFF] hover:text-blue-700 hover:underline transition"
                >
                  Create an account
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Role Selection Modal for Google Sign-In */}
      <GoogleRoleModal
        isOpen={showGoogleRoleModal}
        onClose={() => setShowGoogleRoleModal(false)}
        onSelectRole={handleRoleSelectedForGoogle}
      />
    </div>
  )
}
