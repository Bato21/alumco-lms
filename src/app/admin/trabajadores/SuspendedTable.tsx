'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { reactivateWorkerAction } from '@/lib/actions/trabajadores'

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
    <div className="flex flex-wrap gap-1">
      {visible.map(a => (
        <span key={a} className="text-[10px] bg-[#E6F1FB] text-[#2B4FA0] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
          {a}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-[10px] bg-gray-100 text-[#6B7280] px-2 py-0.5 rounded-full font-semibold">
          +{extra} más
        </span>
      )}
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

  const initials = worker.full_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  function handleReactivate() {
    startTransition(async () => {
      await reactivateWorkerAction(worker.id)
    })
  }

  return (
    <tr className="hover:bg-gray-50/70 transition-colors">
      <td className="px-5 lg:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#1A1A2E] truncate max-w-[160px]">{worker.full_name}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E74C3C] lg:hidden">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E74C3C]" aria-hidden="true" />
              Suspendido
            </span>
          </div>
        </div>
      </td>
      <td className="px-5 lg:px-6 py-4 text-center hidden lg:table-cell">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
          worker.sede === 'sede_1'
            ? 'bg-[#E6F1FB] text-[#2B4FA0]'
            : 'bg-[#EAF3DE] text-[#27500A]'
        }`}>
          {worker.sede === 'sede_1' ? 'Hualpén' : 'Coyhaique'}
        </span>
      </td>
      <td className="px-5 lg:px-6 py-4 hidden lg:table-cell">
        <AreaBadges areas={worker.area_trabajo} />
      </td>
      <td className="px-5 lg:px-6 py-4 hidden lg:table-cell">
        <span className="flex items-center gap-1.5 font-semibold text-xs text-[#E74C3C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E74C3C]" aria-hidden="true" />
          {formatDate(worker.updated_at)}
        </span>
      </td>
      <td className="px-5 lg:px-6 py-4 text-right">
        <button
          onClick={handleReactivate}
          disabled={isPending}
          aria-busy={isPending}
          aria-label={`Reactivar ${worker.full_name}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#27AE60] text-white text-sm font-semibold hover:bg-[#219150] transition-colors min-h-[36px] disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Reactivando...
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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">
            <tr>
              <th className="px-5 lg:px-6 py-3">Trabajador</th>
              <th className="px-5 lg:px-6 py-3 text-center hidden lg:table-cell">Sede</th>
              <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">Áreas</th>
              <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">Suspendido desde</th>
              <th className="px-5 lg:px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {workers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 lg:px-6 py-16 text-center text-[#6B7280]">
                  No hay trabajadores suspendidos.
                </td>
              </tr>
            ) : (
              workers.map(worker => (
                <SuspendedRow key={worker.id} worker={worker} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
