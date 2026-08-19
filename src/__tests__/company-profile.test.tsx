import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CompanyProfilePage from '../app/company/profile/page'
import { apiClient } from '../lib/api-client'

// Mock apiClient
vi.mock('../lib/api-client', () => {
  const mockApiError = class ApiError extends Error {
    statusCode: number
    data: any
    constructor(message: string, statusCode: number, data: any = null) {
      super(message)
      this.name = 'ApiError'
      this.statusCode = statusCode
      this.data = data
    }
  }

  return {
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    },
    ApiError: mockApiError,
  }
})

describe('CompanyProfilePage Component', () => {
  const mockProfile = {
    _id: 'cprof-1',
    userId: 'user-company-1',
    companyName: 'Acme Technologies',
    description: 'Next generation cloud platforms.',
    industry: 'Cloud Computing',
    location: 'San Francisco, CA',
    website: 'https://acme.example.com',
    phone: '+1 555-0199',
    logoUrl: 'https://acme.example.com/logo.png',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Success',
      data: mockProfile,
    })
  })

  it('renders existing company profile fields', async () => {
    render(<CompanyProfilePage />)

    expect(await screen.findByDisplayValue('Acme Technologies')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Cloud Computing')).toBeInTheDocument()
    expect(screen.getByDisplayValue('San Francisco, CA')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://acme.example.com')).toBeInTheDocument()
  })

  it('submits updated profile payload to PATCH endpoint', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Profile updated',
      data: mockProfile,
    })

    render(<CompanyProfilePage />)
    await screen.findByDisplayValue('Acme Technologies')

    fireEvent.change(screen.getByLabelText(/Company \/ Brand Name/i), {
      target: { value: 'Acme Global Labs' },
    })

    const saveButtons = screen.getAllByRole('button', { name: /Save (Company )?Profile/i })
    fireEvent.click(saveButtons[0])

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/company/profile',
        expect.objectContaining({
          companyName: 'Acme Global Labs',
        })
      )
    })

    expect(await screen.findByText(/Company profile updated successfully/i)).toBeInTheDocument()
  })
})
