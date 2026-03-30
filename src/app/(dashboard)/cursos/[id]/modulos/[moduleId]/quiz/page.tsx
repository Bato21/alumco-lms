'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { markModuleCompleteAction } from '@/lib/actions/progress'
import type { Question, QuestionOption, UserAnswers } from '@/lib/types/database'

interface QuizPageProps {
  params: Promise<{
    id: string
    moduleId: string
  }>
}

export default function QuizPage({ params }: QuizPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ courseId: string; moduleId: string } | null>(null)

  useEffect(() => {
    params.then(p => setResolvedParams({ courseId: p.id, moduleId: p.moduleId }))
  }, [params])

  useEffect(() => {
    params.then(p => setResolvedParams(p))
  }, [params])

  if (!resolvedParams) {
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

  return (
    <div className="max-w-3xl mx-auto">
      <QuizContent params={resolvedParams} />
    </div>
  )
}

function QuizContent({ params }: { params: { courseId: string; moduleId: string } | null }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<UserAnswers>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [result, setResult] = useState<{ score: number; status: string } | null>(null)
  const [quizId, setQuizId] = useState<string | null>(null)

  // Fetch quiz data on mount
  useEffect(() => {
    const fetchQuiz = async () => {
      const supabase = createClient()
      const { data: quiz } = await supabase
        .from('quizzes')
        .select('id, passing_score, max_attempts')
        .eq('module_id', params.moduleId)
        .single()

      if (quiz) {
        setQuizId(quiz.id)
        const { data: questionsData } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quiz.id)
          .order('order_index')

        if (questionsData) {
          setQuestions(questionsData)
        }
      }
      setIsLoading(false)
    }

    fetchQuiz()
  }, [params.moduleId])

  const handleAnswerSelect = (questionId: string, option: 'a' | 'b' | 'c' | 'd') => {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const handleSubmit = async () => {
    if (!quizId) return

    setIsSubmitting(true)
    const supabase = createClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    // Get quiz passing score
    const { data: quizData } = await supabase
      .from('quizzes')
      .select('passing_score')
      .eq('id', quizId)
      .single()

    const passingScore = quizData?.passing_score || 70

    // Calculate score
    let correct = 0
    questions.forEach(q => {
      if (answers[q.id] === q.correct_option) {
        correct++
      }
    })
    const score = Math.round((correct / questions.length) * 100)
    const status = score >= passingScore ? 'aprobado' : 'reprobado'

    // Submit attempt
    const { data: attempt } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: userData.user.id,
        score,
        status,
        answers,
      })
      .select()
      .single()

    if (attempt) {
      setResult({ score, status })

      // If passed, mark module as complete
      if (status === 'aprobado') {
        await markModuleCompleteAction(params.moduleId, params.courseId)
      }
    }

    setIsSubmitting(false)
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

  if (result) {
    return (
      <QuizResult
        result={result}
        courseId={params.courseId}
        moduleId={params.moduleId}
      />
    )
  }

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
              Enviar respuestas
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

function QuizResult({
  result,
  courseId,
  moduleId,
}: {
  result: { score: number; status: string }
  courseId: string
  moduleId: string
}) {
  const isPassed = result.status === 'aprobado'

  return (
    <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.08)] p-8 text-center">
      <div className={`
        w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6
        ${isPassed ? 'bg-[#27AE60]' : 'bg-[#9e3f4e]'}
      `}
      >
        {isPassed ? (
          <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        ) : (
          <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </div>

      <h2 className="text-2xl font-bold text-[var(--md-on-surface)] mb-2">
        {isPassed ? '¡Felicitaciones!' : 'No alcanzaste la nota mínima'}
      </h2>

      <p className="text-[var(--md-on-surface-variant)] mb-6">
        {isPassed
          ? 'Has aprobado el módulo. Puedes continuar con el siguiente.'
          : 'Necesitas al menos un 70% para aprobar. Puedes intentarlo de nuevo.'}
      </p>

      <div className="mb-8">
        <p className="text-sm text-[var(--md-on-surface-variant)] mb-1">Tu puntaje</p>
        <p className={`
          text-5xl font-black
          ${isPassed ? 'text-[#27AE60]' : 'text-[#9e3f4e]'}
        `}>
          {result.score}%
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href={`/cursos/${courseId}/modulos/${moduleId}`}
          className={`
            inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors
            ${isPassed
              ? 'bg-[#27AE60] text-white hover:bg-[#27AE60]/90'
              : 'bg-[#2B4FA0] text-white hover:bg-[#2B4FA0]/90'
            }
          `}
        >
          {isPassed ? (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
              Continuar
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Reintentar
            </>
          )}
        </Link>

        {!isPassed && (
          <Link
            href={`/cursos/${courseId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--md-surface-container-high)] text-[var(--md-primary)] rounded-lg font-semibold hover:bg-[var(--md-surface-container-highest)] transition-colors"
          >
            Volver al curso
          </Link>
        )}
      </div>
    </div>
  )
}
