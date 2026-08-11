import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTicketAction } from '@/lib/actions/support'
import { getCachedUser } from '@/lib/supabase/server'
import { Icono } from '@/components/alumco/ds'
import { TicketThread } from '@/components/alumco/support/TicketThread'
import { TicketAdminControls } from '@/components/alumco/support/TicketAdminControls'
import { TicketStatusBadge } from '@/components/alumco/support/TicketStatusBadge'
import { SUPPORT_CATEGORY_LABELS } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Ticket de soporte (administración)' }
export const dynamic = 'force-dynamic'

export default async function AdminTicketDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCachedUser()
  if (!user) notFound()

  const { ticket, messages, authors, canManage, error } = await getTicketAction(id)
  if (error || !ticket) notFound()

  const contexto = Object.entries(ticket.context ?? {}).filter(
    ([, v]) => typeof v === 'string' && v.length > 0
  ) as [string, string][]

  return (
    <div className="col" style={{ gap: 18 }} data-screen-label="Admin · Detalle de ticket">
      <Link href="/admin/soporte" className="btn btn-ghost" style={{ alignSelf: 'flex-start', marginLeft: -12 }}>
        <Icono n="flechaIzq" s={18} /> Volver a soporte
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
        <div className="col" style={{ gap: 18 }}>
          <div className="card card-pad col" style={{ gap: 12 }}>
            <div className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-neutro">{SUPPORT_CATEGORY_LABELS[ticket.category]}</span>
              <TicketStatusBadge status={ticket.status} />
              <span className="crece" />
              <span className="texto-s silencio-3">{fechaLarga(ticket.created_at)}</span>
            </div>

            <h1 className="t-display" style={{ fontSize: 24 }}>{ticket.subject}</h1>

            <p className="texto-s silencio-3">
              Reportado por{' '}
              <strong style={{ color: 'var(--tinta)' }}>
                {ticket.requester_name ?? ticket.requester_email ?? 'Solicitante desconocido'}
              </strong>
              {ticket.requester_email && ticket.requester_name ? ` · ${ticket.requester_email}` : ''}
            </p>

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
              canManage={canManage === true}
              currentUserId={user.id}
              cerrado={ticket.status === 'cerrado'}
            />
          </div>
        </div>

        <div className="col" style={{ gap: 18 }}>
          <div className="card card-pad col" style={{ gap: 14 }}>
            <h2 style={{ fontSize: 16.5 }}>Gestión</h2>
            <TicketAdminControls
              ticketId={ticket.id}
              status={ticket.status}
              priority={ticket.priority}
            />
            {ticket.closed_at && (
              <p className="texto-s silencio-3">Cerrado el {fechaLarga(ticket.closed_at)}</p>
            )}
          </div>

          {/* Contexto técnico: lo que ahorra el ida y vuelta de "¿dónde estabas?" */}
          {contexto.length > 0 && (
            <div className="card card-pad col" style={{ gap: 10 }}>
              <h2 style={{ fontSize: 16.5 }}>Contexto técnico</h2>
              <dl className="col" style={{ gap: 9, margin: 0 }}>
                {contexto.map(([clave, valor]) => (
                  <div key={clave} className="col" style={{ gap: 2 }}>
                    <dt
                      className="silencio-3"
                      style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}
                    >
                      {ETIQUETAS_CONTEXTO[clave] ?? clave}
                    </dt>
                    <dd style={{ margin: 0, fontSize: 12.5, overflowWrap: 'anywhere', color: 'var(--tinta-2)' }}>
                      {valor}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ETIQUETAS_CONTEXTO: Record<string, string> = {
  url: 'Página',
  userAgent: 'Navegador',
  viewport: 'Pantalla',
  timestamp: 'Momento del reporte',
}

function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}
