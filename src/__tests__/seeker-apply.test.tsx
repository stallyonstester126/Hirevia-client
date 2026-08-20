import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import JobDetailPage from '../app/seeker/jobs/[jobId]/page'
import { apiClient, ApiError } from '../lib/api-client'
import { useAuth } from '../context/AuthContext'
import { EEmploymentType, EExperienceLevel, EJobStatus, EWorkplaceType, EUserRoles } from '../types'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ jobId: 'job-123' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

// Mock useAuth context
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

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
    },
    ApiError: mockApiError,
  }
})

describe('JobDetailPage Apply Flow', () => {
  const mockJob = {
    _id: 'job-123',
    companyId: { _id: 'comp-1', name: 'Acme Corp' },
    title: 'Senior Frontend Engineer',
    description: 'Build modern user interfaces with Next.js and TypeScript.',
    responsibilities: ['Architect component systems', 'Collaborate with backend engineers'],
    requirements: ['5+ years React experience', 'Strong TypeScript knowledge'],
    skills: ['React', 'TypeScript', 'Next.js'],
    employmentType: EEmploymentType.FULL_TIME,
    experienceLevel: EExperienceLevel.SENIOR,
    workplaceType: EWorkplaceType.REMOTE,
    location: { city: 'San Francisco', country: 'USA' },
    salary: { min: 140000, max: 180000, currency: 'USD', period: 'YEARLY' },
    status: EJobStatus.PUBLISHED,
    paymentStatus: 'PAID',
    createdAt: '2026-08-15T12:00:00.000Z',
    updatedAt: '2026-08-15T12:00:00.000Z',
  }

  const mockResumes = [
    {
      _id: 'resume-1',
      seekerId: 'seeker-1',
      originalFileName: 'john_doe_cv.pdf',
      version: 1,
      isActive: true,
      createdAt: '2026-08-15T12:00:00.000Z',
      updatedAt: '2026-08-15T12:00:00.000Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { _id: 'seeker-1', name: 'John Doe', email: 'john@example.com', role: EUserRoles.SEEKER } as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      confirmRegistration: vi.fn(),
      logout: vi.fn(),
      clearAuth: vi.fn(),
    })

    vi.mocked(apiClient.get).mockImplementation((endpoint: string) => {
      if (endpoint === '/jobs/job-123') {
        return Promise.resolve({ success: true, statusCode: 200, message: 'Success', data: mockJob })
      }
      if (endpoint === '/seeker/resumes') {
        return Promise.resolve({ success: true, statusCode: 200, message: 'Success', data: mockResumes })
      }
      return Promise.reject(new Error('Endpoint not found'))
    })
  })

  it('renders job details and opens apply modal', async () => {
    render(<JobDetailPage />)

    expect(await screen.findByText('Senior Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText(/5\+ years React experience/i)).toBeInTheDocument()

    const applyButton = screen.getAllByRole('button', { name: /Apply Now/i })[0]
    fireEvent.click(applyButton)

    expect(await screen.findByText(/Apply to Senior Frontend Engineer/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Select Resume Version/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Cover Letter/i)).toBeInTheDocument()
  })

  it('submits application successfully with selected resume and cover letter', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      statusCode: 201,
      message: 'Application submitted',
      data: { _id: 'app-999', status: 'SUBMITTED' },
    })

    render(<JobDetailPage />)
    await screen.findByText('Senior Frontend Engineer')

    const applyButton = screen.getAllByRole('button', { name: /Apply Now/i })[0]
    fireEvent.click(applyButton)

    await screen.findByText(/Apply to Senior Frontend Engineer/i)

    fireEvent.change(screen.getByLabelText(/Cover Letter/i), {
      target: { value: 'I am excited about this role and have 6 years of experience.' },
    })

    const submitButton = screen.getByRole('button', { name: /Submit Application/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/jobs/job-123/apply', {
        resumeId: 'resume-1',
        coverLetter: 'I am excited about this role and have 6 years of experience.',
      })
    })

    expect(await screen.findByText(/Application submitted successfully!/i)).toBeInTheDocument()
  })

  it('automatically detects when user has already applied and renders professional Already Applied state', async () => {
    vi.mocked(apiClient.get).mockImplementation((endpoint: string) => {
      if (endpoint === '/jobs/job-123') {
        return Promise.resolve({ success: true, statusCode: 200, message: 'Success', data: mockJob })
      }
      if (endpoint === '/seeker/resumes') {
        return Promise.resolve({ success: true, statusCode: 200, message: 'Success', data: mockResumes })
      }
      if (endpoint === '/jobs/job-123/application-status') {
        return Promise.resolve({
          success: true,
          statusCode: 200,
          message: 'Success',
          data: {
            hasApplied: true,
            application: { _id: 'app-existing-123', status: 'SUBMITTED', appliedAt: '2026-08-18T10:00:00.000Z' },
          },
        })
      }
      return Promise.reject(new Error('Endpoint not found'))
    })

    render(<JobDetailPage />)

    expect(await screen.findByText('Senior Frontend Engineer')).toBeInTheDocument()
    const appliedBadges = await screen.findAllByText(/Already Applied/i)
    expect(appliedBadges.length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Track Status →/i })).toBeInTheDocument()
    expect(screen.getByText(/Application Submitted ✓/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Track in My Applications →/i })).toBeInTheDocument()
  })
})
