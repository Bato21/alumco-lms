'use client'

import { useState, useTransition } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { createSedeAction, toggleSedeAction } from '@/lib/actions/sedes'
import { Icono, Badge } from '@/components/alumco/ds'
import { useAccessibleDialog } from '@/hooks/useAccessibleDialog'

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
  // A11Y-12 · el comentario del telón prometía cierre con Escape, pero no había
  // ningún manejador: el hook lo aporta, junto a la trampa y la devolución.
  const dialogRef = useAccessibleDialog<HTMLDivElement>(
    confirmSede !== null,
    () => setConfirmSede(null)
  )

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
        <div
          style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}
        >
          {/* Telón: sólo decorativo. Cerrar al hacer clic fuera es una
              comodidad de ratón; con teclado se cierra con Escape y con el
              botón «Cancelar», que sí están en el orden de tabulación. */}
          <div
            aria-hidden="true"
            onClick={() => setConfirmSede(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15,31,77,0.4)' }}
          />
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="card entra"
            style={{ position: 'relative', width: 420, maxWidth: '100%', padding: 28, boxShadow: 'var(--sombra-3)' }}
          >
            <div className="fila" style={{ gap: 12, alignItems: 'flex-start' }}>
              <span style={{ width: 40, height: 40, borderRadius: 'var(--radio-m)', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--peligro-bg)', color: 'var(--peligro)' }}>
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="confirm-title" className="t-display" style={{ fontSize: 19 }}>Desactivar {confirmSede.nombre}</h2>
                <p className="silencio texto-s" style={{ marginTop: 6, lineHeight: 1.4 }}>
                  {(workersPerSede[confirmSede.id] ?? 0) > 0 ? (
                    <>
                      Los <strong style={{ color: 'var(--tinta)' }}>{workersPerSede[confirmSede.id]} trabajadores</strong> asignados a esta sede quedarán sin sede asignada y deberán ser reasignados manualmente.
                    </>
                  ) : (
                    'Esta sede no tiene trabajadores asignados. Puedes desactivarla sin consecuencias.'
                  )}
                </p>
              </div>
            </div>
            <div className="fila" style={{ gap: 10, marginTop: 20 }}>
              <button onClick={() => setConfirmSede(null)} className="btn btn-ghost crece">Cancelar</button>
              <button onClick={confirmDeactivate} className="btn btn-primary crece" style={{ background: 'var(--peligro)', color: '#fff' }}>
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="col" style={{ gap: 22 }}>
        {/* Formulario nueva sede */}
        <div className="card card-pad col entra" style={{ gap: 14 }}>
          <h2 style={{ fontSize: 16.5 }}>Crear nueva sede</h2>
          {error && (
            <div
              role="alert"
              style={{ background: 'var(--peligro-bg)', border: '2px solid var(--peligro)', boxShadow: '3px 3px 0 var(--peligro)', borderRadius: 'var(--radio-m)', padding: '10px 14px', color: 'var(--peligro)', fontSize: 14, fontWeight: 600 }}
            >
              {error}
            </div>
          )}
          <form action={handleCreate} className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              name="nombre"
              required
              minLength={2}
              placeholder="Nombre de la sede…"
              disabled={isCreating}
              className="input crece"
              style={{ minWidth: 220 }}
            />
            <button type="submit" disabled={isCreating} className="btn btn-primary">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Icono n="mas" s={18} />}
              Crear sede
            </button>
          </form>
        </div>

        {/* Lista de sedes */}
        {sedes.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: 'center', padding: 56 }}>
            <p className="silencio">No hay sedes creadas. Crea la primera sede arriba.</p>
          </div>
        ) : (
          <div className="entra entra-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {sedes.map((sede) => {
              const workerCount = workersPerSede[sede.id] ?? 0
              const isToggling = togglingId === sede.id
              return (
                <article key={sede.id} className="card card-hover card-pad col" style={{ gap: 16, opacity: sede.activa ? 1 : 0.6 }}>
                  <div className="fila" style={{ gap: 14, alignItems: 'flex-start' }}>
                    <span style={{ width: 46, height: 46, borderRadius: 13, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--azul-50)', color: 'var(--azul-800)' }}>
                      <Icono n="sede" s={23} />
                    </span>
                    <div className="crece" style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: 17, lineHeight: 1.25 }}>{sede.nombre}</h3>
                    </div>
                    <Badge tono={sede.activa ? 'ok' : 'neutro'}>{sede.activa ? 'Activa' : 'Inactiva'}</Badge>
                  </div>

                  <div className="fila texto-s silencio" style={{ gap: 8 }}>
                    <Icono n="usuarios" s={17} />
                    <span>{workerCount} trabajador{workerCount !== 1 ? 'es' : ''} activo{workerCount !== 1 ? 's' : ''}</span>
                  </div>

                  <button
                    onClick={() => (sede.activa ? requestDeactivate(sede) : handleActivate(sede.id))}
                    disabled={isToggling}
                    className={'btn btn-sm ' + (sede.activa ? 'btn-peligro-ghost' : 'btn-secondary')}
                    style={{ width: '100%', marginTop: 'auto' }}
                  >
                    {isToggling && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    {sede.activa ? 'Desactivar sede' : 'Activar sede'}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
