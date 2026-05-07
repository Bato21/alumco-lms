'use client'

import { useState, useTransition } from 'react'
import { MapPin, Users, Loader2, Plus, AlertTriangle } from 'lucide-react'
import { createSedeAction, toggleSedeAction } from '@/lib/actions/sedes'

interface Sede {
  id: string
  nombre: string
  activa: boolean
}

interface SedesClientProps {
  sedes: Sede[]
  workersPerSede: Record<string, number>
}

export default function SedesClient({ sedes, workersPerSede }: SedesClientProps) {
  const [error, setError] = useState<string | null>(null)
  const [isCreating, startCreateTransition] = useTransition()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [confirmSede, setConfirmSede] = useState<Sede | null>(null)

  function handleCreate(formData: FormData) {
    setError(null)
    startCreateTransition(async () => {
      const result = await createSedeAction(formData)
      if (result.error) setError(result.error)
    })
  }

  function requestDeactivate(sede: Sede) {
    setConfirmSede(sede)
  }

  function confirmDeactivate() {
    if (!confirmSede) return
    const sede = confirmSede
    setConfirmSede(null)
    setTogglingId(sede.id)
    const run = async () => {
      const result = await toggleSedeAction(sede.id, false)
      if (result.error) setError(result.error)
      setTogglingId(null)
    }
    run()
  }

  function handleActivate(sedeId: string) {
    setTogglingId(sedeId)
    const run = async () => {
      const result = await toggleSedeAction(sedeId, true)
      if (result.error) setError(result.error)
      setTogglingId(null)
    }
    run()
  }

  return (
    <>
      {/* Modal de confirmación de desactivación */}
      {confirmSede && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setConfirmSede(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 h-10 w-10 rounded-xl bg-[#E74C3C]/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-[#E74C3C]" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="confirm-title" className="font-bold text-[#1A1A2E] text-base leading-tight">
                    Desactivar {confirmSede.nombre}
                  </h2>
                  <p className="text-sm text-[#6B7280] mt-1.5 leading-snug">
                    {(workersPerSede[confirmSede.id] ?? 0) > 0 ? (
                      <>
                        Los{' '}
                        <span className="font-semibold text-[#1A1A2E]">
                          {workersPerSede[confirmSede.id]} trabajadores
                        </span>{' '}
                        asignados a esta sede quedarán sin sede asignada y deberán ser reasignados manualmente.
                      </>
                    ) : (
                      'Esta sede no tiene trabajadores asignados. Puedes desactivarla sin consecuencias.'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmSede(null)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-[#6B7280] hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeactivate}
                  className="flex-1 h-10 rounded-xl bg-[#E74C3C] text-white text-sm font-bold hover:bg-[#c0392b] transition-colors"
                >
                  Desactivar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="space-y-6">
        {/* Formulario nueva sede */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
          <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Crear nueva sede</h2>
          {error && (
            <div className="mb-4 bg-red-50 border border-[#E74C3C] rounded-lg px-4 py-3 text-sm text-[#E74C3C]" role="alert">
              {error}
            </div>
          )}
          <form action={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="nombre"
              required
              minLength={2}
              placeholder="Nombre de la sede..."
              disabled={isCreating}
              className="flex-1 h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl bg-[#2B4FA0] text-white text-sm font-bold hover:bg-[#1e3c8a] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              Crear sede
            </button>
          </form>
        </div>

        {/* Lista de sedes */}
        {sedes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-12 lg:p-16 text-center text-[#6B7280]">
            No hay sedes creadas. Crea la primera sede arriba.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sedes.map(sede => {
              const workerCount = workersPerSede[sede.id] ?? 0
              const isToggling = togglingId === sede.id
              return (
                <div
                  key={sede.id}
                  className={`bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6 flex flex-col gap-4 transition-opacity ${
                    !sede.activa ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-[#2B4FA0]/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-[#2B4FA0]" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#1A1A2E] leading-tight truncate">{sede.nombre}</p>
                        <p className="text-[10px] font-mono text-[#6B7280] mt-0.5 truncate">{sede.id}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      sede.activa ? 'bg-green-50 text-[#27AE60]' : 'bg-gray-100 text-[#6B7280]'
                    }`}>
                      {sede.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                    <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{workerCount} trabajador{workerCount !== 1 ? 'es' : ''} activo{workerCount !== 1 ? 's' : ''}</span>
                  </div>

                  <button
                    onClick={() =>
                      sede.activa ? requestDeactivate(sede) : handleActivate(sede.id)
                    }
                    disabled={isToggling}
                    className={`w-full h-10 flex items-center justify-center gap-2 rounded-xl border-2 font-semibold text-sm transition-colors disabled:opacity-50 min-h-[44px] ${
                      sede.activa
                        ? 'border-[#E74C3C] text-[#E74C3C] hover:bg-[#E74C3C]/5'
                        : 'border-[#27AE60] text-[#27AE60] hover:bg-[#27AE60]/5'
                    }`}
                  >
                    {isToggling && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    {sede.activa ? 'Desactivar sede' : 'Activar sede'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
