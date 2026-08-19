import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import JobForm from '../components/JobForm'
import { EEmploymentType, EExperienceLevel, EWorkplaceType } from '../types'

describe('JobForm Component Validation', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates required fields and salary max >= min rule', async () => {
    render(<JobForm onSubmit={mockOnSubmit} isSubmitting={false} />)

    // Fill title
    fireEvent.change(screen.getByLabelText(/Job Title/i), { target: { value: 'Senior Backend Engineer' } })
    // Fill description
    fireEvent.change(screen.getByLabelText(/Job Description/i), { target: { value: 'Building high throughput APIs' } })
    // Fill location
    fireEvent.change(screen.getByLabelText(/City/i), { target: { value: 'New York' } })
    fireEvent.change(screen.getByLabelText(/Country/i), { target: { value: 'USA' } })

    // Invalid salary: max (80k) < min (120k)
    fireEvent.change(screen.getByLabelText(/Min Salary/i), { target: { value: '120000' } })
    fireEvent.change(screen.getByLabelText(/Max Salary/i), { target: { value: '80000' } })

    fireEvent.click(screen.getByRole('button', { name: /Save Job Posting/i }))

    expect(
      await screen.findByText(/Maximum salary must be greater than or equal to minimum salary/i)
    ).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('formats payload correctly with responsibilities, requirements, and skills on valid submit', async () => {
    render(<JobForm onSubmit={mockOnSubmit} isSubmitting={false} />)

    fireEvent.change(screen.getByLabelText(/Job Title/i), { target: { value: 'Full Stack Engineer' } })
    fireEvent.change(screen.getByLabelText(/Job Description/i), { target: { value: 'Develop Next.js applications.' } })
    fireEvent.change(screen.getByLabelText(/City/i), { target: { value: 'Austin' } })
    fireEvent.change(screen.getByLabelText(/Country/i), { target: { value: 'USA' } })
    fireEvent.change(screen.getByLabelText(/Min Salary/i), { target: { value: '100000' } })
    fireEvent.change(screen.getByLabelText(/Max Salary/i), { target: { value: '140000' } })

    // Add multiline responsibilities and requirements
    fireEvent.change(screen.getByLabelText(/Key Responsibilities/i), {
      target: { value: 'Architect React frontends\nWrite GraphQL APIs' },
    })
    fireEvent.change(screen.getByLabelText(/Requirements & Qualifications/i), {
      target: { value: '3+ years React experience\nStrong TypeScript skills' },
    })

    // Add skill tag
    const skillInput = screen.getByPlaceholderText(/Type a skill/i)
    fireEvent.change(skillInput, { target: { value: 'GraphQL' } })
    fireEvent.keyDown(skillInput, { key: 'Enter', code: 'Enter' })

    fireEvent.click(screen.getByRole('button', { name: /Save Job Posting/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Full Stack Engineer',
          description: 'Develop Next.js applications.',
          responsibilities: ['Architect React frontends', 'Write GraphQL APIs'],
          requirements: ['3+ years React experience', 'Strong TypeScript skills'],
          skills: ['GraphQL'],
          location: { city: 'Austin', country: 'USA' },
          salary: { min: 100000, max: 140000, currency: 'USD', period: 'YEARLY' },
          employmentType: EEmploymentType.FULL_TIME,
          experienceLevel: EExperienceLevel.MID,
          workplaceType: EWorkplaceType.REMOTE,
        })
      )
    })
  })

  it('triggers onCancel when Cancel button is clicked', () => {
    const mockOnCancel = vi.fn()
    render(<JobForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />)

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    expect(cancelBtn).toBeInTheDocument()
    fireEvent.click(cancelBtn)
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })
})
