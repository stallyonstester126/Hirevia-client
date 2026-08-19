'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    // Password validation using backend Joi regex
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/
    if (!passwordRegex.test(password)) {
      setValidationError(
        'Password must be 8-16 characters long, contain at least one uppercase letter, one lowercase letter, one digit, one special character, and no spaces.'
      )
      return
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.')
      return
    }

    // Mock successful reset
    setSuccess(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Choose New Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Set your new credentials (Mocked Flow)
          </p>
        </div>

        {validationError && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-sm text-amber-700 text-left">
            {validationError}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded text-sm text-green-700 text-left">
              <strong>Password Reset Simulated!</strong> Your password has been successfully reset on the client mockup.
              <br />
              <span className="text-xs mt-1 block text-green-500">
                (Note: Reset password endpoint is not yet implemented on the backend. This is a mockup of the frontend flow.)
              </span>
            </div>
            <div className="pt-4">
              <Link
                href="/login"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-indigo-600 transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 text-left">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-indigo-600 transition-all duration-150 ease-in-out"
              >
                Reset Password
              </button>
              <Link
                href="/login"
                className="w-full flex justify-center py-2.5 px-4 border border-gray-300 border text-sm font-semibold rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
