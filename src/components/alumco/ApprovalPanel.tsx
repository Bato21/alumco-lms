'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { approveWorkerAction, rejectWorkerAction } from '@/lib/actions/registro'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, X, CheckCircle2, ChevronDown } from 'lucide-react'
import { AREAS_TRABAJO } from '@/lib/types/database'

interface ApprovalPanelProps {
  profileId: string
  fullName: string
  rut: string
}

export function ApprovalPanel({
  profileId,
  fullName,
  rut,
}: ApprovalPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isRejecting, startRejectTransition] = useTransition()

  // Selector de área
  const [areaMode, setAreaMode] = useState<'single' | 'multi'>('single')
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  function toggleArea(area: string) {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const triggerText =
    selectedAreas.length === 0
      ? 'Selecciona las áreas...'
      : selectedAreas.length === 1
      ? selectedAreas[0]
      : `${selectedAreas.length} áreas seleccionadas`

  function handleReject() {
    setError(null)
    startRejectTransition(async () => {
      const formData = new FormData()
      formData.append('profileId', profileId)

      const result = await rejectWorkerAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsOpen(false)
      }
    })
  }

  function handleSubmit(formData: FormData) {
    if (areaMode === 'multi' && selectedAreas.length === 0) {
      setError('Selecciona al menos un área')
      return
    }

    formData.append('profileId', profileId)
    setError(null)

    startTransition(async () => {
      const result = await approveWorkerAction(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setIsOpen(false)
      }
    })
  }

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 rounded-xl border border-[#2B4FA0] text-[#2B4FA0] text-sm font-semibold hover:bg-[#2B4FA0]/5 transition-colors min-h-[44px]"
      >
        Revisar
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Panel lateral */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Aprobar solicitud de ${fullName}`}
            className="fixed right-0 top-0 h-screen w-full md:w-[420px] bg-white z-[60] shadow-2xl border-l-4 border-[#2B4FA0] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A2E]">Revisar solicitud</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Asigna sede, área y rol antes de aprobar</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Cerrar panel"
              >
                <X className="h-5 w-5 text-[#6B7280]" aria-hidden="true" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

              {/* Resumen del solicitante */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center text-[#2B4FA0] font-bold text-base shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#1A1A2E] text-base leading-tight truncate">
                    {fullName}
                  </p>
                  <p className="text-[#6B7280] text-xs font-mono mt-0.5">
                    RUT: {rut}
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-5 w-5" aria-hidden="true" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Formulario */}
              <form
                id="approval-form"
                action={handleSubmit}
                className="space-y-5"
              >
                {/* Sede */}
                <div className="space-y-2">
                  <Label htmlFor="sede" className="text-sm font-semibold text-[#1A1A2E]">
                    Sede
                  </Label>
                  <select
                    id="sede"
                    name="sede"
                    required
                    disabled={isPending}
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors disabled:opacity-60"
                  >
                    <option value="sede_1">Sede Hualpén</option>
                    <option value="sede_2">Sede Coyhaique</option>
                  </select>
                </div>

                {/* Área de trabajo */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#1A1A2E]">
                    Área de trabajo
                  </Label>

                  {/* Toggle modo */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAreaMode('single')}
                      className={`flex-1 text-center rounded-xl border px-3 py-2.5 font-medium text-xs cursor-pointer transition-colors ${
                        areaMode === 'single'
                          ? 'bg-[#2B4FA0] text-white border-[#2B4FA0]'
                          : 'bg-white text-[#1A1A2E] border-slate-200 hover:border-[#2B4FA0]/40'
                      }`}
                    >
                      Una área
                    </button>
                    <button
                      type="button"
                      onClick={() => setAreaMode('multi')}
                      className={`flex-1 text-center rounded-xl border px-3 py-2.5 font-medium text-xs cursor-pointer transition-colors ${
                        areaMode === 'multi'
                          ? 'bg-[#2B4FA0] text-white border-[#2B4FA0]'
                          : 'bg-white text-[#1A1A2E] border-slate-200 hover:border-[#2B4FA0]/40'
                      }`}
                    >
                      Varias áreas
                    </button>
                  </div>

                  {/* Modo single — select nativo */}
                  {areaMode === 'single' ? (
                    <select
                      id="area_trabajo"
                      name="area_trabajo"
                      required
                      disabled={isPending}
                      className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors disabled:opacity-60"
                    >
                      <option value="">Seleccionar área...</option>
                      {AREAS_TRABAJO.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  ) : (
                    /* Modo multi — dropdown con checkboxes */
                    <>
                      {selectedAreas.map(area => (
                        <input key={area} type="hidden" name="area_trabajo" value={area} />
                      ))}

                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => setDropdownOpen(v => !v)}
                          disabled={isPending}
                          className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-between hover:border-[#2B4FA0] transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20"
                          aria-expanded={dropdownOpen}
                          aria-haspopup="listbox"
                        >
                          <span className={`truncate ${selectedAreas.length === 0 ? 'text-[#6B7280]' : 'text-[#1A1A2E]'}`}>
                            {triggerText}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-[#6B7280] shrink-0 ml-2 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                        </button>

                        {dropdownOpen && (
                          <div
                            className="absolute z-50 w-full bg-white rounded-xl border border-gray-200 shadow-lg mt-1"
                            role="listbox"
                            aria-multiselectable="true"
                          >
                            <div className="max-h-48 overflow-y-auto py-1">
                              {AREAS_TRABAJO.map(area => {
                                const isSelected = selectedAreas.includes(area)
                                return (
                                  <button
                                    key={area}
                                    type="button"
                                    onClick={() => toggleArea(area)}
                                    role="option"
                                    aria-selected={isSelected}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F0F4FF] cursor-pointer text-sm w-full text-left"
                                  >
                                    <div
                                      className={`h-4 w-4 rounded shrink-0 flex items-center justify-center transition-colors ${
                                        isSelected ? 'bg-[#2B4FA0]' : 'border-2 border-slate-300'
                                      }`}
                                      aria-hidden="true"
                                    >
                                      {isSelected && (
                                        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      )}
                                    </div>
                                    <span className="text-[#1A1A2E] leading-snug">{area}</span>
                                  </button>
                                )
                              })}
                            </div>
                            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
                              <span className="text-[10px] text-[#6B7280]">
                                {selectedAreas.length}{' '}
                                {selectedAreas.length === 1 ? 'área seleccionada' : 'áreas seleccionadas'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setDropdownOpen(false)}
                                className="text-[#2B4FA0] font-semibold text-xs hover:underline"
                              >
                                Listo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Rol */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-[#1A1A2E]">
                    Rol en el sistema
                  </Label>
                  <div className="space-y-2">
                    {[
                      { value: 'trabajador', label: 'Trabajador' },
                      { value: 'admin', label: 'Administrador' },
                      { value: 'profesor', label: 'Profesor' },
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-3 cursor-pointer group py-1">
                        <input
                          type="radio"
                          name="role"
                          value={value}
                          defaultChecked={value === 'trabajador'}
                          disabled={isPending}
                          className="h-4 w-4 text-[#2B4FA0] border-gray-300 focus:ring-[#2B4FA0]"
                        />
                        <span className="text-sm font-medium text-[#1A1A2E] group-hover:text-[#2B4FA0] transition-colors">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 space-y-3">
              <Button
                type="submit"
                form="approval-form"
                disabled={isPending || isRejecting}
                className="w-full h-11 text-sm font-bold bg-[#27AE60] hover:bg-[#219150] text-white rounded-xl"
                aria-busy={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Aprobar y activar cuenta
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleReject}
                disabled={isPending || isRejecting}
                className="w-full h-11 flex items-center justify-center rounded-xl border-2 border-[#E74C3C] text-[#E74C3C] font-semibold text-sm hover:bg-[#E74C3C]/5 transition-colors disabled:opacity-50"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Rechazando...
                  </>
                ) : (
                  'Rechazar solicitud'
                )}
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
