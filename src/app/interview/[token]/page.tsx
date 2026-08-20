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
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8 flex flex-col items-center text-center animate-fadeIn">
            {/* Call Header */}
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-0.5 text-left">
                <h2 className="text-base font-bold text-white">{interviewContext?.jobTitle}</h2>
                <p className="text-xs text-slate-400">{interviewContext?.companyName}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  {formatDuration(duration)}
                </div>
              </div>
            </div>

            {/* AI Voice Visual: Glowing Orb & Dynamic Waveform */}
            <div className="py-6 flex flex-col items-center justify-center space-y-6">
              <div className="relative flex items-center justify-center">
                {/* Outermost ambient glow aura */}
                <div
                  className="absolute w-48 h-48 rounded-full bg-blue-500/15 blur-2xl transition-all duration-500 pointer-events-none"
                  style={{
                    transform: `scale(${1 + (isSpeaking ? volumeLevel * 1.8 : 0.15)})`,
                    opacity: isSpeaking ? 0.9 : 0.35
                  }}
                />

                {/* Outer pulsing ripple ring */}
                <div
                  className="absolute w-40 h-40 rounded-full border border-blue-500/30 bg-blue-500/10 transition-all duration-300 pointer-events-none"
                  style={{
                    transform: `scale(${1 + (isSpeaking ? volumeLevel * 1.2 : 0.08)})`,
                    opacity: isSpeaking ? 0.85 : 0.3
                  }}
                />

                {/* Inner pulsing ripple ring */}
                <div
                  className="absolute w-32 h-32 rounded-full border border-indigo-500/40 bg-indigo-500/20 transition-all duration-200 pointer-events-none"
                  style={{
                    transform: `scale(${1 + (isSpeaking ? volumeLevel * 0.7 : 0.04)})`,
                    opacity: isSpeaking ? 0.95 : 0.4
                  }}
                />

                {/* Symmetrical Audio Waveform Bars (Left) */}
                <div className="absolute -left-16 sm:-left-20 flex items-center gap-1">
                  {[40, 70, 100, 60, 30].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-full transition-all duration-150"
                      style={{
                        height: `${Math.max(8, (isSpeaking ? volumeLevel * 30 : 6) * (h / 100))}px`,
                        opacity: isSpeaking ? 0.9 : 0.25
                      }}
                    />
                  ))}
                </div>

                {/* Central Mic Orb */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#146BFF] via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_40px_rgba(20,107,255,0.45)] border-2 border-blue-300/40 z-10 transform transition-transform duration-200">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>

                {/* Symmetrical Audio Waveform Bars (Right) */}
                <div className="absolute -right-16 sm:-right-20 flex items-center gap-1">
                  {[30, 60, 100, 70, 40].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-full transition-all duration-150"
                      style={{
                        height: `${Math.max(8, (isSpeaking ? volumeLevel * 30 : 6) * (h / 100))}px`,
                        opacity: isSpeaking ? 0.9 : 0.25
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Status Headings & Active Pill */}
              <div className="space-y-2 max-w-sm mx-auto">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Interview in Progress
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Your answers are being recorded securely.
                </p>

                <div className="pt-2">
                  <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isSpeaking
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-300 shadow-sm'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-blue-400 animate-ping' : 'bg-emerald-400'}`} />
                    {isSpeaking ? 'AI Interviewer is speaking...' : 'Listening to your response...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy Information Card */}
            <div className="w-full max-w-md bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-4.5 flex items-start sm:items-center gap-3.5 shadow-lg shadow-black/30 text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#146BFF] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-200">Secure &amp; Private</h4>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                    Encrypted
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                  Your responses are being recorded and will be used for evaluation purposes only.
                </p>
              </div>
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
