import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import PublicVoiceInterviewPage from '../app/interview/[token]/page'
import { apiClient } from '../lib/api-client'

// Mock environment variables
process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY = 'test_vapi_pk_123'
process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID = 'test_vapi_asst_456'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ token: 'test_token_abc_123' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

// Mock apiClient
vi.mock('../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

// Mock Vapi Web SDK
let mockVapiListeners: Record<string, Function[]> = {}
const mockVapiStop = vi.fn()
const mockVapiStart = vi.fn().mockImplementation(async () => {
  // Simulate call-start event
  if (mockVapiListeners['call-start']) {
    mockVapiListeners['call-start'].forEach((fn) => fn())
  }
})

vi.mock('@vapi-ai/web', () => {
  return {
    default: class MockVapi {
      constructor(public publicKey: string) {
        mockVapiListeners = {}
      }
      on(event: string, callback: Function) {
        if (!mockVapiListeners[event]) {
          mockVapiListeners[event] = []
        }
        mockVapiListeners[event].push(callback)
        return this
      }
      start = mockVapiStart
      stop = mockVapiStop
    },
  }
})

describe('PublicVoiceInterviewPage — Interview Integrity & Finalize Pipeline', () => {
  const mockContext = {
    candidateName: 'John Doe',
    jobTitle: 'Senior Cloud Engineer',
    companyName: 'Acme Cloud Corp',
    jobRequirements: 'AWS, Kubernetes, Go',
    candidateSkills: 'Cloud Architecture, Terraform',
    experienceLevel: 'SENIOR',
    experienceSummary: '10 years cloud experience',
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    applicationId: 'app_test_789',
    token: 'test_token_abc_123',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockVapiListeners = {}
    ;(apiClient.get as any).mockResolvedValue({
      success: true,
      data: mockContext,
    })
    ;(apiClient.post as any).mockResolvedValue({
      success: true,
      data: { status: 'COMPLETED' },
    })
  })

  it('renders lobby screen with candidate and job info and start button', async () => {
    render(<PublicVoiceInterviewPage />)

    expect(await screen.findByText('Senior Cloud Engineer')).toBeInTheDocument()
    expect(screen.getByText(/John Doe/)).toBeInTheDocument()
    expect(screen.getByText(/Acme Cloud Corp/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Voice Interview/i })).toBeInTheDocument()
  })

  it('starts interview and verifies NO manual finish or end button exists during active call', async () => {
    render(<PublicVoiceInterviewPage />)

    const startBtn = await screen.findByRole('button', { name: /Start Voice Interview/i })
    fireEvent.click(startBtn)

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/interview/test_token_abc_123/start')
      expect(mockVapiStart).toHaveBeenCalled()
    })

    // Confirm active live state and visual elements
    expect(screen.getByText(/Live Session/i)).toBeInTheDocument()
    expect(screen.getByText(/Interview in Progress/i)).toBeInTheDocument()
    expect(screen.getByText(/Your answers are being recorded securely/i)).toBeInTheDocument()
    expect(screen.getByText(/Secure & Private/i)).toBeInTheDocument()
    expect(screen.getByText(/Your responses are being recorded and will be used for evaluation purposes only/i)).toBeInTheDocument()

    // STRICT CHECK: Ensure transcript box is NOT rendered on candidate page
    expect(screen.queryByText(/Conversation transcript will appear here in real-time/i)).not.toBeInTheDocument()

    // STRICT CHECK: Ensure NO Finish or End Interview button exists in the DOM
    expect(screen.queryByRole('button', { name: /End Interview/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Finish Interview/i })).not.toBeInTheDocument()
  })

  it('automatically triggers finalization when Vapi assistant concludes and emits call-end', async () => {
    render(<PublicVoiceInterviewPage />)

    const startBtn = await screen.findByRole('button', { name: /Start Voice Interview/i })
    fireEvent.click(startBtn)

    await waitFor(() => {
      expect(mockVapiStart).toHaveBeenCalled()
    })

    // Simulate speech messages arriving
    if (mockVapiListeners['message']) {
      mockVapiListeners['message'].forEach((fn) =>
        fn({
          type: 'transcript',
          transcriptType: 'final',
          role: 'assistant',
          transcript: 'Hello John, thanks for joining.',
        })
      )
      mockVapiListeners['message'].forEach((fn) =>
        fn({
          type: 'transcript',
          transcriptType: 'final',
          role: 'user',
          transcript: 'Glad to be here.',
        })
      )
    }

    // Simulate Vapi assistant naturally concluding and hanging up (call-end event)
    if (mockVapiListeners['call-end']) {
      mockVapiListeners['call-end'].forEach((fn) => fn())
    }

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/interview/test_token_abc_123/finalize',
        expect.objectContaining({
          endedReason: 'ASSISTANT_ENDED',
          transcript: expect.stringContaining('Hello John, thanks for joining.'),
          tabSwitchCount: 0,
        })
      )
    })

    // Confirmation screen rendered
    expect(screen.getByText(/Interview Complete!/i)).toBeInTheDocument()
  })
})
