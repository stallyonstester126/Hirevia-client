'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { EUserRoles } from '../../types'
import AuthGuard from '../../components/AuthGuard'
import ErrorBoundary from '../../components/ErrorBoundary'

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { name: 'Dashboard', href: '/company' },
    { name: 'Job Postings', href: '/company/jobs' },
    { name: 'Post a Job', href: '/company/jobs/new' },
    { name: 'Company Profile', href: '/company/profile' },
  ]

  const isActive = (href: string) => {
    if (href === '/company') return pathname === '/company'
    if (href === '/company/jobs/new') return pathname === '/company/jobs/new'
    if (href === '/company/jobs') {
      return pathname === '/company/jobs' || (pathname.startsWith('/company/jobs') && pathname !== '/company/jobs/new')
    }
    return pathname.startsWith(href)
  }

  return (
    <AuthGuard allowedRole={EUserRoles.COMPANY}>
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        {/* Top Header & Navigation */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 flex items-center justify-between">
              
              {/* Brand & Desktop Links */}
              <div className="flex items-center gap-8">
                <Link href="/company" className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#146BFF] flex items-center justify-center shadow-sm shadow-blue-500/20">
                    <span className="text-white font-black text-base leading-none">H</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xl tracking-wider">
                      HIRE<span className="text-[#146BFF]">VIA</span>
                    </span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Employer
                    </span>
                  </div>
                </Link>

                <nav className="hidden md:flex items-center space-x-1">
                  {navLinks.map((link) => {
                    const active = isActive(link.href)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition duration-150 ${
                          active
                            ? 'bg-blue-50 text-[#146BFF]'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {link.name}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* User info & Actions */}
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/company/jobs/new"
                  className="px-3.5 py-1.5 bg-[#146BFF] hover:bg-[#0E5CE8] text-white text-xs font-semibold rounded-xl shadow-xs transition shadow-blue-500/20"
                >
                  + Post a Job
                </Link>

                <Link
                  href="/company/account"
                  className="flex items-center gap-2.5 pl-2 border-l border-slate-200 hover:opacity-80 transition group"
                  title="View Account & Security Settings"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs uppercase group-hover:border-[#146BFF] transition">
                    {user?.name ? user.name.charAt(0) : 'C'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-none group-hover:text-[#146BFF] transition">{user?.name || 'Company'}</p>
                    <span className="text-[10px] font-medium text-slate-400">Employer Account →</span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="flex md:hidden items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
                  aria-label="Toggle Navigation Menu"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>

            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-fadeIn">
              {navLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                      active ? 'bg-blue-50 text-[#146BFF]' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              })}

              <Link
                href="/company/account"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Account & Security Settings
              </Link>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">{user?.name}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </AuthGuard>
  )
}
