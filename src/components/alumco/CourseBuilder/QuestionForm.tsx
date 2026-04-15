'use client'

import { useState } from 'react'
import { saveQuestionAction } from '@/lib/actions/admin-questions'

interface Option {
  id: string
  text: string
}

interface QuestionFormProps {
  quizId: string
  courseId: string
  nextOrderIndex: number
  onSuccess?: () => void
}

const OPTION_IDS = ['a', 'b', 'c', 'd', 'e']

export default function QuestionForm({
  quizId,
  courseId,
  nextOrderIndex,
  onSuccess,
}: QuestionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState<Option[]>([
    { id: 'a', text: '' },
    { id: 'b', text: '' },
    { id: 'c', text: '' },
    { id: 'd', text: '' },
  ])
  const [correctOption, setCorrectOption] = useState('a')

  function handleOptionChange(id: string, text: string) {
    setOptions(options.map(o => o.id === id ? { ...o, text } : o))
  }

  function addOption() {
    if (options.length >= 5) return
    const nextId = OPTION_IDS[options.length]
    setOptions([...options, { id: nextId, text: '' }])
  }

  function removeOption(id: string) {
    if (options.length <= 2) return
    const updated = options.filter(o => o.id !== id)
    setOptions(updated)
    if (correctOption === id) setCorrectOption(updated[0].id)
  }

  async function handleSubmit() {
    setError(null)

    if (!quizId || quizId === '') {
      setError('El módulo necesita sincronizarse. Recarga la página (F5) antes de agregar preguntas.')
      return
    }
    if (!questionText.trim()) {
      setError('La pregunta no puede estar vacía.')
      return
    }
    if (options.some(o => !o.text.trim())) {
      setError('Todas las alternativas deben tener texto.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await saveQuestionAction({
        quiz_id: quizId,
        question_text: questionText,
        order_index: nextOrderIndex,
        options,
        correct_option: correctOption,
      }, courseId)

      if (!result.success) throw new Error(result.error)

      // Limpiar formulario
      setQuestionText('')
      setOptions([
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' },
      ])
      setCorrectOption('a')

      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl border space-y-5">
      <h3 className="font-semibold text-[#1A1A2E]">
        Agregar pregunta {nextOrderIndex}
      </h3>

      {/* Enunciado */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Enunciado
        </label>
        <textarea
          rows={3}
          value={questionText}
          onChange={e => setQuestionText(e.target.value)}
          disabled={isSubmitting}
          placeholder="¿Cuáles son los momentos críticos para el lavado de manos?"
          className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors resize-none"
        />
      </div>

      {/* Alternativas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Alternativas — marca la correcta
          </label>
          <span className="text-xs text-muted-foreground">
            {options.length}/5
          </span>
        </div>

        <div className="space-y-2">
          {options.map((option) => (
            <div key={option.id} className="flex items-center gap-2">
              {/* Radio correcta */}
              <input
                type="radio"
                name="correctOption"
                value={option.id}
                checked={correctOption === option.id}
                onChange={e => setCorrectOption(e.target.value)}
                disabled={isSubmitting}
                className="h-5 w-5 text-[#27AE60] focus:ring-[#27AE60] cursor-pointer shrink-0"
                title={`Marcar ${option.id.toUpperCase()} como correcta`}
              />

              {/* Label */}
              <span className="font-bold text-muted-foreground w-5 shrink-0 text-sm">
                {option.id.toUpperCase()}.
              </span>

              {/* Input */}
              <input
                type="text"
                value={option.text}
                onChange={e => handleOptionChange(option.id, e.target.value)}
                disabled={isSubmitting}
                placeholder={`Alternativa ${option.id.toUpperCase()}`}
                className={`flex-1 h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors ${
                  correctOption === option.id
                    ? 'border-[#27AE60] bg-[#EAF3DE]/40'
                    : 'border-input bg-background'
                }`}
              />

              {/* Eliminar alternativa */}
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(option.id)}
                  disabled={isSubmitting}
                  className="p-1.5 rounded-md hover:bg-[#FAECE7] text-muted-foreground hover:text-[#E74C3C] transition-colors shrink-0"
                  aria-label={`Eliminar alternativa ${option.id.toUpperCase()}`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Agregar alternativa */}
        {options.length < 5 && (
          <button
            type="button"
            onClick={addOption}
            disabled={isSubmitting}
            className="w-full h-9 rounded-lg border border-dashed border-[#2B4FA0]/30 text-sm text-[#2B4FA0] font-medium hover:bg-[#E6F1FB]/30 transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar alternativa
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-[#FAECE7] border border-[#E74C3C]/20">
          <p className="text-sm text-[#E74C3C]">{error}</p>
        </div>
      )}

      {/* Guardar */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-5 h-10 bg-[#27AE60] text-white text-sm font-semibold rounded-lg hover:bg-[#27AE60]/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar pregunta'}
        </button>
      </div>
    </div>
  )
}