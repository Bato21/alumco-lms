'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { submitQuizAction, getQuizStatusAction } from '@/lib/actions/quiz'
import { resetModuleProgressAction } from '@/lib/actions/progress'
import type { Question, QuestionOption, UserAnswers, QuizSubmitResult } from '@/lib/types/database'

type QuizState = 'pre-quiz' | 'taking-quiz' | 'result'

interface QuizClientProps {
  courseId: string
  moduleId: string
  previousModuleId: string | null
  quizId: string
  passingScore: number
  maxAttempts: number
  questions: Question[]
}

export default function QuizClient({
  courseId,
  moduleId,
  previousModuleId,
  quizId,
  passingScore,
  maxAttempts,
  questions,
}: QuizClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [quizState, setQuizState] = useState<QuizState>('pre-quiz')
  const [answers, setAnswers] = useState<UserAnswers>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quizStatus, setQuizStatus] = useState<{
    attemptsUsed: number
    attemptsRemaining: number
    hasPassedBefore: boolean
    lastScore: number | null
    isBlocked: boolean
  } | null>(null)
  const [quizResult, setQuizResult] = useState<QuizSubmitResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch quiz status on mount - using useEffect to avoid calling during render
  useEffect(() => {
    async function loadStatus() {
      const status = await getQuizStatusAction(quizId, courseId)
      setQuizStatus({
        attemptsUsed: status.attemptsUsed,
        attemptsRemaining: status.attemptsRemaining,
        hasPassedBefore: status.hasPassedBefore,
        lastScore: status.lastScore,
        isBlocked: status.isBlocked,
      })
      setIsLoading(false)
    }
    loadStatus()
  }, [quizId, courseId])

  const handleAnswerSelect = (questionId: string, option: 'a' | 'b' | 'c' | 'd') => {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const handleSubmit = async () => {
    if (!quizId) return

    setIsSubmitting(true)

    const result = await submitQuizAction(quizId, moduleId, courseId, answers)

    setQuizResult(result)
    setQuizState('result')
    setIsSubmitting(false)
  }

  const handleRetry = () => {
    setAnswers({})
    setQuizState('pre-quiz')
    setQuizResult(null)
  }

  const handleResetProgress = () => {
    startTransition(async () => {
      await resetModuleProgressAction(moduleId, courseId, previousModuleId ?? undefined)
      router.push(`/cursos/${courseId}`)
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 animate-spin text-[#2B4FA0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-[var(--md-on-surface-variant)]">Cargando evaluación...</span>
        </div>
      </div>
    )
  }

  // ESTADO 1: Pre-quiz
  if (quizState === 'pre-quiz') {
    if (!quizStatus) {
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 animate-spin text-[#2B4FA0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-[var(--md-on-surface-variant)]">Cargando...</span>
          </div>
        </div>
      )
    }

    // A) Quiz bloqueado
    if (quizStatus.isBlocked) {
      return (
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#E74C3C]/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#E74C3C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--md-on-surface)] mb-3">Evaluación bloqueada</h2>
          <p className="text-[var(--md-on-surface-variant)] mb-6">
            Has agotado todos tus intentos. Debes volver a revisar el contenido del módulo antes de continuar.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleResetProgress}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2B4FA0] text-white rounded-lg font-semibold hover:bg-[#2B4FA0]/90 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              {isPending ? 'Reiniciando...' : 'Reiniciar curso'}
            </button>
            <Link
              href={`/cursos/${courseId}/modulos/${moduleId}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--md-surface-container-high)] text-[var(--md-primary)] rounded-lg font-semibold hover:bg-[var(--md-surface-container-highest)] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Volver al módulo
            </Link>
          </div>
        </div>
      )
    }

    // B) Ya aprobó antes
    if (quizStatus.hasPassedBefore) {
      return (
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#27AE60]/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#27AE60]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--md-on-surface)] mb-3">Ya aprobaste esta evaluación</h2>
          <p className="text-[var(--md-on-surface-variant)] mb-6">
            Obtuviste <span className="font-bold text-[#27AE60]">{quizStatus.lastScore}%</span> en tu intento anterior.
          </p>
          <Link
            href={`/cursos/${courseId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#27AE60] text-white rounded-lg font-semibold hover:bg-[#27AE60]/90 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Continuar al siguiente módulo
          </Link>
        </div>
      )
    }

    // C) Puede intentar - mostrar pantalla inicial del quiz
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--md-tertiary-container)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--md-on-tertiary-container)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--md-on-surface)]">Evaluación del módulo</h1>
              <p className="text-sm text-[var(--md-on-surface-variant)]">Responde todas las preguntas para continuar</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`
              inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium
              ${quizStatus.attemptsUsed > 0
                ? 'bg-[#F5A623]/10 text-[#F5A623]'
                : 'bg-[#2B4FA0]/10 text-[#2B4FA0]'
              }
            `}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20" />
              </svg>
              Intento {quizStatus.attemptsUsed + 1} de {maxAttempts}
            </span>
            <span className="text-sm text-[var(--md-on-surface-variant)]">
              Puntaje mínimo: <span className="font-semibold text-[var(--md-on-surface)]">{passingScore}%</span>
            </span>
          </div>
        </div>

        {/* Info del quiz */}
        <div className="flex items-center gap-4 text-sm text-[var(--md-on-surface-variant)] px-2">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            {questions.length} preguntas
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            ~{questions.length * 2} minutos
          </span>
        </div>

        {/* Botón comenzar */}
        <button
          onClick={() => setQuizState('taking-quiz')}
          className="w-full py-4 bg-[#2B4FA0] text-white font-semibold rounded-xl hover:bg-[#2B4FA0]/90 transition-colors flex items-center justify-center gap-2 text-lg"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          Comenzar evaluación
        </button>
      </div>
    )
  }

  // ESTADO 2: Taking quiz
  if (quizState === 'taking-quiz') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--md-tertiary-container)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--md-on-tertiary-container)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--md-on-surface)]">Evaluación del módulo</h1>
              <p className="text-sm text-[var(--md-on-surface-variant)]">Responde todas las preguntas para continuar</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-[var(--md-on-surface-variant)]">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              {questions.length} preguntas
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              ~{questions.length * 2} minutos
            </span>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              selectedAnswer={answers[question.id]}
              onSelect={(option) => handleAnswerSelect(question.id, option)}
            />
          ))}
        </div>

        {/* Submit Button */}
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(answers).length < questions.length}
            className="w-full py-3 bg-[#2B4FA0] text-white font-semibold rounded-lg hover:bg-[#2B4FA0]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Enviar evaluación
              </>
            )}
          </button>

          <p className="text-center text-sm text-[var(--md-on-surface-variant)] mt-3">
            Has respondido {Object.keys(answers).length} de {questions.length} preguntas
          </p>
        </div>
      </div>
    )
  }

  // ESTADO 3: Result
  if (quizState === 'result' && quizResult) {
    const passed = quizResult.passed
    const attemptsRemaining = quizResult.attemptsRemaining

    if (passed) {
      // A) Aprobó
      return (
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.08)] p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-[#27AE60] flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9V2h12v7" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12v8H6z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-[var(--md-on-surface)] mb-2">
            ¡Felicitaciones, aprobaste!
          </h2>

          <p className="text-[var(--md-on-surface-variant)] mb-6">
            Obtuviste sobre el {passingScore}% requerido.
          </p>

          <div className="mb-8">
            <p className="text-sm text-[var(--md-on-surface-variant)] mb-1">Tu puntaje</p>
            <p className="text-5xl font-black text-[#27AE60]">
              {quizResult.score}%
            </p>
          </div>

          <Link
            href={`/cursos/${courseId}`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#27AE60] text-white rounded-lg font-semibold hover:bg-[#27AE60]/90 transition-colors text-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Continuar al siguiente módulo
          </Link>
        </div>
      )
    }

    if (!passed && attemptsRemaining > 0) {
      // B) Reprobó pero le quedan intentos
      return (
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.08)] p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-[#F5A623]/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-[#F5A623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-[var(--md-on-surface)] mb-2">
            No alcanzaste el puntaje mínimo
          </h2>

          <p className="text-[var(--md-on-surface-variant)] mb-6">
            Necesitas {passingScore}% para aprobar. Te quedan <span className="font-bold">{attemptsRemaining}</span> intento(s).
          </p>

          <div className="mb-8">
            <p className="text-sm text-[var(--md-on-surface-variant)] mb-1">Tu puntaje</p>
            <p className="text-5xl font-black text-[#E74C3C]">
              {quizResult.score}%
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetry}
              className="w-full py-4 bg-[#2B4FA0] text-white rounded-lg font-semibold hover:bg-[#2B4FA0]/90 transition-colors flex items-center justify-center gap-2 text-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Reintentar evaluación
            </button>
            <Link
              href={`/cursos/${courseId}/modulos/${moduleId}`}
              className="w-full py-4 bg-[var(--md-surface-container-high)] text-[var(--md-primary)] rounded-lg font-semibold hover:bg-[var(--md-surface-container-highest)] transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              Repasar el contenido
            </Link>
          </div>
        </div>
      )
    }

    // C) Reprobó y agotó intentos
    return (
      <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.08)] p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-[#E74C3C]/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-[#E74C3C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-[var(--md-on-surface)] mb-2">
          Has agotado todos tus intentos
        </h2>

        <p className="text-[var(--md-on-surface-variant)] mb-6">
          Debes repasar el contenido del módulo y contactar a tu administrador para habilitar un nuevo intento.
        </p>

        <div className="mb-8">
          <p className="text-sm text-[var(--md-on-surface-variant)] mb-1">Tu puntaje</p>
          <p className="text-5xl font-black text-[#E74C3C]">
            {quizResult.score}%
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleResetProgress}
            disabled={isPending}
            className="w-full py-4 bg-[#2B4FA0] text-white rounded-lg font-semibold hover:bg-[#2B4FA0]/90 transition-colors flex items-center justify-center gap-2 text-lg disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            {isPending ? 'Reiniciando...' : 'Reiniciar curso'}
          </button>
          <Link
            href={`/cursos/${courseId}/modulos/${moduleId}`}
            className="w-full py-4 bg-[var(--md-surface-container-high)] text-[var(--md-primary)] rounded-lg font-semibold hover:bg-[var(--md-surface-container-highest)] transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver al módulo
          </Link>
        </div>
      </div>
    )
  }

  return null
}

function QuestionCard({
  question,
  index,
  selectedAnswer,
  onSelect,
}: {
  question: Question
  index: number
  selectedAnswer?: string
  onSelect: (option: 'a' | 'b' | 'c' | 'd') => void
}) {
  const options = question.options as QuestionOption[]

  return (
    <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-6">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] flex items-center justify-center font-bold text-sm shrink-0">
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="text-[var(--md-on-surface)] font-medium mb-4">{question.question_text}</p>

          <div className="space-y-2">
            {options.map((option) => (
              <label
                key={option.id}
                className={`
                  flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all
                  ${selectedAnswer === option.id
                    ? 'bg-[var(--md-primary-container)] border-2 border-[var(--md-primary)]'
                    : 'bg-[var(--md-surface-container-low)] border-2 border-transparent hover:bg-[var(--md-surface-container)]'
                  }
                `}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={selectedAnswer === option.id}
                  onChange={() => onSelect(option.id)}
                  className="sr-only"
                />
                <span className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                  ${selectedAnswer === option.id
                    ? 'bg-[var(--md-primary)] border-[var(--md-primary)] text-white'
                    : 'border-[var(--md-outline)]'
                  }
                `}
                >
                  {selectedAnswer === option.id && (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                </span>
                <div className="flex-1">
                  <span className="font-semibold text-sm text-[var(--md-on-surface)]">{option.id.toUpperCase()}){' '}</span>
                  <span className="text-[var(--md-on-surface)]">{option.text}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
