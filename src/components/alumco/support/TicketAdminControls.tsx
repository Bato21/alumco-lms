'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateTicketAction } from '@/lib/actions/support'
import {
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_STATUS_LABELS,
  type SupportPriority,
  type SupportStatus,
} from '@/lib/types/database'

const ESTADOS = Object.keys(SUPPORT_STATUS_LABELS) as SupportStatus[]
const PRIORIDADES = Object.keys(SUPPORT_PRIORITY_LABELS) as SupportPriority[]

/** Estado y prioridad del ticket: se guardan al cambiar, sin botón aparte. */
export function TicketAdminControls({
  ticketId,
  status,
  priority,
}: {
  ticketId: string
  status: SupportStatus
  priority: SupportPriority
}) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()

  function guardar(cambios: { status?: SupportStatus; priority?: SupportPriority }) {
    startTransition(async () => {
      const res = await updateTicketAction(ticketId, cambios)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Ticket actualizado.')
      router.refresh()
    })
  }

  return (
    <div className="fila" style={{ gap: 14, flexWrap: 'wrap' }}>
      <div className="campo col" style={{ gap: 5 }}>
        <label htmlFor="ticket-estado">Estado</label>
        <select
          id="ticket-estado"
          value={status}
          disabled={pendiente}
          onChange={(e) => guardar({ status: e.target.value as SupportStatus })}
        >
          {ESTADOS.map((s) => (
            <option key={s} value={s}>{SUPPORT_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="campo col" style={{ gap: 5 }}>
        <label htmlFor="ticket-prioridad">Prioridad</label>
        <select
          id="ticket-prioridad"
          value={priority}
          disabled={pendiente}
          onChange={(e) => guardar({ priority: e.target.value as SupportPriority })}
        >
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>{SUPPORT_PRIORITY_LABELS[p]}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
