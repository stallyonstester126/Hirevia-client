import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SeekerResumesPage from '../app/seeker/resumes/page'
import { apiClient, ApiError } from '../lib/api-client'

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
      upload: vi.fn(),
      delete: vi.fn(),
      download: vi.fn(),
    },
    ApiError: mockApiError,
  }
})

describe('SeekerResumesPage Component', () => {
  const mockResumes = [
    {
      _id: 'res-1',
      seekerId: 'seeker-123',
      originalFileName: 'resume_v2.pdf',
      storageKey: 'resumes/resume_v2.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024 * 500, // 500 KB
      fileExtension: '.pdf',
      version: 2,
      isActive: true,
      createdAt: '2026-08-15T10:00:00.000Z',
      updatedAt: '2026-08-15T10:00:00.000Z',
    },
    {
      _id: 'res-2',
      seekerId: 'seeker-123',
      originalFileName: 'resume_v1.docx',
      storageKey: 'resumes/resume_v1.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 1024 * 300, // 300 KB
      fileExtension: '.docx',
      version: 1,
      isActive: false,
      createdAt: '2026-08-10T10:00:00.000Z',
      updatedAt: '2026-08-10T10:00:00.000Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Success',
      data: mockResumes,
    })
  })

  it('renders resume list with versions and active status badges', async () => {
    render(<SeekerResumesPage />)

    expect(await screen.findByText('resume_v2.pdf')).toBeInTheDocument()
    expect(screen.getByText('resume_v1.docx')).toBeInTheDocument()
    expect(screen.getByText('v2')).toBeInTheDocument()
    expect(screen.getByText('v1')).toBeInTheDocument()
    expect(screen.getByText(/Active Version/i)).toBeInTheDocument()
  })

  it('rejects invalid file types (e.g. .png, .exe)', async () => {
    render(<SeekerResumesPage />)
    await screen.findByText('resume_v2.pdf')

    const file = new File(['dummy content'], 'avatar.png', { type: 'image/png' })
    const input = document.getElementById('resume-upload-input') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByText(/Invalid file format/i)).toBeInTheDocument()
    expect(apiClient.upload).not.toHaveBeenCalled()
  })

  it('rejects oversized files (> 10MB)', async () => {
    render(<SeekerResumesPage />)
    await screen.findByText('resume_v2.pdf')

    // 11 MB file
    const largeFile = new File(['a'.repeat(1024)], 'giant_resume.pdf', { type: 'application/pdf' })
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 })

    const input = document.getElementById('resume-upload-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [largeFile] } })

    expect(await screen.findByText(/exceeds the maximum limit of 10MB/i)).toBeInTheDocument()
    expect(apiClient.upload).not.toHaveBeenCalled()
  })

  it('uploads a valid PDF resume file successfully', async () => {
    vi.mocked(apiClient.upload).mockResolvedValue({
      success: true,
      statusCode: 201,
      message: 'Success',
      data: {
        _id: 'res-3',
        seekerId: 'seeker-123',
        originalFileName: 'new_cv.pdf',
        storageKey: 'resumes/new_cv.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024 * 200,
        fileExtension: '.pdf',
        version: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })

    render(<SeekerResumesPage />)
    await screen.findByText('resume_v2.pdf')

    const validFile = new File(['sample pdf content'], 'new_cv.pdf', { type: 'application/pdf' })
    const input = document.getElementById('resume-upload-input') as HTMLInputElement

    fireEvent.change(input, { target: { files: [validFile] } })

    await waitFor(() => {
      expect(apiClient.upload).toHaveBeenCalledWith('/seeker/resumes', expect.any(FormData))
    })

    expect(await screen.findByText(/uploaded successfully/i)).toBeInTheDocument()
  })

  it('displays deletion lock error if resume is referenced by an active job application', async () => {
    vi.mocked(apiClient.delete).mockRejectedValue(
      new ApiError('Cannot delete resume. It is referenced by an active job application.', 409)
    )

    // Mock confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<SeekerResumesPage />)
    await screen.findByText('resume_v2.pdf')

    const deleteButtons = screen.getAllByLabelText(/Delete resume/i)
    fireEvent.click(deleteButtons[0])

    const confirmBtn = await screen.findByTestId('modal-confirm-button')
    fireEvent.click(confirmBtn)

    expect(
      await screen.findByText(/Deletion blocked: This resume is referenced by an active job application/i)
    ).toBeInTheDocument()
  })
})
