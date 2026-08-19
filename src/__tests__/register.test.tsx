import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RegisterPage from '../app/register/page'
import { useAuth } from '../context/AuthContext'
import { EUserRoles } from '../types'

// Mock useAuth context
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('RegisterPage Component', () => {
  const mockRegister = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: mockRegister,
      confirmRegistration: vi.fn(),
      logout: vi.fn(),
      clearAuth: vi.fn(),
    })
  })

  it('renders registration form inputs and select elements', () => {
    render(<RegisterPage />)

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/I want to join as a/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/I agree to the terms/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument()
  })

  it('displays validation error if name is too short', async () => {
    render(<RegisterPage />)

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'a' } })
    fireEvent.submit(screen.getByRole('button', { name: /Register/i }).closest('form')!)

    expect(await screen.findByText(/Name must be between 2 and 72 characters/i)).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('displays validation error if phone number digits are too short', async () => {
    render(<RegisterPage />)

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '12' } })
    fireEvent.submit(screen.getByRole('button', { name: /Register/i }).closest('form')!)

    expect(await screen.findByText(/Phone number \(excluding \+\) must be between 4 and 20 digits/i)).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('displays validation error if password fails complexity regex', async () => {
    render(<RegisterPage />)

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '15555551234' } })
    // Missing number and special char
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'shortPass' } })
    fireEvent.submit(screen.getByRole('button', { name: /Register/i }).closest('form')!)

    expect(
      await screen.findByText(/Password must be 8-16 characters long, contain at least one uppercase letter/i)
    ).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('displays validation error if consent checkbox is unchecked', async () => {
    render(<RegisterPage />)

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '15555551234' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Pass1234!' } })
    // Consent is false by default
    fireEvent.submit(screen.getByRole('button', { name: /Register/i }).closest('form')!)

    expect(await screen.findByText(/You must consent to proceed/i)).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('submits correctly structured registration payload when valid', async () => {
    mockRegister.mockResolvedValue({ success: true })
    render(<RegisterPage />)

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'john@example.com' } })
    // Prepend '+' to test stripping logic
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+15555551234' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Pass1234!' } })
    fireEvent.click(screen.getByLabelText(/I agree to the terms/i))
    
    fireEvent.submit(screen.getByRole('button', { name: /Register/i }).closest('form')!)

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '15555551234',
        password: 'Pass1234!',
        role: EUserRoles.SEEKER,
        consent: true,
      })
    })

    expect(
      await screen.findByText(/Registration successful! Please check your email for the confirmation link/i)
    ).toBeInTheDocument()
  })
})
