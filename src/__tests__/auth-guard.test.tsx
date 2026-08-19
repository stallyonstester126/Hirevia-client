import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import AuthGuard from '../components/AuthGuard'
import { useAuth } from '../context/AuthContext'
import { EUserRoles, IUser } from '../types'

// Mock useAuth context
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock next/navigation
const mockReplace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

describe('AuthGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading spinner when auth status is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      register: vi.fn(),
      confirmRegistration: vi.fn(),
      logout: vi.fn(),
      clearAuth: vi.fn(),
    })

    render(
      <AuthGuard allowedRole={EUserRoles.SEEKER}>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect unauthenticated users to /login', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      confirmRegistration: vi.fn(),
      logout: vi.fn(),
      clearAuth: vi.fn(),
    })

    render(
      <AuthGuard allowedRole={EUserRoles.SEEKER}>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(mockReplace).toHaveBeenCalledWith('/login')
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect users with wrong role to their own dashboard (SEEKER -> COMPANY)', () => {
    const seekerUser: IUser = {
      _id: '123',
      name: 'Seeker User',
      email: 'seeker@example.com',
      phoneNumber: '123456789',
      role: EUserRoles.SEEKER,
      status: { status: true, timestamp: '' },
      consent: true,
      createdAt: '',
      updatedAt: '',
    }

    vi.mocked(useAuth).mockReturnValue({
      user: seekerUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      confirmRegistration: vi.fn(),
      logout: vi.fn(),
      clearAuth: vi.fn(),
    })

    render(
      <AuthGuard allowedRole={EUserRoles.COMPANY}>
        <div>Company Portal Content</div>
      </AuthGuard>
    )

    expect(mockReplace).toHaveBeenCalledWith('/seeker')
    expect(screen.queryByText('Company Portal Content')).not.toBeInTheDocument()
  })

  it('should render children if user role matches allowedRole', () => {
    const seekerUser: IUser = {
      _id: '123',
      name: 'Seeker User',
      email: 'seeker@example.com',
      phoneNumber: '123456789',
      role: EUserRoles.SEEKER,
      status: { status: true, timestamp: '' },
      consent: true,
      createdAt: '',
      updatedAt: '',
    }

    vi.mocked(useAuth).mockReturnValue({
      user: seekerUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      confirmRegistration: vi.fn(),
      logout: vi.fn(),
      clearAuth: vi.fn(),
    })

    render(
      <AuthGuard allowedRole={EUserRoles.SEEKER}>
        <div>Seeker Protected Content</div>
      </AuthGuard>
    )

    expect(screen.getByText('Seeker Protected Content')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
