import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SeekerProfilePage from '../app/seeker/profile/page'
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

describe('SeekerProfilePage Component', () => {
  const mockProfile = {
    _id: 'prof-1',
    userId: 'user-1',
    headline: 'Senior Full-Stack Engineer',
    bio: '10 years building high performance web applications.',
    location: 'Austin, TX',
    skills: ['TypeScript', 'React', 'Node.js'],
    experience: [
      {
        company: 'TechCorp',
        position: 'Staff Engineer',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: null,
        description: 'Leading architecture initiatives',
      },
    ],
    education: [
      {
        institution: 'University of Texas',
        degree: 'B.S. Computer Science',
        startDate: '2015-09-01T00:00:00.000Z',
        endDate: '2019-05-01T00:00:00.000Z',
      },
    ],
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

  it('renders existing profile fields, skills tags, and entries', async () => {
    render(<SeekerProfilePage />)

    expect(await screen.findByDisplayValue('Senior Full-Stack Engineer')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Austin, TX')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Staff Engineer')).toBeInTheDocument()
    expect(screen.getByText('TechCorp')).toBeInTheDocument()
    expect(screen.getByText('University of Texas')).toBeInTheDocument()
  })

  it('adds a new skill tag via TagInput', async () => {
    render(<SeekerProfilePage />)
    await screen.findByDisplayValue('Senior Full-Stack Engineer')

    const skillInput = screen.getByPlaceholderText(/Add more|Type skill/i)
    fireEvent.change(skillInput, { target: { value: 'Docker' } })
    fireEvent.keyDown(skillInput, { key: 'Enter', code: 'Enter' })

    expect(await screen.findByText('Docker')).toBeInTheDocument()
  })

  it('submits updated profile payload to backend patch endpoint', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Profile updated',
      data: mockProfile,
    })

    render(<SeekerProfilePage />)
    await screen.findByDisplayValue('Senior Full-Stack Engineer')

    fireEvent.change(screen.getByLabelText(/Professional Headline/i), {
      target: { value: 'Lead Cloud Architect' },
    })

    const saveButtons = screen.getAllByRole('button', { name: /Save Profile/i })
    fireEvent.click(saveButtons[0])

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/seeker/profile', expect.objectContaining({
        headline: 'Lead Cloud Architect',
      }))
    })

    expect(await screen.findByText(/Profile updated successfully/i)).toBeInTheDocument()
  })
})
