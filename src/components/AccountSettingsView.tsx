'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../lib/api-client'
import { IUser } from '../types'
import LoadingSpinner from './LoadingSpinner'

interface AccountSettingsViewProps {
  role: 'COMPANY' | 'SEEKER'
}

const getPhoneString = (phone: any): string => {
  if (!phone) return ''
  if (typeof phone === 'string') return phone
  return phone.internationalNumber || ''
}

export default function AccountSettingsView({ role }: AccountSettingsViewProps) {
  const { user } = useAuth()
  const [currentUser, setCurrentUser] = useState<IUser | null>(user)
  const [loading, setLoading] = useState(false)

  // Profile Edit State
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(getPhoneString(user?.phoneNumber))
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [isChangingPass, setIsChangingPass] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    fetchMe()
  }, [])

  const fetchMe = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<IUser>('/user/me')
      if (res.success && res.data) {
        setCurrentUser(res.data)
        setName(res.data.name || '')
        setPhone(getPhoneString(res.data.phoneNumber))
      }
    } catch {
      // Use auth context fallback
      if (user) {
        setCurrentUser(user)
        setName(user.name || '')
        setPhone(getPhoneString(user.phoneNumber))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || name.trim().length < 2) {
      setProfileError('Full Name must be at least 2 characters.')
      return
    }

    setIsUpdatingProfile(true)
    setProfileSuccess('')
    setProfileError('')

    try {
      const payload: any = { name: name.trim() }
      if (phone.trim()) {
        payload.phoneNumber = {
          isoCode: 'US',
          countryCode: '+1',
          internationalNumber: phone.trim(),
        }
      }

      const res = await apiClient.patch<IUser>('/user/profile', payload)
      if (res.success && res.data) {
        setCurrentUser(res.data)
        setProfileSuccess('Account profile details updated successfully!')
        setTimeout(() => setProfileSuccess(''), 4000)
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile.')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const activeUser = currentUser || user
  const isGoogleUser = activeUser?.authProvider === 'google'

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSuccess('')
    setPasswordError('')

    if (!isGoogleUser && !currentPassword) {
      setPasswordError('Please enter your current password.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.')
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(newPassword)) {
      setPasswordError(
        'New password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.'
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.')
      return
    }

    setIsChangingPass(true)
    try {
      const payload: any = { newPassword }
      if (!isGoogleUser && currentPassword) {
        payload.currentPassword = currentPassword
      }
      const res = await apiClient.post('/user/change-password', payload)
      if (res.success) {
        setPasswordSuccess(
          isGoogleUser
            ? 'Account password has been set successfully! You can now log in using either Google or your email & password.'
            : 'Password has been changed successfully!'
        )
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordSuccess(''), 6000)
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password. Please try again.')
    } finally {
      setIsChangingPass(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#146BFF] bg-blue-50 px-2.5 py-0.5 rounded-full">
          {role === 'COMPANY' ? 'Employer Account' : 'Candidate Account'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
          Account & Security Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your login credentials, password security, and account preferences.
        </p>
      </div>

      {/* Account Info Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#146BFF] to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 uppercase">
              {activeUser?.name ? activeUser.name.charAt(0) : 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">{activeUser?.name || 'User'}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#146BFF] border border-blue-200">
                  {role === 'COMPANY' ? 'Employer Admin' : 'Job Candidate'}
                </span>
                {role === 'COMPANY' && activeUser?.subscriptionStatus === 'PAID' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Unlimited Plan Active ✓
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-mono">{activeUser?.email}</p>
            </div>
          </div>
        </div>

        {/* Readonly & Editable Meta */}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
            Profile Information
          </h3>

          {profileSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-center gap-2.5">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs sm:text-sm text-red-800 flex items-center gap-2.5">
              <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{profileError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1">
              <label htmlFor="accountName" className="block text-xs font-semibold text-slate-700">
                Full Name
              </label>
              <input
                id="accountName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition"
              />
            </div>

            {/* Login Email (Disabled / Readonly) */}
            <div className="space-y-1">
              <label htmlFor="accountEmail" className="block text-xs font-semibold text-slate-700">
                Login Email Address (Verified)
              </label>
              <input
                id="accountEmail"
                type="email"
                disabled
                value={activeUser?.email || ''}
                className="block w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-xs sm:text-sm cursor-not-allowed font-mono"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label htmlFor="accountPhone" className="block text-xs font-semibold text-slate-700">
                Contact Phone Number
              </label>
              <input
                id="accountPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition"
              />
            </div>

            {/* Account Role */}
            <div className="space-y-1">
              <label htmlFor="accountRole" className="block text-xs font-semibold text-slate-700">
                Account Role
              </label>
              <input
                id="accountRole"
                type="text"
                disabled
                value={activeUser?.role || role}
                className="block w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-xs sm:text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-5 py-2 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-60 cursor-pointer"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isGoogleUser ? 'Set Account Password' : 'Security & Password'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isGoogleUser
                ? 'You logged in with Google. You can set a password below to also enable email and password login.'
                : 'Update your account password. Ensure your password is at least 8 characters with letters, numbers, and special symbols.'}
            </p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-center gap-2.5 animate-fadeIn">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs sm:text-sm text-red-800 flex items-center gap-2.5 animate-fadeIn">
            <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          {/* Current Password (Shown only for non-Google accounts) */}
          {!isGoogleUser && (
            <div className="space-y-1">
              <label htmlFor="currentPassword" className="block text-xs font-semibold text-slate-700">
                Current Password *
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  {showCurrentPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div className="space-y-1">
            <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-700">
              {isGoogleUser ? 'Set Password *' : 'New Password *'}
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPass ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition pr-14"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                {showNewPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700">
              {isGoogleUser ? 'Confirm Password *' : 'Confirm New Password *'}
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#146BFF] focus:ring-3 focus:ring-blue-50 transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPass}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-60 cursor-pointer"
            >
              {isChangingPass
                ? isGoogleUser
                  ? 'Setting Password...'
                  : 'Updating Password...'
                : isGoogleUser
                ? 'Set Account Password'
                : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
