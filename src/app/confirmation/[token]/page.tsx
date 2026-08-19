'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'
import LoadingSpinner from '../../../components/LoadingSpinner'

interface ConfirmationPageProps {
  params: Promise<{
    token: string
  }>
}

export default function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { confirmRegistration } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const resolvedParams = use(params)
  const token = resolvedParams.token
  const code = searchParams.get('code')

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'prompt_code'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [enteredCode, setEnteredCode] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('Invalid token link.')
      return
    }

    if (!code) {
      setStatus('prompt_code')
      return
    }

    const performConfirmation = async () => {
      try {
        setStatus('loading')
        await confirmRegistration(token, code)
        setStatus('success')
      } catch (err: any) {
        setStatus('error')
        setErrorMsg(err.message || 'Confirmation failed. The link might be expired or invalid.')
      }
    }

    performConfirmation()
  }, [token, code, confirmRegistration])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enteredCode || enteredCode.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit confirmation code.')
      setStatus('prompt_code')
      return
    }

    try {
      setStatus('loading')
      await confirmRegistration(token, enteredCode.trim())
      setStatus('success')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Confirmation failed. The code might be expired or invalid.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
        {status === 'loading' && (
          <div className="py-8">
            <LoadingSpinner />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">Confirming your account...</h2>
            <p className="mt-2 text-sm text-gray-500">Please wait while we confirm your email registration.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8 space-y-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Email Confirmed!</h2>
            <p className="text-sm text-gray-600">
              Your account has been successfully verified. You can now log in to access your dashboard.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-indigo-600 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {status === 'prompt_code' && (
          <div className="py-8 space-y-4 text-left animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Verify Your Account</h2>
            <p className="text-sm text-gray-500 text-center">
              Please enter the 6-digit verification code sent to your email.
            </p>
            {errorMsg && (
              <p className="text-sm text-red-600 font-medium text-center bg-red-50 p-2.5 rounded-lg border border-red-100">{errorMsg}</p>
            )}
            <form onSubmit={handleManualSubmit} className="space-y-4 pt-2">
              <div>
                <label htmlFor="code-input" className="sr-only">Verification Code</label>
                <input
                  id="code-input"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl tracking-widest font-bold py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-indigo-600 transition-colors"
              >
                Verify Code
              </button>
            </form>
            <div className="pt-2 text-center">
              <Link href="/register" className="text-sm text-blue-600 hover:underline">
                Back to Registration
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8 space-y-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Confirmation Failed</h2>
            <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
            <p className="text-xs text-gray-500">
              Please try manually entering your code, or check that your confirmation link matches your registration details.
            </p>
            <div className="pt-4 flex flex-col space-y-2">
              <button
                onClick={() => {
                  setErrorMsg('')
                  setStatus('prompt_code')
                }}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-indigo-600 transition-colors"
              >
                Enter Code Manually
              </button>
              <Link
                href="/register"
                className="w-full flex justify-center py-2.5 px-4 border border-blue-300 border text-sm font-semibold rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors"
              >
                Back to Registration
              </Link>
            </div>
            <p className="text-xs text-gray-400 pt-2 text-center">
              * Note: Resending confirmation emails is not supported by the server API. If your code is expired, you must re-register.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
