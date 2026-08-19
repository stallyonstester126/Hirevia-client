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

describe('CompanyJobsPage Job Management & Stripe Flow', () => {
  const mockJobs = [
    {
      _id: 'job-draft-unpaid',
      title: 'Draft Unpaid Job',
      description: 'Job awaiting payment',
      status: EJobStatus.DRAFT,
      paymentStatus: EPaymentStatus.UNPAID,
      employmentType: EEmploymentType.FULL_TIME,
      experienceLevel: EExperienceLevel.MID,
      workplaceType: EWorkplaceType.REMOTE,
      location: { city: 'Seattle', country: 'USA' },
      createdAt: '2026-08-15T00:00:00.000Z',
    },
    {
      _id: 'job-draft-paid',
      title: 'Draft Paid Job',
      description: 'Job ready to publish',
      status: EJobStatus.DRAFT,
      paymentStatus: EPaymentStatus.PAID,
      employmentType: EEmploymentType.FULL_TIME,
      experienceLevel: EExperienceLevel.SENIOR,
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
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Success',
      data: {
        jobs: mockJobs,
        pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
      },
    })
  })

  it('renders company jobs with status badges and appropriate lifecycle actions', async () => {
    render(<CompanyJobsPage />)

    expect(await screen.findByText('Draft Unpaid Job')).toBeInTheDocument()
    expect(screen.getByText('Draft Paid Job')).toBeInTheDocument()
    expect(screen.getByText('Live Published Job')).toBeInTheDocument()

    // "Pay Fee ($10)" is present for unpaid draft
    expect(screen.getByRole('button', { name: /Pay Fee \(\$10\)/i })).toBeInTheDocument()

    // "Publish Job" is present for paid draft
    expect(screen.getByRole('button', { name: /Publish Job/i })).toBeInTheDocument()

    // "Close Job" is present for published job
    expect(screen.getByRole('button', { name: /Close Job/i })).toBeInTheDocument()

    // Delete buttons are present only for DRAFT jobs (2 drafts -> 2 delete buttons)
    const deleteButtons = screen.getAllByLabelText(/Delete draft job/i)
    expect(deleteButtons).toHaveLength(2)
  })

  it('initiates Stripe checkout session on unpaid draft and redirects to checkout URL', async () => {
    delete (window as any).location
    window.location = { href: '' } as any

    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      statusCode: 201,
      message: 'Success',
      data: { checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_123' },
    })

    render(<CompanyJobsPage />)
    await screen.findByText('Draft Unpaid Job')

    const payButton = screen.getByRole('button', { name: /Pay Fee \(\$10\)/i })
    fireEvent.click(payButton)

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/company/jobs/job-draft-unpaid/checkout')
    })

    expect(window.location.href).toBe('https://checkout.stripe.com/pay/cs_test_123')
  })

  it('handles duplicate checkout attempt (409 conflict) cleanly', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(
      new ApiError('Checkout session is already pending for this job', 409)
    )

    render(<CompanyJobsPage />)
    await screen.findByText('Draft Unpaid Job')

    const payButton = screen.getByRole('button', { name: /Pay Fee \(\$10\)/i })
    fireEvent.click(payButton)

    expect(
      await screen.findByText(/A checkout session is already pending for this job/i)
    ).toBeInTheDocument()
  })

  it('publishes paid draft job successfully', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Success',
      data: { ...mockJobs[1], status: EJobStatus.PUBLISHED },
    })

    render(<CompanyJobsPage />)
    await screen.findByText('Draft Paid Job')

    const publishButton = screen.getByRole('button', { name: /Publish Job/i })
    fireEvent.click(publishButton)

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/company/jobs/job-draft-paid/publish')
    })

    expect(await screen.findByText(/Job successfully published/i)).toBeInTheDocument()
  })
})
