'use client'

import { useState, useTransition } from 'react'
import { approveWorkerAction, rejectWorkerAction } from '@/lib/actions/registro'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, X, CheckCircle2 } from 'lucide-react'

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
                  <Label htmlFor="area_trabajo" className="text-sm font-semibold text-[#1A1A2E]">
                    Área de trabajo
                  </Label>
                  <select
                    id="area_trabajo"
                    name="area_trabajo"
                    required
                    disabled={isPending}
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors disabled:opacity-60"
                  >
                    <option value="">Seleccionar área...</option>
                    <option value="Enfermería">Enfermería</option>
                    <option value="Auxiliar de enfermería">Auxiliar de enfermería</option>
                    <option value="Kinesiología">Kinesiología</option>
                    <option value="Terapia ocupacional">Terapia ocupacional</option>
                    <option value="Nutrición">Nutrición</option>
                    <option value="Trabajo social">Trabajo social</option>
                    <option value="Psicología">Psicología</option>
                    <option value="Administración">Administración</option>
                    <option value="Dirección técnica">Dirección técnica</option>
                    <option value="Geriatría">Geriatría</option>
                    <option value="Sin asignar">Sin asignar</option>
                  </select>
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
