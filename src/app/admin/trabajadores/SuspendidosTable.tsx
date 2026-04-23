'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { reactivateWorkerAction } from '@/lib/actions/trabajadores'

interface Worker {
  id: string
  full_name: string
  rut: string | null
  sede: string
  area_trabajo: string
  role: string
  status: string
}

function SuspendidoRow({ worker }: { worker: Worker }) {
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
            <p className="text-xs text-[#6B7280] lg:hidden">{worker.area_trabajo}</p>
          </div>
        </div>
      </td>
      <td className="px-5 lg:px-6 py-4 text-[#6B7280] font-mono text-xs hidden lg:table-cell">
        {worker.rut ?? '—'}
      </td>
      <td className="px-5 lg:px-6 py-4 text-center hidden lg:table-cell">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
          worker.sede === 'sede_1'
            ? 'bg-[#E6F1FB] text-[#2B4FA0]'
            : 'bg-[#EAF3DE] text-[#27500A]'
        }`}>
          {worker.sede === 'sede_1' ? 'Hualpén' : worker.sede === 'sede_2' ? 'Coyhaique' : worker.sede}
        </span>
      </td>
      <td className="px-5 lg:px-6 py-4 text-[#6B7280] hidden lg:table-cell">
        {worker.area_trabajo}
      </td>
      <td className="px-5 lg:px-6 py-4">
        <span className="flex items-center gap-1.5 font-semibold text-xs text-[#E74C3C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E74C3C]" aria-hidden="true" />
          Suspendido
        </span>
      </td>
      <td className="px-5 lg:px-6 py-4 text-right">
        <button
          onClick={handleReactivate}
          disabled={isPending}
          aria-label={`Reactivar ${worker.full_name}`}
          aria-busy={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#27AE60] text-[#27AE60] text-sm font-semibold hover:bg-[#27AE60]/5 transition-colors min-h-[44px] disabled:opacity-50"
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

export function SuspendidosTable({ workers }: { workers: Worker[] }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">
            <tr>
              <th className="px-5 lg:px-6 py-3">Trabajador</th>
              <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">RUT</th>
              <th className="px-5 lg:px-6 py-3 text-center hidden lg:table-cell">Sede</th>
              <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">Área</th>
              <th className="px-5 lg:px-6 py-3">Estado</th>
              <th className="px-5 lg:px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {workers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 lg:px-6 py-16 text-center text-[#6B7280]">
                  No hay trabajadores suspendidos.
                </td>
              </tr>
            ) : (
              workers.map(worker => (
                <SuspendidoRow key={worker.id} worker={worker} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
