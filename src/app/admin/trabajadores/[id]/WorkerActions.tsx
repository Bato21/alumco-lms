'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { WorkerEditPanel } from '@/components/alumco/WorkerEditPanel'
import { suspendWorkerAction, reactivateWorkerAction } from '@/lib/actions/trabajadores'

interface WorkerActionsProps {
  worker: {
    id: string
    full_name: string
    rut: string | null
    sede: string
    area_trabajo: string[]
    role: string
    status: string
  }
}

export default function WorkerActions({ worker }: WorkerActionsProps) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isSuspended = worker.status === 'suspendido'

  function handleSuspend() {
    if (!window.confirm(`¿Suspender la cuenta de ${worker.full_name}? El trabajador no podrá iniciar sesión.`)) return
    startTransition(async () => {
      const result = await suspendWorkerAction(worker.id)
      if (result.success) router.refresh()
    })
  }

  function handleReactivate() {
    startTransition(async () => {
      const result = await reactivateWorkerAction(worker.id)
      if (result.success) router.refresh()
    })
  }

  return (
    <>
      {isEditOpen && (
        <WorkerEditPanel
          profileId={worker.id}
          fullName={worker.full_name}
          rut={worker.rut}
          sede={worker.sede}
          areas={worker.area_trabajo}
          onClose={() => {
            setIsEditOpen(false)
            router.refresh()
          }}
        />
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setIsEditOpen(true)}
          className="inline-flex items-center px-4 py-2 rounded-xl border border-[#2B4FA0] text-[#2B4FA0] text-sm font-semibold hover:bg-[#2B4FA0]/5 transition-colors min-h-[44px]"
          aria-label="Editar trabajador"
        >
          Editar
        </button>

        {isSuspended ? (
          <button
            onClick={handleReactivate}
            disabled={isPending}
            aria-busy={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#27AE60] text-[#27AE60] text-sm font-semibold hover:bg-[#27AE60]/5 transition-colors min-h-[44px] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Reactivar
          </button>
        ) : (
          <button
            onClick={handleSuspend}
            disabled={isPending}
            aria-busy={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E74C3C] text-[#E74C3C] text-sm font-semibold hover:bg-[#E74C3C]/5 transition-colors min-h-[44px] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Suspender
          </button>
        )}
      </div>
    </>
  )
}
