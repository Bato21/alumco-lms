import type { Metadata } from 'next'
import Link from 'next/link'
import { listTicketsAction, type TicketFilters } from '@/lib/actions/support'
import { EncabezadoPagina, Icono, Vacio } from '@/components/alumco/ds'
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from '@/components/alumco/support/TicketStatusBadge'
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS,
  type SupportCategory,
  type SupportStatus,
} from '@/lib/types/database'

export const metadata: Metadata = { title: 'Soporte | Alumco LMS' }
export const dynamic = 'force-dynamic'

const ESTADOS = Object.keys(SUPPORT_STATUS_LABELS) as SupportStatus[]
const CATEGORIAS = Object.keys(SUPPORT_CATEGORY_LABELS) as SupportCategory[]

/**
 * Los filtros van por querystring y no por estado de cliente: así el admin
 * puede compartir "los tickets abiertos" como link y el back del navegador
 * hace lo esperable.
 */
export default async function AdminSoportePage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; categoria?: string }>
}) {
  const sp = await searchParams

  const estado = (ESTADOS as string[]).includes(sp.estado ?? '')
    ? (sp.estado as SupportStatus)
    : 'todos'
  const categoria = (CATEGORIAS as string[]).includes(sp.categoria ?? '')
    ? (sp.categoria as SupportCategory)
    : 'todas'

  const filtros: TicketFilters = { status: estado, category: categoria }
  const { data: tickets, error } = await listTicketsAction(filtros)

  const abiertos = (tickets ?? []).filter((t) => t.status === 'abierto').length

  return (
    <div className="col" style={{ gap: 18 }} data-screen-label="Admin · Soporte">
      <EncabezadoPagina
        titulo="Soporte"
        sub={
          error
            ? 'No se pudieron cargar los tickets.'
            : `${tickets?.length ?? 0} ticket${(tickets?.length ?? 0) !== 1 ? 's' : ''} · ${abiertos} sin atender`
        }
      />

      {/* Filtros en una fila sobre la lista */}
      <div className="card card-pad col" style={{ gap: 12 }}>
        <FiltroFila
          etiqueta="Estado"
          activo={estado}
          base={{ categoria }}
          clave="estado"
          opciones={[['todos', 'Todos'], ...ESTADOS.map((e) => [e, SUPPORT_STATUS_LABELS[e]] as [string, string])]}
        />
        <FiltroFila
          etiqueta="Categoría"
          activo={categoria}
          base={{ estado }}
          clave="categoria"
          opciones={[['todas', 'Todas'], ...CATEGORIAS.map((c) => [c, SUPPORT_CATEGORY_LABELS[c]] as [string, string])]}
        />
      </div>

      {error ? (
        <div className="card card-pad"><p className="silencio">{error}</p></div>
      ) : (tickets?.length ?? 0) === 0 ? (
        <Vacio
          icono="alerta"
          titulo="Sin tickets"
          texto="No hay tickets que calcen con estos filtros."
        />
      ) : (
        <div className="card col" style={{ gap: 0 }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {tickets!.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/admin/soporte/${t.id}`}
                  className="fila"
                  style={{
                    gap: 14,
                    padding: '14px 20px',
                    minHeight: 68,
                    borderTop: '1px solid var(--borde-suave)',
                    textDecoration: 'none',
                    color: 'inherit',
                    flexWrap: 'wrap',
                  }}
                >
                  <div className="crece col" style={{ gap: 3, minWidth: 200 }}>
                    <span className="recorte" style={{ fontWeight: 600, fontSize: 15 }}>
                      {t.subject}
                    </span>
                    <span className="texto-s silencio-3">
                      {t.requester_display} · {SUPPORT_CATEGORY_LABELS[t.category]} · {fecha(t.created_at)}
                    </span>
                  </div>
                  <TicketPriorityBadge priority={t.priority} />
                  <TicketStatusBadge status={t.status} />
                  <Icono n="chevR" s={18} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function FiltroFila({
  etiqueta,
  activo,
  clave,
  base,
  opciones,
}: {
  etiqueta: string
  activo: string
  clave: 'estado' | 'categoria'
  base: Record<string, string>
  opciones: [string, string][]
}) {
  return (
    <div className="fila" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <span className="texto-s silencio-3" style={{ fontWeight: 600, minWidth: 76 }}>
        {etiqueta}
      </span>
      {opciones.map(([valor, texto]) => {
        const params = new URLSearchParams(base)
        // El valor "todos"/"todas" es el default: no ensucia la URL.
        if (valor !== 'todos' && valor !== 'todas') params.set(clave, valor)
        for (const [k, v] of [...params.entries()]) {
          if (v === 'todos' || v === 'todas') params.delete(k)
        }
        const qs = params.toString()
        const esActivo = activo === valor
        return (
          <Link
            key={valor}
            href={`/admin/soporte${qs ? `?${qs}` : ''}`}
            aria-current={esActivo ? 'true' : undefined}
            className={esActivo ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
          >
            {texto}
          </Link>
        )
      })}
    </div>
  )
}

function fecha(iso: string): string {
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(iso))
}
