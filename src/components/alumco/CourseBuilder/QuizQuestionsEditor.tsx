'use client'

import { useState, useTransition } from 'react'
import { deleteQuestionAction } from '@/lib/actions/admin-questions'
import QuestionForm from './QuestionForm'
import { type Question } from '@/lib/types/database'

interface QuizQuestionsEditorProps {
  quizId: string
  courseId: string
  existingQuestions: Question[]
  onDirty?: () => void
}

export default function QuizQuestionsEditor({
  quizId,
  courseId,
  existingQuestions,
  onDirty,
}: QuizQuestionsEditorProps) {
  const [questions, setQuestions] = useState<Question[]>(existingQuestions)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleQuestionSaved() {
    try {
      const { getQuestionsAction } = await import('@/lib/actions/admin-questions')
      const result = await getQuestionsAction(quizId)
      if (result.success && result.questions) {
        setQuestions(result.questions)
        onDirty?.()
      }
    } catch {
      // preguntas ya guardadas en DB — la lista se actualizará en próxima apertura
    }
  }

  function handleDelete(questionId: string) {
    if (!confirm('¿Eliminar esta pregunta?')) return

    setQuestions(prev => prev.filter(q => q.id !== questionId))
    setDeletingId(questionId)
    onDirty?.()

    startTransition(async () => {
      const result = await deleteQuestionAction(questionId, courseId)
      if (!result.success) {
        setQuestions(existingQuestions)
      }
      setDeletingId(null)
    })
  }

  const nextOrderIndex = questions.length + 1

  return (
    <div className="space-y-4">
      {/* Lista de preguntas */}
      {questions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[#1A1A2E]">
            Preguntas ({questions.length})
          </h4>
          <div className="space-y-2">
            {questions.map((q) => (
              <div
                key={q.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2B4FA0]/10 text-xs font-bold text-[#2B4FA0] shrink-0">
                  {q.order_index}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1A1A2E] line-clamp-2">
                    {q.question_text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Correcta: <span className="font-semibold">{q.correct_option.toUpperCase()}</span>
                    {' · '}{Array.isArray(q.options) ? q.options.length : 0} alternativas
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={isPending && deletingId === q.id}
                  className="p-1.5 rounded-md hover:bg-[#FAECE7] text-muted-foreground hover:text-[#E74C3C] transition-colors shrink-0 disabled:opacity-50"
                  aria-label="Eliminar pregunta"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/>
                    <path d="M14 11v6"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {questions.length === 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground bg-[#F5F5F5] rounded-lg">
          No hay preguntas aún. Agrega la primera pregunta abajo.
        </div>
      )}

      {/* Formulario */}
      <QuestionForm
        quizId={quizId}
        courseId={courseId}
        nextOrderIndex={nextOrderIndex}
        onSuccess={handleQuestionSaved}
      />
    </div>
  )
}