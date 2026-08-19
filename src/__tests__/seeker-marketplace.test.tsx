import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SeekerJobsPage from '../app/seeker/jobs/page'
import { apiClient } from '../lib/api-client'
import { EEmploymentType, EExperienceLevel, EJobStatus, EWorkplaceType } from '../types'

// Mock apiClient
vi.mock('../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('SeekerJobsPage Marketplace', () => {
  const mockJobsData = {
    jobs: [
      {
        _id: 'job-1',
        companyId: { _id: 'c1', name: 'Google' },
        title: 'Software Engineer',
        description: 'Design distributed systems',
        employmentType: EEmploymentType.FULL_TIME,
        experienceLevel: EExperienceLevel.MID,
        workplaceType: EWorkplaceType.REMOTE,
        location: { city: 'Mountain View', country: 'USA' },
        salary: { min: 120000, max: 160000, currency: 'USD', period: 'YEARLY' },
        status: EJobStatus.PUBLISHED,
        paymentStatus: 'PAID',
        skills: ['Go', 'Kubernetes'],
        createdAt: '2026-08-15T00:00:00.000Z',
        updatedAt: '2026-08-15T00:00:00.000Z',
      },
    ],
    pagination: {
      page: 1,
      limit: 12,
      total: 24,
      totalPages: 2,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Success',
      data: mockJobsData,
    })
  })

  it('fetches and renders published jobs with default pagination', async () => {
    render(<SeekerJobsPage />)

    expect(await screen.findByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(apiClient.get).toHaveBeenCalledWith('/jobs', {
      params: { page: 1, limit: 12 },
    })
  })

  it('updates query params when search keywords and location are submitted', async () => {
    render(<SeekerJobsPage />)
    await screen.findByText('Software Engineer')

    fireEvent.change(screen.getByPlaceholderText(/Search by job title/i), {
      target: { value: 'React' },
    })
    fireEvent.change(screen.getByPlaceholderText(/City, country/i), {
      target: { value: 'San Francisco' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Search Jobs/i }))

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/jobs', {
        params: {
          page: 1,
          limit: 12,
          search: 'React',
          location: 'San Francisco',
        },
      })
    })
  })

  it('updates query params when employment and workplace filters change', async () => {
    render(<SeekerJobsPage />)
    await screen.findByText('Software Engineer')

    const selects = screen.getAllByRole('combobox')
    const workplaceSelect = selects[0]
    const employmentSelect = selects[1]

    fireEvent.change(workplaceSelect, { target: { value: EWorkplaceType.REMOTE } })
    fireEvent.change(employmentSelect, { target: { value: EEmploymentType.FULL_TIME } })

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/jobs', {
        params: {
          page: 1,
          limit: 12,
          workplaceType: 'REMOTE',
          employmentType: 'FULL_TIME',
        },
      })
    })
  })

  it('triggers page change when pagination next button is clicked', async () => {
    render(<SeekerJobsPage />)
    await screen.findByText('Software Engineer')

    const nextButton = screen.getByRole('button', { name: /Next/i })
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/jobs', {
        params: {
          page: 2,
          limit: 12,
        },
      })
    })
  })
})
