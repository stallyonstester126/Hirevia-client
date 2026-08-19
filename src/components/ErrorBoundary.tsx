'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in boundary:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg border border-red-200 my-4">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Something went wrong</h2>
            <p className="text-red-600 mb-4 text-sm">
              {this.state.error?.message || 'An unexpected client-side error occurred.'}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-semibold"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
