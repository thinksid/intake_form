'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseVoiceRecognitionOptions {
  language?: 'en-US' | 'es-ES' | 'es-MX'
  continuous?: boolean
  interimResults?: boolean
}

interface UseVoiceRecognitionReturn {
  isListening: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  setLanguage: (lang: 'en-US' | 'es-ES' | 'es-MX') => void
  currentLanguage: string
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(options.language || 'en-US')

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition

      setIsSupported(!!SpeechRecognition)

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = options.continuous ?? true
        recognition.interimResults = options.interimResults ?? true
        recognition.lang = currentLanguage

        recognition.onresult = (event: any) => {
          let interim = ''
          let final = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i][0].transcript

            if (event.results[i].isFinal) {
              final += result + ' '
            } else {
              interim += result
            }
          }

          if (final) {
            setTranscript((prev) => prev + final)
          }
          setInterimTranscript(interim)
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setError(event.error)
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
          setInterimTranscript('')
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [currentLanguage, options.continuous, options.interimResults])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setError(null)
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.error('Failed to start recognition:', e)
      }
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  const setLanguage = useCallback((lang: 'en-US' | 'es-ES' | 'es-MX') => {
    setCurrentLanguage(lang)
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang
    }
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage,
    currentLanguage,
  }
}
