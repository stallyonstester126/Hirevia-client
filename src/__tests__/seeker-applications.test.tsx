import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SeekerApplicationsPage from '../app/seeker/applications/page'
import { apiClient } from '../lib/api-client'
import { EApplicationStatus } from '../types'

// Mock apiClient
vi.mock('../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('SeekerApplicationsPage Status & Withdrawal', () => {
  const mockApplications = [
    {
      _id: 'app-submitted',
      jobId: { _id: 'j1', title: 'Backend Developer', companyId: { name: 'Stripe' } },
      seekerId: 's1',
      resumeId: 'r1',
      status: EApplicationStatus.SUBMITTED,
      appliedAt: '2026-08-15T00:00:00.000Z',
    },
    {
      _id: 'app-interview',
      jobId: { _id: 'j2', title: 'Frontend Lead', companyId: { name: 'Netflix' } },
      seekerId: 's1',
      resumeId: 'r1',
      status: EApplicationStatus.INTERVIEW,
      appliedAt: '2026-08-14T00:00:00.000Z',
    },
    {
      _id: 'app-hired',
      jobId: { _id: 'j3', title: 'Staff Architect', companyId: { name: 'Apple' } },
      seekerId: 's1',
      resumeId: 'r1',
      status: EApplicationStatus.HIRED,
      appliedAt: '2026-08-10T00:00:00.000Z',
    },
    {
      _id: 'app-rejected',
      jobId: { _id: 'j4', title: 'DevOps Specialist', companyId: { name: 'Meta' } },
      seekerId: 's1',
      resumeId: 'r1',
      status: EApplicationStatus.REJECTED,
      appliedAt: '2026-08-08T00:00:00.000Z',
    },
    {
      _id: 'app-withdrawn',
      jobId: { _id: 'j5', title: 'Security Engineer', companyId: { name: 'Amazon' } },
      seekerId: 's1',
      resumeId: 'r1',
      status: EApplicationStatus.WITHDRAWN,
      appliedAt: '2026-08-05T00:00:00.000Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Success',
      data: {
        applications: mockApplications,
        pagination: { page: 1, limit: 10, total: 5, totalPages: 1 },
      },
    })
  })

  it('renders application statuses and correctly gates withdrawal buttons based on status machine', async () => {
    render(<SeekerApplicationsPage />)

    expect(await screen.findByText('Backend Developer')).toBeInTheDocument()
    expect(screen.getByText('Frontend Lead')).toBeInTheDocument()
    expect(screen.getByText('Staff Architect')).toBeInTheDocument()
    expect(screen.getByText('DevOps Specialist')).toBeInTheDocument()
    expect(screen.getByText('Security Engineer')).toBeInTheDocument()

    // Statuses that allow withdrawal: SUBMITTED, INTERVIEW (2 out of 5)
    // Statuses that do NOT allow withdrawal: HIRED, REJECTED, WITHDRAWN
    const withdrawButtons = screen.getAllByRole('button', { name: /Withdraw/i })
    expect(withdrawButtons).toHaveLength(2)
  })

  it('successfully triggers withdrawal API call for eligible application', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(apiClient.patch).mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Application withdrawn',
      data: { ...mockApplications[0], status: EApplicationStatus.WITHDRAWN },
    })

    render(<SeekerApplicationsPage />)
    await screen.findByText('Backend Developer')

    const withdrawButtons = screen.getAllByRole('button', { name: /Withdraw/i })
    fireEvent.click(withdrawButtons[0])

    const confirmBtn = await screen.findByRole('button', { name: /Withdraw Application/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/seeker/applications/app-submitted/withdraw')
    })

    expect(await screen.findByText(/Application withdrawn successfully/i)).toBeInTheDocument()
  })
})
