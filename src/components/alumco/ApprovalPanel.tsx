'use client'

import { useState, useTransition } from 'react'
import { approveWorkerAction, rejectWorkerAction } from '@/lib/actions/registro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  // NUEVA FUNCIÓN PARA RECHAZAR
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

  return (
    <>
      {/* Botón disparador */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-lg border border-[#2B4FA0] text-[#2B4FA0] text-sm font-semibold hover:bg-[#2B4FA0]/5 transition-colors min-h-[40px]"
      >
        Revisar solicitud
      </button>

      {/* Overlay + Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Panel deslizante */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Aprobar solicitud de ${fullName}`}
            className="fixed right-0 top-0 h-screen w-[420px] bg-white z-[60] shadow-2xl border-l-4 border-[#2B4FA0] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b">
              <h2 className="text-xl font-bold text-[#1A1A2E]">
                Aprobar solicitud
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-[#F5F5F5] transition-colors"
                aria-label="Cerrar panel"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-8">

              {/* Resumen del solicitante */}
              <div className="bg-[#F5F5F5] rounded-xl p-5 mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center text-[#2B4FA0] font-bold text-lg shrink-0">
                    {fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A2E] text-lg leading-tight">
                      {fullName}
                    </p>
                    <p className="text-muted-foreground text-sm font-mono">
                      RUT: {rut}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-5 w-5" aria-hidden="true" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Formulario */}
              <form
                id="approval-form"
                action={handleSubmit}
                className="space-y-6"
              >
                {/* Sede */}
                <div className="space-y-2">
                  <Label htmlFor="sede" className="text-base font-medium">
                    Sede
                  </Label>
                  <select
                    id="sede"
                    name="sede"
                    required
                    disabled={isPending}
                    className="w-full h-12 px-3 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#2B4FA0] transition-colors"
                  >
                    <option value="sede_1">Sede Principal</option>
                    <option value="sede_2">Sede Secundaria</option>
                  </select>
                </div>

                {/* Área de trabajo */}
                <div className="space-y-2">
                  <Label
                    htmlFor="area_trabajo"
                    className="text-base font-medium"
                  >
                    Área de trabajo
                  </Label>
                  <Input
                    id="area_trabajo"
                    name="area_trabajo"
                    type="text"
                    required
                    disabled={isPending}
                    placeholder="Ej: Enfermería"
                    className="h-12 text-base"
                  />
                </div>

                {/* Rol */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Rol en el sistema
                  </Label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="role"
                        value="trabajador"
                        defaultChecked
                        disabled={isPending}
                        className="h-5 w-5 text-[#2B4FA0] border-gray-300 focus:ring-[#2B4FA0]"
                      />
                      <span className="text-base font-medium group-hover:text-[#2B4FA0] transition-colors">
                        Trabajador
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        disabled={isPending}
                        className="h-5 w-5 text-[#2B4FA0] border-gray-300 focus:ring-[#2B4FA0]"
                      />
                      <span className="text-base font-medium group-hover:text-[#2B4FA0] transition-colors">
                        Administrador
                      </span>
                    </label>
                  </div>
                </div>
              </form>
            </div>

{/* Footer con acciones */}
            <div className="p-8 bg-[#F5F5F5] border-t space-y-3">
              <Button
                type="submit"
                form="approval-form"
                disabled={isPending || isRejecting}
                className="w-full h-12 text-base font-bold bg-[#27AE60] hover:bg-[#27AE60]/90 text-white"
                aria-busy={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" aria-hidden="true" />
                    Aprobar y activar cuenta
                  </>
                )}
              </Button>
              
              <button
                type="button"
                onClick={handleReject}
                disabled={isPending || isRejecting}
                className="w-full h-12 flex items-center justify-center rounded-lg border-2 border-[#E74C3C] text-[#E74C3C] font-bold text-base hover:bg-[#E74C3C]/5 transition-colors disabled:opacity-50"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
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