import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CompanyApplicationDetailPage from '../app/company/applications/[applicationId]/page'
import { apiClient } from '../lib/api-client'
import { EApplicationStatus } from '../types'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ applicationId: 'app-test-123' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

// Mock apiClient
vi.mock('../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    download: vi.fn(),
  },
}))

describe('CompanyApplicationDetailPage Pipeline & Match Score', () => {
  const mockApplicationData = {
    application: {
      _id: 'app-test-123',
      jobId: { _id: 'job-1', title: 'Senior Backend Engineer' },
      seekerId: { _id: 'seeker-1', name: 'Alice Developer', email: 'alice@example.com' },
      resumeId: { _id: 'resume-1', originalFileName: 'alice_cv.pdf', version: 1 },
      status: EApplicationStatus.SUBMITTED,
      coverLetter: 'I am an experienced Node.js developer.',
      appliedAt: '2026-08-15T00:00:00.000Z',
    },
    seekerProfile: {
      userId: 'seeker-1',
      headline: 'Full Stack Engineer',
      bio: 'Expert in distributed systems',
      location: 'San Francisco, CA',
      skills: ['Node.js', 'PostgreSQL', 'Redis'],
      experience: [
        {
          company: 'Acme Corp',
          position: 'Backend Developer',
          startDate: '2022-01-01T00:00:00.000Z',
          endDate: null,
          description: 'Designed microservices architecture',
        },
      ],
      education: [],
    },
  }

  const mockAnalysisData = {
    analysis: {
      resumeId: 'resume-1',
      seekerId: 'seeker-1',
      extractedSkills: ['Node.js', 'TypeScript', 'Docker'],
      experienceSummary: '4 years backend development',
      educationSummary: 'B.S. Computer Science',
      estimatedExperienceLevel: 'MID',
      suggestions: ['Add more metrics'],
      status: 'COMPLETE',
    },
    matchScore: {
      applicationId: 'app-test-123',
      resumeId: 'resume-1',
      jobId: 'job-1',
      score: 88,
      rationale: 'Strong candidate match with required backend and cloud skills.',
      generatedAt: '2026-08-15T00:00:00.000Z',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/analysis')) {
        return Promise.resolve({ success: true, statusCode: 200, message: 'Success', data: mockAnalysisData })
      }
      return Promise.resolve({ success: true, statusCode: 200, message: 'Success', data: mockApplicationData })
    })
  })

  it('renders candidate details, profile background, and AI match score', async () => {
    render(<CompanyApplicationDetailPage />)

    expect(await screen.findByText('Alice Developer')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('Full Stack Engineer')).toBeInTheDocument()
    expect(screen.getByText('88')).toBeInTheDocument()
    expect(screen.getByText(/Strong candidate match with required backend/i)).toBeInTheDocument()
  })

  it('offers only valid next transition states for SUBMITTED application (UNDER_REVIEW, REJECTED)', async () => {
    render(<CompanyApplicationDetailPage />)
    await screen.findByText('Alice Developer')

    // Allowed buttons for SUBMITTED status: "Move to UNDER REVIEW →" and "Reject Candidate"
    const advanceButton = screen.getByRole('button', { name: /Move to UNDER REVIEW →/i })
    const rejectButton = screen.getByRole('button', { name: /Reject Candidate/i })

    expect(advanceButton).toBeInTheDocument()
    expect(rejectButton).toBeInTheDocument()

    // HIRED and SHORTLISTED buttons must NOT exist for SUBMITTED status
    expect(screen.queryByRole('button', { name: /Hire Candidate/i })).not.toBeInTheDocument()
  })

  it('updates candidate status to UNDER_REVIEW on button click', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Status updated',
      data: {
        ...mockApplicationData.application,
        status: EApplicationStatus.UNDER_REVIEW,
      },
    })

    render(<CompanyApplicationDetailPage />)
    await screen.findByText('Alice Developer')

    const advanceButton = screen.getByRole('button', { name: /Move to UNDER REVIEW →/i })
    fireEvent.click(advanceButton)

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/company/applications/app-test-123/status',
        { status: EApplicationStatus.UNDER_REVIEW }
      )
    })

    expect(await screen.findByText(/moved to UNDER REVIEW stage/i)).toBeInTheDocument()
  })

  it('recalculates AI job match score on button click', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Success',
      data: {
        ...mockAnalysisData.matchScore,
        score: 95,
        rationale: 'Updated analysis reveals exceptional match in TypeScript and architecture.',
      },
    })

    render(<CompanyApplicationDetailPage />)
    await screen.findByText('Alice Developer')

    const matchButton = screen.getByRole('button', { name: /Recalculate/i })
    fireEvent.click(matchButton)

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/company/applications/app-test-123/analysis/match'
      )
    })

    expect(await screen.findByText('95')).toBeInTheDocument()
    expect(screen.getByText(/Updated analysis reveals exceptional match/i)).toBeInTheDocument()
  })
})
