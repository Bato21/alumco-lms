'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icono, Vacio } from '@/components/alumco/ds'
import { TicketForm } from '@/components/alumco/support/TicketForm'
import { TicketStatusBadge } from '@/components/alumco/support/TicketStatusBadge'
import { SUPPORT_CATEGORY_LABELS, type SupportTicket } from '@/lib/types/database'

export function SoporteClient({ tickets }: { tickets: SupportTicket[] }) {
  // Sin tickets previos el formulario se abre solo: llegar acá con la lista
  // vacía significa que la persona vino a reportar algo, no a mirar.
  const [creando, setCreando] = useState(tickets.length === 0)

  return (
    <div className="col" style={{ gap: 20 }}>
      <div className="fila" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div className="crece" style={{ minWidth: 240 }}>
          <h1 className="t-display" style={{ fontSize: 28 }}>Soporte</h1>
          <p className="silencio" style={{ marginTop: 4 }}>
            Reporta un problema y sigue su avance acá mismo.
          </p>
        </div>
        {!creando && (
          <button type="button" className="btn btn-primary" onClick={() => setCreando(true)}>
            <Icono n="mas" s={18} /> Nuevo ticket
          </button>
        )}
      </div>

      {creando && (
        <div className="card card-pad col entra" style={{ gap: 16 }}>
          <h2 style={{ fontSize: 17 }}>Contarnos qué pasó</h2>
          <TicketForm onCancel={tickets.length > 0 ? () => setCreando(false) : undefined} />
        </div>
      )}

      {tickets.length > 0 && (
        <div className="card col" style={{ gap: 0 }}>
          <div className="card-pad" style={{ paddingBottom: 10 }}>
            <h2 style={{ fontSize: 16.5 }}>Mis tickets</h2>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/soporte/${t.id}`}
                  className="fila"
                  style={{
                    gap: 14,
                    padding: '14px 20px',
                    minHeight: 64,
                    borderTop: '1px solid var(--borde-suave)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div className="crece col" style={{ gap: 3, minWidth: 0 }}>
                    <span className="recorte" style={{ fontWeight: 600, fontSize: 15 }}>
                      {t.subject}
                    </span>
                    <span className="texto-s silencio-3">
                      {SUPPORT_CATEGORY_LABELS[t.category]} · {fecha(t.created_at)}
                    </span>
                  </div>
                  <TicketStatusBadge status={t.status} />
                  <Icono n="chevR" s={18} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tickets.length === 0 && !creando && (
        <Vacio
          icono="alerta"
          titulo="Sin tickets"
          texto="Cuando reportes un problema aparecerá acá con su estado."
        />
      )}
    </div>
  )
}

function fecha(iso: string): string {
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(iso))
}
