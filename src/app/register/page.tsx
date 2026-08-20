'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../../context/AuthContext'
import { EUserRoles } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function RegisterPage() {
  const { register, confirmRegistration } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<'register' | 'verify' | 'verified'>('register')
  const [tokenForVerification, setTokenForVerification] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<EUserRoles>(EUserRoles.SEEKER)
  const [consent, setConsent] = useState(false)

  const [validationError, setValidationError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [enteredCode, setEnteredCode] = useState('')

  const handleGoogleSignUp = () => {
    setIsGoogleLoading(true)
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1'
    const baseApiUrl = rawApiUrl.endsWith('/v1')
      ? rawApiUrl
      : `${rawApiUrl.replace(/\/+$/, '')}/v1`
    window.location.href = `${baseApiUrl}/auth/google?role=${role}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
    setSubmitError('')
    setSuccessMsg('')

    // 1. Name validation
    if (!name || name.trim().length < 2 || name.trim().length > 72) {
      setValidationError('Name must be between 2 and 72 characters.')
      return
    }

    // 2. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.')
      return
    }

    // 3. Phone validation
    const cleanPhone = phoneNumber.replace(/\+/g, '').trim()
    if (!cleanPhone || cleanPhone.length < 4 || cleanPhone.length > 20) {
      setValidationError('Phone number (excluding +) must be between 4 and 20 digits.')
      return
    }

    // 4. Password validation: strictly 8 to 16 characters matching backend regex
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/
    if (!passwordRegex.test(password)) {
      setValidationError(
        'Password must be 8-16 characters long, contain at least one uppercase letter, one lowercase letter, one digit, one special character, and no spaces.'
      )
      return
    }

    // 5. Consent validation
    if (!consent) {
      setValidationError('You must consent to proceed.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phoneNumber: cleanPhone,
        password,
        role,
        consent,
      }
      
      const response = await register(payload)
      if (response.success && response.data?.token) {
        setTokenForVerification(response.data.token)
        setSuccessMsg(
          'Registration successful! A 6-digit confirmation code has been sent to your email.'
        )
        setStep('verify')
      } else if (response.success) {
        // Fallback in case token is missing in response
        setSuccessMsg(
          'Registration successful! Please check your email for the confirmation link.'
        )
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Registration failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
    setSubmitError('')
    setSuccessMsg('')

    if (!enteredCode || enteredCode.trim().length !== 6) {
      setValidationError('Please enter a valid 6-digit verification code.')
      return
    }

    setIsSubmitting(true)
    try {
      await confirmRegistration(tokenForVerification, enteredCode.trim())
      setSuccessMsg('Account confirmed successfully! Redirecting you to login...')
      setStep('verified')
      setTimeout(() => {
        router.push('/login')
      }, 2500)
    } catch (err: any) {
      setSubmitError(err.message || 'Verification failed. The code might be expired or invalid.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EEF4FF] via-[#F4F8FF] to-[#E5EEFC] p-4 sm:p-6 lg:p-8">
      {/* Centered Two-Column Card */}
      <div className="w-full max-w-[1020px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(20,107,255,0.12)] border border-slate-100/90 overflow-hidden flex flex-col md:flex-row min-h-[680px] transition-all duration-300">
        
        {/* ================= LEFT SIDE: BRANDING & FEATURES ================= */}
        <div className="w-full md:w-[42%] bg-gradient-to-b from-[#F0F6FF] via-[#EBF3FE] to-[#DFECFD] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-blue-100/60">
          
          {/* Subtle Decorative Elements */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M-50 180 C 120 250, 180 90, 420 280" stroke="#146BFF" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M-80 320 C 60 400, 240 200, 480 400" stroke="#146BFF" strokeWidth="1" />
              <circle cx="340" cy="90" r="100" stroke="#146BFF" strokeWidth="1" opacity="0.2" />
            </svg>
          </div>

          {/* Top Brand & Header */}
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#146BFF] flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-white font-black text-lg leading-none">H</span>
              </div>
              <span className="font-extrabold text-slate-900 text-xl tracking-wider">HIREVIA</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Create your <br className="hidden sm:inline" />
                <span className="text-[#146BFF]">account</span>
              </h1>
              <p className="text-slate-500 text-sm sm:text-base">
                Join Hirevia and start your journey with us
              </p>
            </div>
          </div>

          {/* Center Visual 3D Asset */}
          <div className="relative z-10 py-5 sm:py-6 flex items-center justify-center">
            <div className="relative w-full max-w-[240px] sm:max-w-[270px] aspect-[4/3] flex items-center justify-center">
              <Image
                src="/icon/login.jpg"
                alt="Hirevia Recruitment Platform Illustration"
                width={320}
                height={240}
                className="w-full h-auto object-contain drop-shadow-[0_12px_24px_rgba(20,107,255,0.15)] select-none rounded-2xl"
                priority
              />
            </div>
          </div>

          {/* 3 Value Propositions */}
          <div className="relative z-10 space-y-3 pt-2">
            <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-blue-100/60 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#146BFF] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700">Find the best job opportunities</span>
            </div>

            <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-blue-100/60 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#146BFF] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700">Track your applications easily</span>
            </div>

            <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-blue-100/60 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#146BFF] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700">Get hired faster with Hirevia</span>
            </div>
          </div>

        </div>

        {/* ================= RIGHT SIDE: FORM CONTENT ================= */}
        <div className="w-full md:w-[58%] bg-white p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-[420px] w-full mx-auto space-y-5">
            
            {step === 'register' && (
              <>
                {/* Header Switcher */}
                <div className="flex items-center justify-end">
                  <p className="text-xs sm:text-sm text-slate-500">
                    Or{' '}
                    <Link href="/login" className="font-semibold text-[#146BFF] hover:text-blue-700 hover:underline transition">
                      sign in
                    </Link>{' '}
                    to your account
                  </p>
                </div>

                {/* Success, Validation and Submit Alerts */}
                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-start gap-2.5 animate-fadeIn" role="alert">
                    <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{successMsg}</span>
                  </div>
                )}

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

                {/* Main Registration Form */}
                <form className="space-y-3.5" onSubmit={handleSubmit}>
                  
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label htmlFor="full-name" className="block text-xs font-semibold text-slate-700">
                      Full Name
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        id="full-name"
                        name="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition duration-150 ease-in-out"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* Email address */}
                  <div className="space-y-1">
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
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition duration-150 ease-in-out"
                        placeholder="stallyons.tester125@gmail.com"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label htmlFor="phone-number" className="block text-xs font-semibold text-slate-700">
                      Phone Number
                    </label>
                    <div className="relative rounded-xl shadow-sm flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-medium text-slate-600 gap-1 border-r border-slate-200 pr-2 my-1.5">
                        <span>🇺🇸</span>
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <input
                        id="phone-number"
                        name="phoneNumber"
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="block w-full pl-16 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition duration-150 ease-in-out"
                        placeholder="+1 555 555 1234"
                      />
                    </div>
                  </div>

                  {/* I want to join as a */}
                  <div className="space-y-1">
                    <label htmlFor="role" className="block text-xs font-semibold text-slate-700">
                      I want to join as a
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <select
                        id="role"
                        name="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as EUserRoles)}
                        className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition duration-150 ease-in-out appearance-none cursor-pointer"
                      >
                        <option value={EUserRoles.SEEKER}>Job Seeker</option>
                        <option value={EUserRoles.COMPANY}>Company / Recruiter</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
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
                    <p className="text-[11px] text-slate-400 pt-0.5 leading-tight">
                      Must be 8-16 characters, include uppercase, lowercase, number and special character.
                    </p>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      id="consent"
                      name="consent"
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 text-[#146BFF] focus:ring-[#146BFF] border-slate-300 rounded cursor-pointer"
                    />
                    <label htmlFor="consent" className="text-xs text-slate-600 cursor-pointer select-none">
                      I agree to the <span className="text-[#146BFF] font-semibold hover:underline">terms</span> and consent to process my data
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-label="Register and Create Account"
                      className="group relative w-full flex items-center justify-center py-3 px-5 border border-transparent text-sm font-semibold rounded-xl text-white bg-[#146BFF] hover:bg-[#0E5CE8] active:bg-[#0D55D8] focus:outline-none focus:ring-4 focus:ring-blue-100 shadow-md shadow-blue-500/20 transition-all duration-150 ease-in-out disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Registering...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          Create Account
                          <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
                        </span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Divider */}
                <div className="relative my-4">
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
                    onClick={handleGoogleSignUp}
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
              </>
            )}

            {/* ================= STEP 2: VERIFICATION CODE ================= */}
            {step === 'verify' && (
              <div className="space-y-6 text-left py-4">
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Verify Your Email
                  </h2>
                  <p className="text-sm text-slate-500">
                    We sent a 6-digit confirmation code to <span className="font-semibold text-slate-900">{email}</span>.
                  </p>
                </div>

                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-start gap-2.5 animate-fadeIn" role="alert">
                    <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{successMsg}</span>
                  </div>
                )}

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

                <form onSubmit={handleVerifyCode} className="space-y-5 pt-2">
                  <div className="space-y-1.5">
                    <label htmlFor="otp-code" className="block text-xs font-semibold text-slate-700">
                      Verification Code
                    </label>
                    <input
                      id="otp-code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-2xl tracking-[0.4em] font-mono font-bold py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#146BFF] focus:ring-4 focus:ring-blue-50 transition duration-150"
                      required
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center py-3 px-5 border border-transparent text-sm font-semibold rounded-xl text-white bg-[#146BFF] hover:bg-[#0E5CE8] active:bg-[#0D55D8] focus:outline-none focus:ring-4 focus:ring-blue-100 shadow-md shadow-blue-500/20 transition-all duration-150 disabled:opacity-60 cursor-pointer"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify Code →'}
                    </button>
                  </div>
                </form>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('register')
                      setValidationError('')
                      setSubmitError('')
                      setSuccessMsg('')
                    }}
                    className="text-xs sm:text-sm font-semibold text-[#146BFF] hover:text-blue-700 hover:underline transition cursor-pointer"
                  >
                    ← Back to edit info
                  </button>
                </div>
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  * Note: Check your inbox and spam folder for the verification code.
                </p>
              </div>
            )}

            {/* ================= STEP 3: SUCCESSFUL CONFIRMATION ================= */}
            {step === 'verified' && (
              <div className="py-10 space-y-5 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 shadow-sm shadow-emerald-500/20 animate-bounce">
                  <svg className="h-9 w-9 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Email Confirmed! 🎉</h2>
                  <p className="text-sm text-slate-500 max-w-[320px] mx-auto">
                    Your account has been successfully verified. Redirecting you to the login page...
                  </p>
                </div>
                <div className="pt-4 flex justify-center">
                  <LoadingSpinner />
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
