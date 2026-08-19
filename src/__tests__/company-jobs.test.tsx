import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CompanyJobsPage from '../app/company/jobs/page'
import { apiClient, ApiError } from '../lib/api-client'
import { EEmploymentType, EExperienceLevel, EJobStatus, EPaymentStatus, EWorkplaceType } from '../types'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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
      patch: vi.fn(),
      delete: vi.fn(),
    },
    ApiError: mockApiError,
  }
})

describe('CompanyJobsPage Job Management & Subscription Flow', () => {
  const mockJobs = [
    {
      _id: 'job-draft-1',
      title: 'Draft Engineering Job',
      description: 'Job awaiting publish',
      status: EJobStatus.DRAFT,
      paymentStatus: EPaymentStatus.UNPAID,
      employmentType: EEmploymentType.FULL_TIME,
      experienceLevel: EExperienceLevel.MID,
      workplaceType: EWorkplaceType.REMOTE,
      location: { city: 'Seattle', country: 'USA' },
      createdAt: '2026-08-15T00:00:00.000Z',
    },
    {
      _id: 'job-published',
      title: 'Live Published Job',
      description: 'Active job',
      status: EJobStatus.PUBLISHED,
      paymentStatus: EPaymentStatus.PAID,
      employmentType: EEmploymentType.FULL_TIME,
      experienceLevel: EExperienceLevel.LEAD,
      workplaceType: EWorkplaceType.HYBRID,
      location: { city: 'San Francisco', country: 'USA' },
      createdAt: '2026-08-15T00:00:00.000Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url.includes('/subscription/status')) {
        return {
          success: true,
          statusCode: 200,
          message: 'Success',
          data: { subscriptionStatus: 'PAID' },
        }
      }
      return {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          jobs: mockJobs,
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
        },
      }
    })
  })

  it('renders company jobs with unlimited plan badge and direct publish action for subscribed company', async () => {
    render(<CompanyJobsPage />)

    expect(await screen.findByText('Draft Engineering Job')).toBeInTheDocument()
    expect(screen.getByText('Live Published Job')).toBeInTheDocument()
    expect(screen.getByText(/Unlimited Plan Active/i)).toBeInTheDocument()

    // "Publish Job" is present for draft job
    expect(screen.getByRole('button', { name: /Publish Job/i })).toBeInTheDocument()

    // "Close Job" is present for published job
    expect(screen.getByRole('button', { name: /Close Job/i })).toBeInTheDocument()

    // Delete buttons are present only for DRAFT jobs
    const deleteButtons = screen.getAllByLabelText(/Delete draft job/i)
    expect(deleteButtons).toHaveLength(1)
  })

  it('initiates subscription checkout session and redirects to checkout URL when unpaid', async () => {
    delete (window as any).location
    window.location = { href: '' } as any

    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url.includes('/subscription/status')) {
        return {
          success: true,
          statusCode: 200,
          message: 'Success',
          data: { subscriptionStatus: 'UNPAID' },
        }
      }
      return {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          jobs: mockJobs,
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
        },
      }
    })

    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      statusCode: 201,
      message: 'Success',
      data: { checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_sub' },
    })

    render(<CompanyJobsPage />)
    await screen.findByText('Draft Engineering Job')

    const payButton = screen.getByRole('button', { name: /Unlock \(\$10\) & Publish/i })
    fireEvent.click(payButton)

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/company/jobs/subscription/checkout')
    })

    expect(window.location.href).toBe('https://checkout.stripe.com/pay/cs_test_sub')
  })

  it('publishes draft job successfully when company is subscribed', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Success',
      data: { ...mockJobs[0], status: EJobStatus.PUBLISHED },
    })

    render(<CompanyJobsPage />)
    await screen.findByText('Draft Engineering Job')

    const publishButton = screen.getByRole('button', { name: /Publish Job/i })
    fireEvent.click(publishButton)

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/company/jobs/job-draft-1/publish')
    })

    expect(await screen.findByText(/Job successfully published/i)).toBeInTheDocument()
  })
})
