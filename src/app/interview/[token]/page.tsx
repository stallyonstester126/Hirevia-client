'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { IPublicInterviewContext } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import Vapi from '@vapi-ai/web'

const MAX_INTERVIEW_DURATION_SECONDS = 480 // 8 minutes safety ceiling
const TAB_SWITCH_GRACE_SECONDS = 15 // 15 seconds grace period before integrity cutoff

export default function PublicVoiceInterviewPage() {
  const urlParams = useParams()
  const token = (urlParams?.token as string) || ''

  const [loading, setLoading] = useState(true)
  const [interviewContext, setInterviewContext] = useState<IPublicInterviewContext | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [callState, setCallState] = useState<'LOBBY' | 'CONNECTING' | 'ACTIVE' | 'ENDED'>('LOBBY')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [duration, setDuration] = useState(0)
  const [liveMessages, setLiveMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string }>>([])

  const vapiRef = useRef<Vapi | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)

  // Tracking refs
  const liveMessagesRef = useRef<Array<{ role: 'assistant' | 'user'; text: string }>>([])
  const isFinalizedRef = useRef(false)
  const callStateRef = useRef<'LOBBY' | 'CONNECTING' | 'ACTIVE' | 'ENDED'>('LOBBY')
  const tabSwitchCountRef = useRef(0)
  const tabSwitchDurationRef = useRef(0)
  const tabHiddenStartTimeRef = useRef<number | null>(null)
  const tabGraceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Keep refs in sync
  useEffect(() => {
    liveMessagesRef.current = liveMessages
  }, [liveMessages])

  useEffect(() => {
    callStateRef.current = callState
  }, [callState])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [liveMessages])

  // Finalize interview handler (called on assistant hangup, timeout, tab violation, or disconnect)
  const finalizeInterview = useCallback(
    async (endedReason: string = 'ASSISTANT_ENDED') => {
      if (isFinalizedRef.current) return
      isFinalizedRef.current = true

      // 1. Clear any active timers
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (tabGraceTimerRef.current) {
        clearTimeout(tabGraceTimerRef.current)
        tabGraceTimerRef.current = null
      }

      // If tab was still hidden when finalized, add pending hidden duration
      if (tabHiddenStartTimeRef.current) {
        const elapsedSecs = (Date.now() - tabHiddenStartTimeRef.current) / 1000
        tabSwitchDurationRef.current += elapsedSecs
        tabHiddenStartTimeRef.current = null
      }

      // 2. Safely stop Vapi SDK if running
      try {
        if (vapiRef.current) {
          vapiRef.current.stop()
        }
      } catch (err) {
        console.warn('Error stopping Vapi instance on finalize:', err)
      }

      setCallState('ENDED')

      // 3. Compile transcript from live message stream
      const currentMessages = liveMessagesRef.current
      const compiledTranscript =
        currentMessages.length > 0
          ? currentMessages
              .map((m) => `${m.role === 'assistant' ? 'AI Interviewer' : 'Candidate'}: ${m.text}`)
              .join('\n')
          : ''

      // 4. Send finalize request to backend
      try {
        await apiClient.post(`/interview/${token}/finalize`, {
          transcript: compiledTranscript,
          endedReason,
          tabSwitchCount: tabSwitchCountRef.current,
          tabSwitchDuration: Math.round(tabSwitchDurationRef.current)
        })
      } catch (err: any) {
        console.error('Failed to notify backend of interview finalization:', err)
      }
    },
    [token]
  )

  // Timer for active call & 8-minute duration enforcement
  useEffect(() => {
    if (callState === 'ACTIVE') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const next = prev + 1
          if (next >= MAX_INTERVIEW_DURATION_SECONDS) {
            finalizeInterview('MAX_DURATION_REACHED')
          }
          return next
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [callState, finalizeInterview])

  // BeforeUnload deterrent: active ONLY while call is ACTIVE
  useEffect(() => {
    if (callState !== 'ACTIVE') return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [callState])

  // Page Visibility API tracking & 15-second grace timer
  useEffect(() => {
    if (callState !== 'ACTIVE') return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        tabSwitchCountRef.current += 1
        tabHiddenStartTimeRef.current = Date.now()

        // Start 15s grace timer
        if (tabGraceTimerRef.current) clearTimeout(tabGraceTimerRef.current)
        tabGraceTimerRef.current = setTimeout(() => {
          // Sustained tab switch past grace period -> Integrity cutoff
          finalizeInterview('TAB_SWITCH_TIMEOUT')
        }, TAB_SWITCH_GRACE_SECONDS * 1000)
      } else if (document.visibilityState === 'visible') {
        // Candidate returned before grace period elapsed
        if (tabGraceTimerRef.current) {
          clearTimeout(tabGraceTimerRef.current)
          tabGraceTimerRef.current = null
        }
        if (tabHiddenStartTimeRef.current) {
          const elapsedSecs = (Date.now() - tabHiddenStartTimeRef.current) / 1000
          tabSwitchDurationRef.current += elapsedSecs
          tabHiddenStartTimeRef.current = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (tabGraceTimerRef.current) {
        clearTimeout(tabGraceTimerRef.current)
        tabGraceTimerRef.current = null
      }
    }
  }, [callState, finalizeInterview])

  // Fetch interview context on mount
  useEffect(() => {
    const fetchContext = async () => {
      try {
        setLoading(true)
        setErrorMsg('')
        const res = await apiClient.get<IPublicInterviewContext>(`/interview/${token}`)
        if (res.success && res.data) {
          setInterviewContext(res.data)
          if (res.data.status === 'COMPLETED') {
            setCallState('ENDED')
            isFinalizedRef.current = true
          }
        } else {
          setErrorMsg(res.message || 'Failed to load interview context.')
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'The interview link is invalid or has expired.')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchContext()
    }
  }, [token])

  // Cleanup Vapi on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (tabGraceTimerRef.current) {
        clearTimeout(tabGraceTimerRef.current)
      }
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartInterview = async () => {
    setErrorMsg('')
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID

    if (!publicKey || !assistantId) {
      setErrorMsg('Vapi credentials not configured on the client. Please check environment variables.')
      return
    }

    try {
      setCallState('CONNECTING')
      isFinalizedRef.current = false

      // 1. Notify backend that interview is starting
      await apiClient.post(`/interview/${token}/start`)

      // 2. Initialize Vapi Web SDK
      const vapi = new Vapi(publicKey)
      vapiRef.current = vapi

      vapi.on('call-start', () => {
        setCallState('ACTIVE')
      })

      // When the assistant or connection naturally ends
      vapi.on('call-end', () => {
        finalizeInterview('ASSISTANT_ENDED')
      })

      vapi.on('speech-start', () => {
        setIsSpeaking(true)
      })

      vapi.on('speech-end', () => {
        setIsSpeaking(false)
      })

      vapi.on('volume-level', (level: number) => {
        setVolumeLevel(level)
      })

      vapi.on('message', (message: any) => {
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          const newMsg = {
            role: (message.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
            text: message.transcript || ''
          }
          liveMessagesRef.current = [...liveMessagesRef.current, newMsg]
          setLiveMessages((prev) => [...prev, newMsg])
        }
      })

      vapi.on('error', (err: any) => {
        console.error('Vapi Web SDK error:', err)
        if (callStateRef.current === 'ACTIVE') {
          finalizeInterview('DISCONNECTED')
        } else {
          setErrorMsg(err.message || 'Voice communication error occurred.')
          setCallState('LOBBY')
        }
      })

      // 3. Start call with variable overrides matching assistant template
      await vapi.start(assistantId, {
        variableValues: {
          candidateName: interviewContext?.candidateName || 'Candidate',
          jobTitle: interviewContext?.jobTitle || 'Role',
          companyName: interviewContext?.companyName || 'Company',
          jobRequirements: interviewContext?.jobRequirements || 'Technical skills',
          candidateSkills: interviewContext?.candidateSkills || 'Core competencies',
          experienceLevel: interviewContext?.experienceLevel || 'MID',
          experienceSummary: interviewContext?.experienceSummary || 'Professional background'
        },
        metadata: {
          token: token,
          applicationId: interviewContext?.applicationId || ''
        }
      })
    } catch (err: any) {
      console.error('Failed to start Vapi call:', err)
      setErrorMsg(err.message || 'Failed to establish voice connection. Please ensure microphone access is permitted.')
      setCallState('LOBBY')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-sm font-medium text-slate-400">Loading AI Voice Interview session...</p>
        </div>
      </div>
    )
  }

  if (errorMsg && !interviewContext) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-rose-500/20">
            ⚠️
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Interview Unavailable</h1>
            <p className="text-sm text-slate-400 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-[#146BFF] selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              H
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block leading-tight">Hirevia</span>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">AI Voice Interview</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${callState === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {callState === 'ACTIVE' ? 'Live Session' : callState === 'CONNECTING' ? 'Connecting...' : 'Secure Interview'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 py-8 w-full flex-1 flex flex-col justify-center">
        {callState === 'LOBBY' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8 animate-fadeIn">
            {/* Top Badge & Title */}
            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">
                <span>🎙️</span> AI Voice Screening
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {interviewContext?.jobTitle}
              </h1>
              <p className="text-sm sm:text-base text-slate-400">
                Welcome, <strong className="text-slate-200">{interviewContext?.candidateName}</strong>. You are interviewing for the position at <strong className="text-slate-200">{interviewContext?.companyName}</strong>.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 leading-relaxed">
                {errorMsg}
              </div>
            )}

            {/* Instructions Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="text-xl">🎧</div>
                <h2 className="text-sm font-bold text-white">Quiet Environment</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Find a quiet place and wear headphones for the clearest audio experience.
                </p>
              </div>

              <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="text-xl">🎙️</div>
                <h2 className="text-sm font-bold text-white">Microphone Enabled</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your browser will ask for microphone permissions when starting the call.
                </p>
              </div>

              <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="text-xl">💬</div>
                <h2 className="text-sm font-bold text-white">Natural Conversation</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Speak naturally. The AI interviewer will ask questions and conclude the session automatically.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                Deadline: {interviewContext?.expiresAt ? new Date(interviewContext.expiresAt).toLocaleDateString() : '7 days'}
              </span>
              <button
                type="button"
                onClick={handleStartInterview}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🎙️ Start Voice Interview</span>
              </button>
            </div>
          </div>
        )}

        {callState === 'CONNECTING' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center shadow-2xl space-y-6 max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto text-blue-400 animate-spin">
              <LoadingSpinner />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Connecting to AI Voice Assistant...</h2>
              <p className="text-xs text-slate-400">Setting up secure WebRTC audio session and microphone channel.</p>
            </div>
          </div>
        )}

        {callState === 'ACTIVE' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 flex flex-col h-[600px]">
            {/* Call Header - No manual finish button */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-white">{interviewContext?.jobTitle}</h2>
                <p className="text-xs text-slate-400">{interviewContext?.companyName}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-mono font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  {formatDuration(duration)}
                </div>
              </div>
            </div>

            {/* Pulsing Visualizer */}
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <div className="relative flex items-center justify-center">
                {/* Outer ripple */}
                <div
                  className="absolute w-28 h-28 rounded-full bg-blue-500/20 transition-all duration-300"
                  style={{
                    transform: `scale(${1 + (isSpeaking ? volumeLevel * 1.5 : 0.1)})`,
                    opacity: isSpeaking ? 0.8 : 0.2
                  }}
                ></div>
                {/* Inner ripple */}
                <div
                  className="absolute w-20 h-20 rounded-full bg-indigo-500/40 transition-all duration-200"
                  style={{
                    transform: `scale(${1 + (isSpeaking ? volumeLevel * 0.8 : 0.05)})`,
                    opacity: isSpeaking ? 0.9 : 0.3
                  }}
                ></div>
                {/* Center mic orb */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-xl z-10">
                  🎙️
                </div>
              </div>

              <span className="text-xs font-semibold text-slate-400">
                {isSpeaking ? 'AI is speaking...' : 'Listening to you...'}
              </span>
            </div>

            {/* Live Transcript Stream */}
            <div className="flex-1 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 overflow-y-auto space-y-3">
              {liveMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                  Conversation transcript will appear here in real-time...
                </div>
              ) : (
                liveMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === 'assistant' ? 'items-start' : 'items-end'}`}
                  >
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {msg.role === 'assistant' ? 'AI Interviewer' : 'You'}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.role === 'assistant'
                          ? 'bg-slate-800 text-slate-200 border border-slate-700'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}

        {callState === 'ENDED' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl space-y-6 max-w-lg mx-auto animate-fadeIn">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-lg">
              ✨
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Interview Complete!</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Thank you for completing your voice interview for <strong>{interviewContext?.jobTitle}</strong> at <strong>{interviewContext?.companyName}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
              Your conversation transcript has been safely saved and submitted to the hiring team. They will review your conversation alongside your assessment and reach out regarding next steps.
            </div>

            <div className="pt-2">
              <p className="text-[11px] text-slate-500">You may now safely close this window.</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Hirevia Platform • AI-Assisted Talent Screening
      </footer>
    </div>
  )
}
