import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { ApprovalPanel } from '@/components/alumco/ApprovalPanel'
import { rejectWorkerAction } from '@/lib/actions/registro'
import { Users, Clock } from 'lucide-react'

export const metadata: Metadata = { title: 'Solicitudes pendientes' }

export default async function SolicitudesPage() {
  const supabase = await createAdminClient()

  const { data: solicitudes} = await supabase
  .from('profiles')
  .select(`
    id,
    full_name,
    rut,
    requested_at
  `)
  .eq('status', 'pendiente')
  .order('requested_at', { ascending: true })

  // Obtener emails desde auth.users vía admin
  const solicitudesConEmail = await Promise.all(
    (solicitudes ?? []).map(async (s) => {
      const { data } = await supabase.auth.admin.getUserById(s.id)
      return {
        ...s,
        email: data.user?.email ?? 'Sin correo',
      }
    })
  )

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A2E]">
          Gestión de trabajadores
        </h1>
        <p className="text-muted-foreground mt-1">
          Revisa y aprueba las solicitudes de acceso a la plataforma
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b">
        <div className="flex items-center gap-2 pb-3 border-b-2 border-[#2B4FA0]">
          <span className="font-semibold text-[#2B4FA0]">
            Solicitudes pendientes
          </span>
          {solicitudesConEmail.length > 0 && (
            <span className="bg-[#2B4FA0] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {solicitudesConEmail.length}
            </span>
          )}
        </div>
        <a
          href="/admin/trabajadores"
          className="pb-3 text-muted-foreground hover:text-[#1A1A2E] transition-colors"
        >
          Trabajadores activos
        </a>
      </div>

      {/* Tabla */}
      {solicitudesConEmail.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="font-medium text-lg">No hay solicitudes pendientes</p>
          <p className="text-muted-foreground">
            Cuando un trabajador solicite acceso, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F5F5F5] border-b">
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  RUT
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Correo
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Fecha solicitud
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {solicitudesConEmail.map((solicitud) => (
                <tr
                  key={solicitud.id}
                  className="hover:bg-[#F5F5F5]/50 transition-colors"
                >
                  {/* Nombre */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center text-[#2B4FA0] font-bold text-sm shrink-0">
                        {solicitud.full_name
                          .split(' ')
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <span className="font-medium">{solicitud.full_name}</span>
                    </div>
                  </td>

                  {/* RUT */}
                  <td className="px-6 py-4 text-muted-foreground font-mono text-sm">
                    {solicitud.rut ?? '—'}
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4 text-muted-foreground text-sm">
                    {solicitud.email}
                  </td>

                  {/* Fecha */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {solicitud.requested_at
                        ? new Intl.RelativeTimeFormat('es', {
                            numeric: 'auto',
                          }).format(
                            Math.round(
                              (new Date(solicitud.requested_at).getTime() -
                                Date.now()) /
                                (1000 * 60 * 60)
                            ),
                            'hour'
                          )
                        : '—'}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <ApprovalPanel
                        profileId={solicitud.id}
                        fullName={solicitud.full_name}
                        rut={solicitud.rut ?? '—'}
                      />
                      <form
                        action={async () => {
                          'use server'
                          await rejectWorkerAction(solicitud.id)
                        }}
                      >
                        <button
                          type="submit"
                          className="text-[#E74C3C] text-sm font-medium hover:underline"
                        >
                          Rechazar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}