import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import PublicCandidateTestPage from '../app/test/[token]/page'
import { apiClient } from '../lib/api-client'

vi.mock('next/navigation', () => ({
  useParams: () => ({ token: 'test_assessment_token_123' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('PublicCandidateTestPage — Written Assessment Flow', () => {
  const mockContext = {
    jobTitle: 'Senior Full Stack Engineer',
    companyName: 'Acme Technologies',
    candidateFirstName: 'David',
    status: 'PENDING',
    expiresAt: '2026-08-26T12:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders assessment welcome screen with job and candidate info', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      message: 'Operation is completed',
      data: mockContext,
    })

    render(<PublicCandidateTestPage />)

    expect(screen.getByText('Loading your assessment...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/Hello David!/i)).toBeInTheDocument()
    })

    expect(screen.getAllByText('Senior Full Stack Engineer').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Acme Technologies').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Start Assessment/i })).toBeInTheDocument()
  })

  it('transitions to active assessment form upon clicking start', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      message: 'Operation is completed',
      data: mockContext,
    })

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      message: 'Operation is completed',
      data: { status: 'STARTED', startedAt: new Date().toISOString() },
    })

    render(<PublicCandidateTestPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Assessment/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Start Assessment/i }))

    await waitFor(() => {
      expect(screen.getByText('Assessment In Progress')).toBeInTheDocument()
    })

    expect(screen.getAllByPlaceholderText('Type your response here...').length).toBe(3)
    expect(screen.getByRole('button', { name: /Submit Assessment/i })).toBeInTheDocument()
  })

  it('submits assessment answers and displays confirmation screen', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      message: 'Operation is completed',
      data: { ...mockContext, status: 'STARTED' },
    })

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      message: 'Operation is completed',
      data: { status: 'COMPLETED', completedAt: new Date().toISOString() },
    })

    render(<PublicCandidateTestPage />)

    await waitFor(() => {
      expect(screen.getByText('Assessment In Progress')).toBeInTheDocument()
    })

    const textareas = screen.getAllByPlaceholderText('Type your response here...')
    fireEvent.change(textareas[0], { target: { value: 'Designed scalable microservices architecture.' } })
    fireEvent.change(textareas[1], { target: { value: 'Automated CI/CD with Jest, Vitest, and Playwright.' } })
    fireEvent.change(textareas[2], { target: { value: 'Passionate about modern cloud engineering.' } })

    fireEvent.click(screen.getByRole('button', { name: /Submit Assessment/i }))

    await waitFor(() => {
      expect(screen.getByText(/Thank You, David!/i)).toBeInTheDocument()
      expect(screen.getByText('Responses Submitted')).toBeInTheDocument()
    })
  })

  it('handles invalid or expired tokens gracefully without infinite loading', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Assessment invite not found or invalid link'))

    render(<PublicCandidateTestPage />)

    await waitFor(() => {
      expect(screen.getByText('Assessment Link Unavailable')).toBeInTheDocument()
      expect(screen.getByText('Assessment invite not found or invalid link')).toBeInTheDocument()
    })

    expect(screen.queryByText('Loading your assessment...')).not.toBeInTheDocument()
  })
})
