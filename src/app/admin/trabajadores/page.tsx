import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { ApprovalPanel } from '@/components/alumco/ApprovalPanel'
import { WorkersTable } from './WorkersTable'
import { SuspendedTable } from './SuspendedTable'
import Link from 'next/link'

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

  const { data: activosRaw } = await adminClient
    .from('profiles')
    .select('id, full_name, rut, sede, area_trabajo, role, status')
    .eq('status', 'activo')
    .order('created_at', { ascending: false }) as { data: { id: string; full_name: string; rut: string | null; sede: string; area_trabajo: string[]; role: string; status: string }[] | null }

  type ActiveWorker = {
    id: string
    full_name: string
    rut: string | null
    sede: string
    area_trabajo: string[]
    role: string
    status: string
  }
  const activos: ActiveWorker[] = (activosRaw as ActiveWorker[]) || []

  const { data: suspendidosRaw } = await adminClient
    .from('profiles')
    .select('id, full_name, rut, sede, area_trabajo, role, status, updated_at')
    .eq('status', 'suspendido')
    .order('full_name') as { data: { id: string; full_name: string; rut: string | null; sede: string; area_trabajo: string[]; role: string; status: string; updated_at: string }[] | null }

  const suspendidos = suspendidosRaw ?? []

  const { data: pendientesRaw } = await adminClient
    .from('profiles')
    .select('id, full_name, rut, requested_at, sede, area_trabajo, role')
    .eq('status', 'pendiente')
    .order('created_at', { ascending: false }) as { data: { id: string; full_name: string; rut: string | null; requested_at: string | null; sede: string; area_trabajo: string[]; role: string }[] | null }

  const pendingCount = pendientesRaw?.length || 0

  const solicitudes = await Promise.all(
    (pendientesRaw || []).map(async (s) => {
      const { data } = await adminClient.auth.admin.getUserById(s.id)
      return {
        ...s,
        email: data.user?.email ?? 'Sin correo',
      }
    })
  )

  const tabs = [
    { key: 'activos', label: 'Trabajadores activos', count: activos.length },
    { key: 'suspendidos', label: 'Suspendidos', count: suspendidos.length },
    { key: 'solicitudes', label: 'Solicitudes pendientes', count: pendingCount },
  ]

  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Trabajadores y Solicitudes</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Gestión centralizada de personal y accesos a la plataforma</p>
        </div>
        <span className="bg-[#2B4FA0]/10 text-[#2B4FA0] text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap">
          {activos.length} colaboradores activos
        </span>
      </div>

      {/* Tabs — pill style */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={`?tab=${t.key}`}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              activeTab === t.key
                ? 'bg-[#2B4FA0] text-white'
                : 'text-[#6B7280] hover:text-[#1A1A2E]'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === t.key
                  ? 'bg-white/20 text-white'
                  : t.key === 'solicitudes'
                    ? 'bg-[#F5A623] text-white'
                    : 'bg-slate-100 text-[#6B7280]'
              }`}>
                {t.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'solicitudes' ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">
                <tr>
                  <th className="px-5 lg:px-6 py-3">Trabajador</th>
                  <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">RUT</th>
                  <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">Correo electrónico</th>
                  <th className="px-5 lg:px-6 py-3 text-center hidden lg:table-cell">Sede declarada</th>
                  <th className="px-5 lg:px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 lg:px-6 py-16 text-center text-[#6B7280]">
                      No hay solicitudes pendientes por revisar.
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((solicitud) => {
                    const initials = solicitud.full_name
                      .split(' ')
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()

                    return (
                      <tr key={solicitud.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 lg:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center text-[#2B4FA0] font-bold text-sm shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#1A1A2E] truncate max-w-[160px]">{solicitud.full_name}</p>
                              <p className="text-xs text-[#6B7280] lg:hidden truncate">{solicitud.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 lg:px-6 py-4 text-[#6B7280] hidden lg:table-cell font-mono text-xs">
                          {solicitud.rut || '—'}
                        </td>
                        <td className="px-5 lg:px-6 py-4 text-[#6B7280] hidden lg:table-cell">
                          {solicitud.email}
                        </td>
                        <td className="px-5 lg:px-6 py-4 text-center hidden lg:table-cell">
                          {solicitud.sede ? (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              solicitud.sede === 'sede_1'
                                ? 'bg-[#E6F1FB] text-[#2B4FA0]'
                                : 'bg-[#EAF3DE] text-[#27500A]'
                            }`}>
                              {solicitud.sede === 'sede_1' ? 'Hualpén' : solicitud.sede === 'sede_2' ? 'Coyhaique' : String(solicitud.sede)}
                            </span>
                          ) : (
                            <span className="text-[#6B7280] text-xs">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-5 lg:px-6 py-4 text-right">
                          <ApprovalPanel
                            profileId={solicitud.id}
                            fullName={solicitud.full_name}
                            rut={solicitud.rut || 'N/A'}
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'suspendidos' ? (
        <SuspendedTable workers={suspendidos} />
      ) : (
        <WorkersTable workers={activos} />
      )}
    </div>
  )
}
