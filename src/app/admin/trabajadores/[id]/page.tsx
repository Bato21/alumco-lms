import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Award, BookOpen, CheckCircle2, Clock } from 'lucide-react'
import { getWorkerDetailAction } from '@/lib/actions/trabajadores'
import WorkerActions from './WorkerActions'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const result = await getWorkerDetailAction(id)
  if ('error' in result) return { title: 'Trabajador | Alumco LMS' }
  return { title: `${result.worker.full_name} | Alumco LMS` }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function sedeName(sede: string): string {
  if (sede === 'sede_1') return 'Sede Hualpén'
  if (sede === 'sede_2') return 'Sede Coyhaique'
  return sede
}

function roleName(role: string): string {
  if (role === 'trabajador') return 'Trabajador'
  if (role === 'admin') return 'Administrador'
  if (role === 'profesor') return 'Profesor'
  return role
}

export default async function WorkerDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getWorkerDetailAction(id)

  if ('error' in result) notFound()

  const { worker, progress, certificates } = result

  // Stats
  const completedCount = progress.filter(p => p.is_completed).length
  const inProgressCount = progress.filter(p => !p.is_completed && p.completed_modules.length > 0).length
  const sinIniciarCount = progress.filter(p => !p.is_completed && p.completed_modules.length === 0).length

  // Sorted progress: sin iniciar → en progreso → completados
  const sortedProgress = [
    ...progress.filter(p => !p.is_completed && p.completed_modules.length === 0),
    ...progress.filter(p => !p.is_completed && p.completed_modules.length > 0),
    ...progress.filter(p => p.is_completed),
  ]

  const initials = worker.full_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const isActive = worker.status === 'activo'
  const areas: string[] = Array.isArray(worker.area_trabajo) ? worker.area_trabajo : []

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Link
            href="/admin/trabajadores"
            className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#1A1A2E] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Trabajadores
          </Link>
          <h1 className="text-xl font-bold text-[#1A1A2E]">{worker.full_name}</h1>
        </div>

        <WorkerActions worker={{
          id: worker.id,
          full_name: worker.full_name,
          rut: worker.rut,
          sede: worker.sede,
          area_trabajo: areas,
          role: worker.role,
          status: worker.status,
        }} />
      </div>

      {/* Card de perfil */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center text-[#2B4FA0] font-bold text-2xl shrink-0">
            {initials}
          </div>

          {/* Nombre + badges */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[#1A1A2E] leading-tight">{worker.full_name}</h2>
            <p className="text-sm text-[#6B7280] mt-0.5 capitalize">{roleName(worker.role)}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                worker.sede === 'sede_1' ? 'bg-[#E6F1FB] text-[#2B4FA0]' : 'bg-[#EAF3DE] text-[#27500A]'
              }`}>
                {sedeName(worker.sede)}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-green-50 text-[#27AE60]' : 'bg-red-50 text-[#E74C3C]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#27AE60]' : 'bg-[#E74C3C]'}`} aria-hidden="true" />
                {isActive ? 'Activo' : 'Suspendido'}
              </span>
            </div>
          </div>
        </div>

        {/* Grid de datos */}
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <dt className="text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">RUT</dt>
            <dd className="mt-1 text-sm font-mono text-[#1A1A2E]">{worker.rut ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">Fecha ingreso</dt>
            <dd className="mt-1 text-sm text-[#1A1A2E]">{formatDate(worker.created_at)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">Sede</dt>
            <dd className="mt-1 text-sm text-[#1A1A2E]">{sedeName(worker.sede)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">Áreas</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1">
              {areas.length > 0 ? areas.map(a => (
                <span key={a} className="text-[10px] bg-[#E6F1FB] text-[#2B4FA0] px-2 py-0.5 rounded-full font-semibold">
                  {a}
                </span>
              )) : (
                <span className="text-sm text-[#6B7280]">—</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
        {[
          {
            icon: CheckCircle2,
            label: 'Cursos completados',
            value: completedCount,
            color: 'text-[#27AE60]',
            bg: 'bg-green-50',
          },
          {
            icon: BookOpen,
            label: 'En progreso',
            value: inProgressCount,
            color: 'text-[#F5A623]',
            bg: 'bg-amber-50',
          },
          {
            icon: Clock,
            label: 'Sin iniciar',
            value: sinIniciarCount,
            color: 'text-[#6B7280]',
            bg: 'bg-gray-100',
          },
          {
            icon: Award,
            label: 'Certificados',
            value: certificates.length,
            color: 'text-[#2B4FA0]',
            bg: 'bg-[#E6F1FB]',
          },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-4 sm:p-5 lg:p-6 flex items-center gap-4">
            <div className={`${stat.bg} w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0`}>
              <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E]">{stat.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1 leading-tight mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de progreso por curso */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#1A1A2E]">Progreso por curso</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">
              <tr>
                <th className="px-5 lg:px-6 py-3">Curso</th>
                <th className="px-5 lg:px-6 py-3 text-center">Estado</th>
                <th className="px-5 lg:px-6 py-3 text-center hidden lg:table-cell">Completado el</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {sortedProgress.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 lg:px-6 py-16 text-center text-[#6B7280]">
                    Este trabajador aún no ha iniciado ningún curso.
                  </td>
                </tr>
              ) : (
                sortedProgress.map(row => {
                  const sinIniciar = !row.is_completed && row.completed_modules.length === 0
                  const enProgreso = !row.is_completed && row.completed_modules.length > 0
                  return (
                    <tr key={row.course_id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 lg:px-6 py-4">
                        <p className="font-semibold text-[#1A1A2E]">{row.course_title}</p>
                      </td>
                      <td className="px-5 lg:px-6 py-4 text-center">
                        {sinIniciar ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-[#6B7280]">
                            Sin iniciar
                          </span>
                        ) : enProgreso ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-[#F5A623]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" aria-hidden="true" />
                            En progreso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-[#27AE60]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#27AE60]" aria-hidden="true" />
                            Completado
                          </span>
                        )}
                      </td>
                      <td className="px-5 lg:px-6 py-4 text-center text-[#6B7280] hidden lg:table-cell">
                        {formatDate(row.completed_at)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificados */}
      {certificates.length > 0 && (
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-[#1A1A2E]">Certificados obtenidos</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {certificates.map(cert => (
              <li
                key={cert.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-[#E6F1FB] rounded-xl p-2.5 shrink-0">
                    <Award className="h-4 w-4 text-[#2B4FA0]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A1A2E] truncate">{cert.course_title}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Emitido el {formatDate(cert.issued_at)}</p>
                  </div>
                </div>
                <Link
                  href={`/certificado/${cert.id}`}
                  className="shrink-0 text-sm font-semibold text-[#2B4FA0] hover:underline min-h-[44px] flex items-center gap-1"
                >
                  Ver →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
