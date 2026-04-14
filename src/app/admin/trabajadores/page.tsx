import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { ApprovalPanel } from '@/components/alumco/ApprovalPanel'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Gestión de Trabajadores | Alumco LMS',
}

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function TrabajadoresPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const activeTab = searchParams.tab === 'solicitudes' ? 'solicitudes' : 'activos'

  // USAMOS ADMIN CLIENT PARA TODO: Así nos saltamos el bloqueo de seguridad (RLS)
  // y permitimos que el administrador vea los perfiles de los demás.
  const adminClient = await createAdminClient()

  // 1. Obtener trabajadores activos (Con adminClient)
  const { data: activosRaw } = await adminClient
    .from('profiles')
    .select('id, full_name, rut, sede, area_trabajo, role, status')
    .eq('status', 'activo')
    .order('created_at', { ascending: false })

  const activos = (activosRaw as any[]) || []

  // 2. Obtener solicitudes pendientes (Con adminClient)
  const { data: pendientesRaw } = await adminClient
    .from('profiles')
    .select('id, full_name, rut, requested_at, sede, area_trabajo, role')
    .eq('status', 'pendiente')
    .order('created_at', { ascending: false })

  const pendingCount = pendientesRaw?.length || 0

  // 3. Enriquecer las solicitudes con el email real de auth.users
  const solicitudes = await Promise.all(
    (pendientesRaw || []).map(async (s) => {
      const { data } = await adminClient.auth.admin.getUserById(s.id)
      return {
        ...s,
        email: data.user?.email ?? 'Sin correo',
      }
    })
  )

  return (
    <>
      <header className="w-full bg-[#f7f9fb] px-4 lg:px-8 pt-6 sticky top-0 z-40 border-b border-[#e8eff3]/50">
        <div className="mb-6">
          <h2 className="text-xl lg:text-2xl font-bold text-[#2B4FA0] tracking-tight">Trabajadores y Solicitudes</h2>
          <p className="text-slate-500 text-sm mt-0.5">Gestión centralizada de personal y accesos a la plataforma</p>
        </div>

        <div className="flex gap-4 lg:gap-8 overflow-x-auto pb-2">
          <Link
            href="?tab=activos"
            className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'activos'
                ? 'border-[#2B4FA0] text-[#2B4FA0]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Trabajadores Activos
          </Link>

          <Link
            href="?tab=solicitudes"
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'solicitudes'
                ? 'border-[#2B4FA0] text-[#2B4FA0]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Solicitudes Pendientes
            {(pendingCount ?? 0) > 0 && (
              <span className="bg-[#F5A623] text-white text-[10px] px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="p-4 lg:p-8">
        {activeTab === 'solicitudes' ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-white rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#e8eff3]/50 text-[11px] uppercase tracking-widest text-[#566166] font-bold">
                  <tr>
                    <th className="px-4 lg:px-6 py-4">Trabajador</th>
                    <th className="px-4 lg:px-6 py-4 hidden lg:table-cell">RUT</th>
                    <th className="px-4 lg:px-6 py-4 hidden lg:table-cell">Correo</th>
                    <th className="px-4 lg:px-6 py-4 text-center hidden lg:table-cell">Sede</th>
                    <th className="px-4 lg:px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#e8eff3]">
                  {solicitudes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 lg:px-6 py-8 text-center text-[#566166]">
                        No hay solicitudes pendientes por revisar.
                      </td>
                    </tr>
                  ) : (
                    solicitudes.map((solicitud) => (
                      <tr key={solicitud.id} className="hover:bg-[#f0f4f7] transition-colors">
                        <td className="px-4 lg:px-6 py-4">
                          <div className="font-semibold text-[#2a3439] truncate max-w-[200px]">{solicitud.full_name}</div>
                          <div className="text-xs text-[#566166] lg:hidden">{solicitud.email}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-[#566166] hidden lg:table-cell">{solicitud.rut || 'N/A'}</td>
                        <td className="px-4 lg:px-6 py-4 text-[#566166] hidden lg:table-cell">{solicitud.email}</td>
                        <td className="px-4 lg:px-6 py-4 text-center hidden lg:table-cell">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${solicitud.sede === 'sede_1' ? 'bg-blue-100 text-[#4059aa]' : 'bg-[#1A2F6B]/10 text-[#1A2F6B]'}`}>
                            {solicitud.sede === 'sede_1' ? 'SEDE 1' : solicitud.sede === 'sede_2' ? 'SEDE 2' : String(solicitud.sede).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 flex justify-end">
                          {/* CORRECCIÓN DE PROPS: Pasamos los datos exactamente como los pide el panel */}
                          <ApprovalPanel
                            profileId={solicitud.id}
                            fullName={solicitud.full_name}
                            rut={solicitud.rut || 'N/A'}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-white rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#e8eff3]/50 text-[11px] uppercase tracking-widest text-[#566166] font-bold">
                  <tr>
                    <th className="px-4 lg:px-6 py-4">Trabajador</th>
                    <th className="px-4 lg:px-6 py-4 hidden lg:table-cell">RUT</th>
                    <th className="px-4 lg:px-6 py-4 text-center hidden lg:table-cell">Sede</th>
                    <th className="px-4 lg:px-6 py-4 hidden lg:table-cell">Área</th>
                    <th className="px-4 lg:px-6 py-4 text-center hidden lg:table-cell">Rol</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#e8eff3]">
                  {activos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 lg:px-6 py-8 text-center text-[#566166]">
                        No hay trabajadores activos registrados en la plataforma.
                      </td>
                    </tr>
                  ) : (
                    activos.map((worker) => (
                      <tr key={worker.id} className="hover:bg-[#f0f4f7] transition-colors">
                        <td className="px-4 lg:px-6 py-4">
                          <div className="font-semibold text-[#2a3439] truncate max-w-[200px]">{worker.full_name}</div>
                          <div className="text-xs text-[#566166] lg:hidden">{worker.area_trabajo}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-[#566166] hidden lg:table-cell">{worker.rut || 'N/A'}</td>
                        <td className="px-4 lg:px-6 py-4 text-center hidden lg:table-cell">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${worker.sede === 'sede_1' ? 'bg-blue-100 text-[#4059aa]' : 'bg-[#1A2F6B]/10 text-[#1A2F6B]'}`}>
                            {worker.sede === 'sede_1' ? 'SEDE 1' : worker.sede === 'sede_2' ? 'SEDE 2' : String(worker.sede).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-[#566166] hidden lg:table-cell">{worker.area_trabajo}</td>
                        <td className="px-4 lg:px-6 py-4 text-center hidden lg:table-cell">
                          <span className="capitalize bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold">
                            {worker.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
