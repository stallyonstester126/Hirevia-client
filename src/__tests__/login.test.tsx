import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import LoginPage from '../app/login/page'
import { useAuth } from '../context/AuthContext'

// Mock useAuth context
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}))

describe('LoginPage Component', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      register: vi.fn(),
      confirmRegistration: vi.fn(),
      logout: vi.fn(),
      clearAuth: vi.fn(),
    })
  })

  it('renders login form inputs and submit button', () => {
    render(<LoginPage />)

    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument()
  })

  it('displays validation error if email is missing', async () => {
    render(<LoginPage />)

    fireEvent.submit(screen.getByRole('button', { name: /Sign in/i }).closest('form')!)

    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('displays validation error if email is invalid', async () => {
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'invalid-email' } })
    fireEvent.submit(screen.getByRole('button', { name: /Sign in/i }).closest('form')!)

    expect(await screen.findByText(/Please enter a valid email address/i)).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('displays validation error if password is missing', async () => {
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } })
    fireEvent.submit(screen.getByRole('button', { name: /Sign in/i }).closest('form')!)

    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('submits form payload successfully when inputs are valid', async () => {
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'validPassword123!' } })
    fireEvent.submit(screen.getByRole('button', { name: /Sign in/i }).closest('form')!)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'validPassword123!',
      })
    })
  })
})
