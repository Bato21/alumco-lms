import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { getViewerIsDemo } from '@/lib/auth/demoScope'
import { ApprovalPanel } from '@/components/alumco/admin/ApprovalPanel'
import { WorkersTable } from './WorkersTable'
import { SuspendedTable } from './SuspendedTable'
import { TabsTrabajadores } from './TabsTrabajadores'
import { EncabezadoPagina, Avatar } from '@/components/alumco/ds'

export const metadata: Metadata = {
  title: 'Gestión de Trabajadores | Alumco LMS',
}

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function TrabajadoresPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const activeTab =
    searchParams.tab === 'solicitudes' ? 'solicitudes'
    : searchParams.tab === 'suspendidos' ? 'suspendidos'
    : 'activos'

  const adminClient = await createAdminClient()
  const isDemo = await getViewerIsDemo()

  // Las solicitudes pendientes necesitan el email (auth admin API) además de
  // la fila de profiles: toda esa cadena corre DENTRO del Promise.all para
  // no sumar round trips seriales después de las otras 3 queries.
  const [
    { data: sedesData },
    { data: activosRaw },
    { data: suspendidosRaw },
    solicitudes,
  ] = await Promise.all([
    adminClient
      .from('sedes')
      .select('id, nombre')
      .eq('activa', true)
      .order('created_at', { ascending: true }) as unknown as Promise<{
        data: { id: string; nombre: string }[] | null
      }>,
    adminClient
      .from('profiles')
      .select('id, full_name, rut, sede, area_trabajo, role, status')
      .eq('status', 'activo')
      .eq('is_demo', isDemo)
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: { id: string; full_name: string; rut: string | null; sede: string; area_trabajo: string[]; role: string; status: string }[] | null }>,
    adminClient
      .from('profiles')
      .select('id, full_name, rut, sede, area_trabajo, role, status, updated_at')
      .eq('status', 'suspendido')
      .eq('is_demo', isDemo)
      .order('full_name') as unknown as Promise<{ data: { id: string; full_name: string; rut: string | null; sede: string; area_trabajo: string[]; role: string; status: string; updated_at: string }[] | null }>,
    (async () => {
      const { data: pendientes } = await (adminClient
        .from('profiles')
        .select('id, full_name, rut, requested_at, sede, area_trabajo, role')
        .eq('status', 'pendiente')
        .eq('is_demo', isDemo)
        .order('created_at', { ascending: false }) as unknown as Promise<{ data: { id: string; full_name: string; rut: string | null; requested_at: string | null; sede: string | null; area_trabajo: string[] | null; role: string }[] | null }>)
      if (!pendientes || pendientes.length === 0) return []
      // Un solo listUsers en vez de un getUserById por solicitud: la API
      // admin de auth se degrada fuerte con llamadas concurrentes.
      const { data: lista } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const emailById = new Map((lista?.users ?? []).map(u => [u.id, u.email]))
      return pendientes.map(s => ({ ...s, email: emailById.get(s.id) ?? 'Sin correo' }))
    })(),
  ])

  const sedes = sedesData ?? []

  type ActiveWorker = {
    id: string
    full_name: string
    rut: string | null
    sede: string
    area_trabajo: string[]
    role: string
    status: string
  }
  const activos: ActiveWorker[] = (activosRaw as ActiveWorker[]) ?? []

  const suspendidos = suspendidosRaw ?? []

  const pendingCount = solicitudes.length

  const solicitudesContent = (
    <div className="card entra entra-2 tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Trabajador</th>
                <th className="hidden lg:table-cell">RUT</th>
                <th className="hidden lg:table-cell">Correo electrónico</th>
                <th className="hidden lg:table-cell">Sede declarada</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 0 }}>
                    <div className="vacio">
                      <div className="vacio-icono">
                        <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </div>
                      <h3>Todo al día</h3>
                      <p>No hay solicitudes pendientes por revisar.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                solicitudes.map((solicitud) => (
                  <tr key={solicitud.id}>
                    <td>
                      <div className="fila" style={{ gap: 12 }}>
                        <Avatar nombre={solicitud.full_name} s={36} />
                        <div style={{ minWidth: 0 }}>
                          <div className="recorte" style={{ fontWeight: 600, fontSize: 14.5 }}>{solicitud.full_name}</div>
                          <div className="texto-s silencio-3 lg:hidden recorte">{solicitud.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="silencio texto-s hidden lg:table-cell" style={{ fontFamily: 'monospace' }}>{solicitud.rut || '—'}</td>
                    <td className="silencio texto-s hidden lg:table-cell">{solicitud.email}</td>
                    <td className="hidden lg:table-cell">
                      {solicitud.sede ? (
                        <span className="badge badge-info" >
                          {solicitud.sede === 'sede_1' ? 'Hualpén' : solicitud.sede === 'sede_2' ? 'Coyhaique' : String(solicitud.sede)}
                        </span>
                      ) : (
                        <span className="silencio-3 texto-s">Sin asignar</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ApprovalPanel
                        profileId={solicitud.id}
                        fullName={solicitud.full_name}
                        rut={solicitud.rut || 'N/A'}
                        sedes={sedes}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
  )

  return (
    <div data-screen-label="Admin · Trabajadores">
      <EncabezadoPagina titulo="Trabajadores" sub="Gestión centralizada de personal y accesos a la plataforma">
        <span className="badge badge-info">{activos.length} colaboradores activos</span>
      </EncabezadoPagina>

      <TabsTrabajadores
        initialTab={activeTab}
        tabs={[
          { key: 'activos', label: 'Trabajadores activos', count: activos.length, content: <WorkersTable workers={activos} sedes={sedes} /> },
          { key: 'suspendidos', label: 'Suspendidos', count: suspendidos.length, content: <SuspendedTable workers={suspendidos} /> },
          { key: 'solicitudes', label: 'Solicitudes pendientes', count: pendingCount, content: solicitudesContent },
        ]}
      />
    </div>
  )
}
