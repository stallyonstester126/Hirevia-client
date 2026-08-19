'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!email) {
      setErrorMsg('Email address is required.')
      return
    }

    // Mock response since backend does not support forgot-password yet
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we will send you a reset link (Mocked Flow)
          </p>
        </div>

        {errorMsg && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-sm text-amber-700 text-left">
            {errorMsg}
          </div>
        )}

        {submitted ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-sm text-blue-700 text-left">
              <strong>Simulated Email Sent!</strong> We have simulated sending a password reset link to <strong>{email}</strong>. 
              <br />
              <span className="text-xs mt-1 block text-blue-500">
                (Note: Forgot password endpoint is not yet implemented on the backend. This is a mockup of the frontend flow.)
              </span>
            </div>
            <div className="pt-4 space-y-2">
              <Link
                href="/reset-password?token=mocked-reset-token"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-indigo-600 transition-colors"
              >
                Go to Reset Password Form
              </Link>
              <Link
                href="/login"
                className="w-full flex justify-center py-2.5 px-4 border border-gray-300 border text-sm font-semibold rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 text-left mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-indigo-600 transition-all duration-150 ease-in-out"
              >
                Send Reset Link
              </button>
              <Link
                href="/login"
                className="w-full flex justify-center py-2.5 px-4 border border-gray-300 border text-sm font-semibold rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
