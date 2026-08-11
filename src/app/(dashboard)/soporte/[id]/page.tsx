import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTicketAction } from '@/lib/actions/support'
import { getCachedUser } from '@/lib/supabase/server'
import { Icono } from '@/components/alumco/ds'
import { TicketThread } from '@/components/alumco/support/TicketThread'
import { TicketStatusBadge } from '@/components/alumco/support/TicketStatusBadge'
import { SUPPORT_CATEGORY_LABELS } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Ticket de soporte' }
export const dynamic = 'force-dynamic'

export default async function TicketDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCachedUser()
  if (!user) notFound()

  const { ticket, messages, authors, error } = await getTicketAction(id)
  if (error || !ticket) notFound()

  return (
    <div className="col" style={{ gap: 18 }} data-screen-label="Trabajador · Detalle de ticket">
      <Link href="/soporte" className="btn btn-ghost" style={{ alignSelf: 'flex-start', marginLeft: -12 }}>
        <Icono n="flechaIzq" s={18} /> Volver a soporte
      </Link>

      <div className="card card-pad col" style={{ gap: 12 }}>
        <div className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
          <span className="badge badge-neutro">{SUPPORT_CATEGORY_LABELS[ticket.category]}</span>
          <TicketStatusBadge status={ticket.status} />
          <span className="crece" />
          <span className="texto-s silencio-3">Creado el {fechaLarga(ticket.created_at)}</span>
        </div>

        <h1 className="t-display" style={{ fontSize: 24 }}>{ticket.subject}</h1>

        <p style={{ fontSize: 15, lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {ticket.description}
        </p>
      </div>

      <div className="card card-pad col" style={{ gap: 16 }}>
        <h2 style={{ fontSize: 16.5 }}>Conversación</h2>
        <TicketThread
          ticketId={ticket.id}
          messages={messages ?? []}
          authors={authors ?? {}}
          canManage={false}
          currentUserId={user.id}
          cerrado={ticket.status === 'cerrado'}
        />
      </div>
    </div>
  )
}

function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}
