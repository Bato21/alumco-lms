import { Badge } from '@/components/alumco/ds'
import {
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_STATUS_LABELS,
  type SupportPriority,
  type SupportStatus,
} from '@/lib/types/database'

const TONO_ESTADO: Record<SupportStatus, 'aviso' | 'info' | 'ok'> = {
  abierto: 'aviso',
  en_progreso: 'info',
  cerrado: 'ok',
}

export function TicketStatusBadge({ status }: { status: SupportStatus }) {
  return <Badge tono={TONO_ESTADO[status]}>{SUPPORT_STATUS_LABELS[status]}</Badge>
}

const TONO_PRIORIDAD: Record<SupportPriority, 'neutro' | 'aviso' | 'peligro'> = {
  baja: 'neutro',
  media: 'aviso',
  alta: 'peligro',
}

export function TicketPriorityBadge({ priority }: { priority: SupportPriority }) {
  return (
    <Badge tono={TONO_PRIORIDAD[priority]} punto={false}>
      Prioridad {SUPPORT_PRIORITY_LABELS[priority].toLowerCase()}
    </Badge>
  )
}
