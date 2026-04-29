'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { submitQuizAction, getQuizStatusAction, getQuizAttemptsHistoryAction } from '@/lib/actions/quiz'
import { resetCourseProgressAction } from '@/lib/actions/progress'
import type { Question, QuestionOption, UserAnswers, QuizSubmitResult } from '@/lib/types/database'
import { markModuleCompleteAction } from '@/lib/actions/progress'

type QuizState = 'pre-quiz' | 'taking-quiz' | 'summary' | 'result'

interface QuizClientProps {
  courseId: string
  moduleId: string
  nextModuleId: string | null
  quizId: string
  passingScore: number
  maxAttempts: number
  questions: Question[]
}

export default function QuizClient({
  courseId,
  moduleId,
  nextModuleId,
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
  const [isUpdating, setIsUpdating] = useState(false) 
  const [quizStatus, setQuizStatus] = useState<{
    attemptsUsed: number
    attemptsRemaining: number
    hasPassedBefore: boolean
    lastScore: number | null
    isBlocked: boolean
  } | null>(null)
  const [quizResult, setQuizResult] = useState<QuizSubmitResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [attempts, setAttempts] = useState<{
    id: string
    score: number
    status: 'aprobado' | 'reprobado' | 'en_progreso'
    attempt_number: number
    completed_at: string
  }[]>([])

  // Fetch quiz status on mount - using useEffect to avoid calling during render
  useEffect(() => {
    async function loadStatus() {
      const [status, history] = await Promise.all([
        getQuizStatusAction(quizId, courseId),
        getQuizAttemptsHistoryAction(quizId, courseId),
      ])
      setQuizStatus({
        attemptsUsed: status.attemptsUsed,
        attemptsRemaining: status.attemptsRemaining,
        hasPassedBefore: status.hasPassedBefore,
        lastScore: status.lastScore,
        isBlocked: status.isBlocked,
      })
      setAttempts(history.attempts)
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
    setQuizState('summary')
    setIsSubmitting(false)
  }

const handleContinue = async () => {
    setIsUpdating(true)

    let courseCompleted = quizResult?.courseCompleted ?? false

    // Si ya aprobó antes pero no hay quizResult (recarga de página), marcar módulo completo
    if (quizStatus?.hasPassedBefore && !quizResult) {
      const result = await markModuleCompleteAction(moduleId, courseId)
      if (result.success) {
        courseCompleted = result.courseCompleted ?? false
      }
    }

    if (courseCompleted || !nextModuleId) {
      router.push(`/cursos/${courseId}`)
    } else {
      router.push(`/cursos/${courseId}/modulos/${nextModuleId}`)
    }
  }

  const handleRetry = () => {
    setAnswers({})
    setQuizState('pre-quiz')
    setQuizResult(null)
  }

  const handleResetProgress = () => {
    startTransition(async () => {
      await resetCourseProgressAction(courseId)
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
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-4 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#E74C3C]/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#E74C3C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--md-on-surface)] mb-3">Evaluación bloqueada</h2>
          <p className="text-[var(--md-on-surface-variant)] mb-6">
            Has agotado todos tus intentos. Debes volver a revisar el contenido del módulo antes de continuar.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleResetProgress}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2B4FA0] text-white rounded-lg font-semibold hover:bg-[#2B4FA0]/90 transition-colors disabled:opacity-50 min-h-[48px]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              {isPending ? 'Reiniciando...' : 'Reiniciar curso'}
            </button>
            <Link
              href={`/cursos/${courseId}/modulos/${moduleId}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--md-surface-container-high)] text-[var(--md-primary)] rounded-lg font-semibold hover:bg-[var(--md-surface-container-highest)] transition-colors min-h-[48px]"
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
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-4 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#27AE60]/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#27AE60]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--md-on-surface)] mb-3">Ya aprobaste esta evaluación</h2>
          <p className="text-[var(--md-on-surface-variant)] mb-6">
            Obtuviste <span className="font-bold text-[#27AE60]">{quizStatus.lastScore}%</span> en tu intento anterior.
          </p>

          {attempts.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden mb-6 text-left">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-[#1A1A2E]">Historial de intentos</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {attempts.map(attempt => {
                  const isPassed = attempt.status === 'aprobado'
                  const date = new Intl.DateTimeFormat('es-CL', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  }).format(new Date(attempt.completed_at))
                  return (
                    <div key={attempt.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#6B7280]">{attempt.attempt_number}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#6B7280]">{date}</p>
                      </div>
                      <span className={`text-sm font-extrabold ${isPassed ? 'text-[#27AE60]' : 'text-[#E74C3C]'}`}>
                        {attempt.score}%
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${isPassed ? 'bg-[#EAF3DE] text-[#27500A]' : 'bg-[#FAECE7] text-[#E74C3C]'}`}>
                        {isPassed ? 'Aprobado' : 'Reprobado'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={isPending || isUpdating}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#27AE60] text-white rounded-lg font-semibold hover:bg-[#27AE60]/90 transition-colors text-lg disabled:opacity-50 min-h-[48px] sm:min-h-auto"
          >
            {isUpdating ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando progreso...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Continuar al siguiente módulo
              </>
            )}
          </button>
        </div>
      )
    }

    // C) Puede intentar - mostrar pantalla inicial del quiz
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--md-tertiary-container)] flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--md-on-tertiary-container)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[var(--md-on-surface)]">Evaluación del módulo</h1>
              <p className="text-xs sm:text-sm text-[var(--md-on-surface-variant)]">Responde todas las preguntas para continuar</p>
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

            <div className="relative group">
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-[#2B4FA0] transition-colors rounded-full"
                aria-label="Información sobre intentos"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
              </button>

              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#1A1A2E] text-white text-xs rounded-xl p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                <p className="font-semibold mb-1">Sistema de intentos</p>
                <ul className="space-y-1 text-white/80">
                  <li>• Tienes {maxAttempts} intentos por evaluación</li>
                  <li>• Al agotar los intentos debes reiniciar el curso</li>
                  <li>• Tu mejor puntaje queda registrado</li>
                  <li>• El administrador puede habilitar nuevos intentos</li>
                </ul>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1A2E]" />
              </div>
            </div>

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

        {/* Historial de intentos */}
        {attempts.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#1A1A2E]">Historial de intentos</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {attempts.map(attempt => {
                const isPassed = attempt.status === 'aprobado'
                const date = new Intl.DateTimeFormat('es-CL', {
                  day: '2-digit', month: 'short', year: 'numeric',
                }).format(new Date(attempt.completed_at))
                return (
                  <div key={attempt.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#6B7280]">{attempt.attempt_number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#6B7280]">{date}</p>
                    </div>
                    <span className={`text-sm font-extrabold ${isPassed ? 'text-[#27AE60]' : 'text-[#E74C3C]'}`}>
                      {attempt.score}%
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${isPassed ? 'bg-[#EAF3DE] text-[#27500A]' : 'bg-[#FAECE7] text-[#E74C3C]'}`}>
                      {isPassed ? 'Aprobado' : 'Reprobado'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Botón comenzar */}
        <button
          onClick={() => setQuizState('taking-quiz')}
          className="w-full py-4 bg-[#2B4FA0] text-white font-semibold rounded-xl hover:bg-[#2B4FA0]/90 transition-colors flex items-center justify-center gap-2 text-lg min-h-[48px]"
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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--md-tertiary-container)] flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--md-on-tertiary-container)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[var(--md-on-surface)]">Evaluación del módulo</h1>
              <p className="text-xs sm:text-sm text-[var(--md-on-surface-variant)]">Responde todas las preguntas para continuar</p>
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
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-4 sm:p-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(answers).length < questions.length}
            className="w-full py-3 bg-[#2B4FA0] text-white font-semibold rounded-lg hover:bg-[#2B4FA0]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
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

  // ESTADO 3: Summary — revisión de respuestas antes de ver resultado final
  if (quizState === 'summary' && quizResult) {
    const passed = quizResult.passed
    const questionResults = quizResult.questionResults ?? {}
    const correctCount = Object.values(questionResults).filter(Boolean).length
    const totalCount = questions.length

    return (
      <div className="space-y-4 sm:space-y-6">

        {/* Header de resultado */}
        <div className={`rounded-2xl p-5 sm:p-6 text-center ${
          passed
            ? 'bg-[#EAF3DE] border border-[#27AE60]/20'
            : 'bg-[#FAECE7] border border-[#E74C3C]/20'
        }`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
            passed ? 'bg-[#27AE60]' : 'bg-[#E74C3C]'
          }`}>
            {passed ? (
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            ) : (
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            )}
          </div>
          <h2 className={`text-xl font-extrabold mb-1 ${passed ? 'text-[#27500A]' : 'text-[#E74C3C]'}`}>
            {passed ? '¡Aprobaste!' : 'No aprobaste esta vez'}
          </h2>
          <p className={`text-sm ${passed ? 'text-[#27500A]/70' : 'text-[#E74C3C]/80'}`}>
            Obtuviste{' '}
            <span className="font-extrabold text-lg">{quizResult.score}%</span>
            {' '}— {correctCount} de {totalCount} respuestas correctas
          </p>
        </div>

        {/* Resumen por pregunta */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#1A1A2E] px-1">Revisión de respuestas</h3>
          {questions.map((question, index) => {
            const isCorrect = questionResults[question.id] ?? false
            const userAnswer = answers[question.id]
            const options = question.options as QuestionOption[]
            const selectedOption = options.find(o => o.id === userAnswer)

            return (
              <div
                key={question.id}
                className={`rounded-xl border-2 p-4 ${
                  isCorrect
                    ? 'border-[#27AE60]/30 bg-[#EAF3DE]/50'
                    : 'border-[#E74C3C]/30 bg-[#FAECE7]/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isCorrect ? 'bg-[#27AE60]' : 'bg-[#E74C3C]'
                  }`}>
                    {isCorrect ? (
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#6B7280] mb-1">Pregunta {index + 1}</p>
                    <p className="text-sm font-medium text-[#1A1A2E] mb-2">{question.question_text}</p>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      isCorrect
                        ? 'bg-[#27AE60]/10 text-[#27500A]'
                        : 'bg-[#E74C3C]/10 text-[#E74C3C]'
                    }`}>
                      <span className="font-bold uppercase">{userAnswer})</span>
                      {selectedOption?.text ?? 'Sin respuesta'}
                    </div>
                    {!isCorrect && (
                      <p className="text-xs text-[#6B7280] mt-1.5">
                        Revisa el contenido del módulo para encontrar la respuesta correcta.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => setQuizState('result')}
            className={`w-full py-3.5 font-bold rounded-xl text-white transition-colors min-h-[48px] flex items-center justify-center gap-2 ${
              passed
                ? 'bg-[#27AE60] hover:bg-[#27AE60]/90'
                : quizResult.attemptsRemaining > 0
                  ? 'bg-[#2B4FA0] hover:bg-[#2B4FA0]/90'
                  : 'bg-[#E74C3C] hover:bg-[#E74C3C]/90'
            }`}
          >
            {passed
              ? 'Continuar →'
              : quizResult.attemptsRemaining > 0
                ? `Reintentar (${quizResult.attemptsRemaining} intento${quizResult.attemptsRemaining !== 1 ? 's' : ''} restante${quizResult.attemptsRemaining !== 1 ? 's' : ''})`
                : 'Ver resultado final'
            }
          </button>
          {!passed && (
            <Link
              href={`/cursos/${courseId}/modulos/${moduleId}`}
              className="w-full py-3.5 font-semibold rounded-xl border-2 border-slate-200 text-[#1A1A2E] hover:border-[#2B4FA0] transition-colors min-h-[48px] flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Revisar contenido del módulo
            </Link>
          )}
        </div>
      </div>
    )
  }

  // ESTADO 4: Result
  if (quizState === 'result' && quizResult) {
    const passed = quizResult.passed
    const attemptsRemaining = quizResult.attemptsRemaining

    // Leemos la nueva variable que nos envía el backend
    const isCourseCompleted = quizResult.courseCompleted

    if (passed) {
      // A) Aprobó
      return (
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.08)] p-4 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-[#27AE60] flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9V2h12v7" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12v8H6z" />
            </svg>
          </div>

          {/* TÍTULO DINÁMICO */}
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--md-on-surface)] mb-2">
            {isCourseCompleted ? '¡Felicitaciones, completaste el curso!' : '¡Felicitaciones, aprobaste!'}
          </h2>

          <p className="text-[var(--md-on-surface-variant)] mb-6">
            Obtuviste sobre el {passingScore}% requerido.
          </p>

          <div className="mb-8">
            <p className="text-sm text-[var(--md-on-surface-variant)] mb-1">Tu puntaje</p>
            <p className="text-4xl sm:text-5xl font-black text-[#27AE60]">
              {quizResult.score}%
            </p>
          </div>

          {/* BOTÓN DINÁMICO */}
          <button
            onClick={handleContinue}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#27AE60] text-white rounded-lg font-semibold hover:bg-[#27AE60]/90 transition-colors text-lg disabled:opacity-50 min-h-[48px] sm:min-h-auto"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isCourseCompleted ? (
                <path d="M12 15l-2 5l9-5l-9-5l2 5z" />
              ) : (
                <path d="M5 12h14M12 5l7 7-7 7" />
              )}
            </svg>
            {/* AQUÍ EL TEXTO CLARO */}
            {isCourseCompleted ? 'Volver al curso y ver certificado' : 'Continuar al siguiente módulo'}
          </button>
        </div>
      )
    }

    if (!passed && attemptsRemaining > 0) {
      // B) Reprobó pero le quedan intentos
      return (
        <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.08)] p-4 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-[#F5A623]/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 text-[#F5A623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[var(--md-on-surface)] mb-2">
            No alcanzaste el puntaje mínimo
          </h2>

          <p className="text-[var(--md-on-surface-variant)] mb-6">
            Necesitas {passingScore}% para aprobar. Te quedan <span className="font-bold">{attemptsRemaining}</span> intento(s).
          </p>

          <div className="mb-8">
            <p className="text-sm text-[var(--md-on-surface-variant)] mb-1">Tu puntaje</p>
            <p className="text-4xl sm:text-5xl font-black text-[#E74C3C]">
              {quizResult.score}%
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetry}
              className="w-full py-4 bg-[#2B4FA0] text-white rounded-lg font-semibold hover:bg-[#2B4FA0]/90 transition-colors flex items-center justify-center gap-2 text-lg min-h-[48px]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Reintentar evaluación
            </button>
            <Link
              href={`/cursos/${courseId}/modulos/${moduleId}`}
              className="w-full py-4 bg-[var(--md-surface-container-high)] text-[var(--md-primary)] rounded-lg font-semibold hover:bg-[var(--md-surface-container-highest)] transition-colors flex items-center justify-center gap-2 min-h-[48px]"
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
      <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.08)] p-4 sm:p-8 text-center">
        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-[#E74C3C]/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 sm:w-12 sm:h-12 text-[#E74C3C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-[var(--md-on-surface)] mb-2">
          Has agotado todos tus intentos
        </h2>

        <p className="text-[var(--md-on-surface-variant)] mb-6">
          Debes repasar el contenido del módulo y contactar a tu administrador para habilitar un nuevo intento.
        </p>

        <div className="mb-8">
          <p className="text-sm text-[var(--md-on-surface-variant)] mb-1">Tu puntaje</p>
          <p className="text-4xl sm:text-5xl font-black text-[#E74C3C]">
            {quizResult.score}%
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleResetProgress}
            disabled={isPending}
            className="w-full py-4 bg-[#2B4FA0] text-white rounded-lg font-semibold hover:bg-[#2B4FA0]/90 transition-colors flex items-center justify-center gap-2 text-lg disabled:opacity-50 min-h-[48px]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            {isPending ? 'Reiniciando...' : 'Reiniciar curso'}
          </button>
          <Link
            href={`/cursos/${courseId}/modulos/${moduleId}`}
            className="w-full py-4 bg-[var(--md-surface-container-high)] text-[var(--md-primary)] rounded-lg font-semibold hover:bg-[var(--md-surface-container-highest)] transition-colors flex items-center justify-center gap-2 min-h-[48px]"
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
                  flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all min-h-[48px]
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
