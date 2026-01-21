'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, RotateCcw, AlertCircle } from 'lucide-react'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'

interface VoiceInputProps {
  onTranscriptChange: (newText: string) => void
  onReset: () => void
  currentText: string
}

export default function VoiceInput({ onTranscriptChange, onReset, currentText }: VoiceInputProps) {
  const {
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
  } = useVoiceRecognition({
    continuous: true,
    interimResults: true,
  })

  // Store the text that existed when recording started
  const textBeforeRecordingRef = useRef('')
  const lastProcessedTranscriptRef = useRef('')

  const handleStart = useCallback(() => {
    // Capture current text before starting
    textBeforeRecordingRef.current = currentText
    lastProcessedTranscriptRef.current = ''
    resetTranscript()
    startListening()
  }, [currentText, resetTranscript, startListening])

  const handleStop = useCallback(() => {
    stopListening()
  }, [stopListening])

  // Only update parent when transcript changes AND we're listening
  useEffect(() => {
    if (isListening && transcript && transcript !== lastProcessedTranscriptRef.current) {
      lastProcessedTranscriptRef.current = transcript
      const baseText = textBeforeRecordingRef.current
      const newText = baseText ? `${baseText} ${transcript}` : transcript
      onTranscriptChange(newText)
    }
  }, [transcript, isListening, onTranscriptChange])

  const handleToggle = () => {
    if (isListening) {
      handleStop()
    } else {
      handleStart()
    }
  }

  const handleReset = () => {
    resetTranscript()
    textBeforeRecordingRef.current = ''
    lastProcessedTranscriptRef.current = ''
    onReset()
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <div className="flex items-center gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Voice input is not supported in your browser. Please use text input instead.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Language Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={currentLanguage === 'en-US' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setLanguage('en-US')}
          disabled={isListening}
          className="rounded-xl"
        >
          English
        </Button>
        <Button
          type="button"
          variant={currentLanguage.startsWith('es') ? 'default' : 'outline'}
          size="sm"
          onClick={() => setLanguage('es-ES')}
          disabled={isListening}
          className="rounded-xl"
        >
          Espanol
        </Button>
      </div>

      {/* Record Button - Electric Lime for prominent CTA */}
      <div className="flex gap-3">
        <Button
          type="button"
          size="xl"
          variant={isListening ? 'destructive' : 'cta'}
          onClick={handleToggle}
          className={`flex-1 py-7 ${isListening ? '' : 'shadow-elevated hover:shadow-card'}`}
        >
          {isListening ? (
            <>
              <MicOff className="w-7 h-7 mr-3" />
              <span className="text-lg">Stop Recording</span>
            </>
          ) : (
            <>
              <Mic className="w-7 h-7 mr-3" />
              <span className="text-lg">Tap to Speak</span>
            </>
          )}
        </Button>

        {currentText && (
          <Button
            type="button"
            variant="outline"
            size="xl"
            onClick={handleReset}
            className="py-7 px-6"
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
        )}
      </div>

      {/* Listening Indicator */}
      {isListening && (
        <div className="p-5 bg-electric-lime/20 border-2 border-electric-lime/40 rounded-2xl animate-pulse-soft">
          <div className="flex items-center gap-3 mb-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <p className="text-base font-semibold text-thinksid-navy">
              Listening...
            </p>
          </div>
          <p className="text-base text-thinksid-navy/80 leading-relaxed">
            {textBeforeRecordingRef.current}
            {transcript ? ` ${transcript}` : ''}
            {interimTranscript ? (
              <span className="text-thinksid-navy/50">{` ${interimTranscript}`}</span>
            ) : ''}
            {!transcript && !interimTranscript && (
              <span className="text-slate-gray italic">Start speaking...</span>
            )}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl animate-slide-up">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              {error === 'not-allowed'
                ? 'Microphone access denied. Please allow microphone access and try again.'
                : `Error: ${error}. Please try again or use text input.`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
