'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { reactivateWorkerAction } from '@/lib/actions/trabajadores'
import { Avatar, Badge } from '@/components/alumco/ds'

interface Worker {
  id: string
  full_name: string
  rut: string | null
  sede: string
  area_trabajo: string[]
  role: string
  status: string
  updated_at?: string
}

function AreaBadges({ areas }: { areas: string[] }) {
  const visible = areas.slice(0, 2)
  const extra = areas.length - 2
  return (
    <div className="fila" style={{ flexWrap: 'wrap', gap: 6 }}>
      {visible.map(a => (
        <Badge key={a} tono="info" punto={false}>{a}</Badge>
      ))}
      {extra > 0 && <Badge tono="neutro" punto={false}>+{extra} más</Badge>}
    </div>
  )
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function SuspendedRow({ worker }: { worker: Worker }) {
  const [isPending, startTransition] = useTransition()

  function handleReactivate() {
    startTransition(async () => {
      await reactivateWorkerAction(worker.id)
    })
  }

  return (
    <tr>
      <td>
        <div className="fila" style={{ gap: 12 }}>
          <Avatar nombre={worker.full_name} s={38} />
          <div style={{ minWidth: 0 }}>
            <div className="recorte" style={{ fontWeight: 600, fontSize: 14.5 }}>{worker.full_name}</div>
            <span className="lg:hidden"><Badge tono="peligro">Suspendido</Badge></span>
          </div>
        </div>
      </td>
      <td className="hidden lg:table-cell">
        <Badge tono="info" punto={false}>{worker.sede === 'sede_1' ? 'Hualpén' : 'Coyhaique'}</Badge>
      </td>
      <td className="hidden lg:table-cell">
        <AreaBadges areas={worker.area_trabajo} />
      </td>
      <td className="hidden lg:table-cell">
        <Badge tono="peligro">{formatDate(worker.updated_at)}</Badge>
      </td>
      <td style={{ textAlign: 'right' }}>
        <button
          onClick={handleReactivate}
          disabled={isPending}
          aria-busy={isPending}
          aria-label={`Reactivar ${worker.full_name}`}
          className="btn btn-primary btn-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Reactivando…
            </>
          ) : (
            'Reactivar'
          )}
        </button>
      </td>
    </tr>
  )
}

export function SuspendedTable({ workers }: { workers: Worker[] }) {
  return (
    <div className="card entra entra-2 tabla-envoltura">
      <table className="tabla">
        <thead>
          <tr>
            <th>Trabajador</th>
            <th className="hidden lg:table-cell">Sede</th>
            <th className="hidden lg:table-cell">Áreas</th>
            <th className="hidden lg:table-cell">Suspendido desde</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {workers.length === 0 ? (
            <tr>
              <td colSpan={5} className="silencio" style={{ textAlign: 'center', padding: '48px 16px' }}>
                No hay trabajadores suspendidos.
              </td>
            </tr>
          ) : (
            workers.map(worker => <SuspendedRow key={worker.id} worker={worker} />)
          )}
        </tbody>
      </table>
    </div>
  )
}
