import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, Calendar, BookOpen } from 'lucide-react'
import { getCourseGradient } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Gestión de Cursos | Alumco LMS',
}

export default async function AdminCursosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'todos' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'profesor') redirect('/inicio')

  // Fetch all courses
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('order_index')

  const allCourses = courses ?? []
  const publicados = allCourses.filter(c => c.is_published)
  const borradores = allCourses.filter(c => !c.is_published)

  const filteredCourses =
    tab === 'publicados' ? publicados
    : tab === 'borradores' ? borradores
    : allCourses

  const getDeadlineStatus = (deadline: string | null) => {
    if (!deadline) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dl = new Date(deadline)
    dl.setHours(0, 0, 0, 0)
    const daysLeft = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft < 0) return 'overdue'
    if (daysLeft <= 7) return 'soon'
    return 'ok'
  }

  const tabs = [
    { key: 'todos',      label: 'Todos',      count: allCourses.length },
    { key: 'publicados', label: 'Publicados',  count: publicados.length },
    { key: 'borradores', label: 'Borradores',  count: borradores.length },
  ]

  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Gestión de Cursos</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Crea, edita y publica los cursos de capacitación</p>
        </div>
        <Link
          href="/admin/cursos/nuevo"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2B4FA0] text-white rounded-xl font-semibold hover:bg-[#1A2F6B] transition-colors min-h-[48px] w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          Nueva capacitación
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={`/admin/cursos?tab=${t.key}`}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              tab === t.key
                ? 'bg-[#2B4FA0] text-white'
                : 'text-[#6B7280] hover:text-[#1A1A2E]'
            }`}
          >
            {t.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#6B7280]'
            }`}>
              {t.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E6F1FB] flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-[#2B4FA0]" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-[#1A1A2E]">No hay cursos en esta categoría</p>
            <p className="text-sm text-[#6B7280] mt-1">Crea el primer curso de capacitación</p>
          </div>
          <Link
            href="/admin/cursos/nuevo"
            className="px-5 py-2.5 bg-[#2B4FA0] text-white rounded-xl font-semibold text-sm hover:bg-[#1A2F6B] transition-colors"
          >
            Nueva capacitación
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map(course => {
            const deadlineStatus = getDeadlineStatus(course.deadline ?? null)

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col"
              >
                {/* Gradient header */}
                <div
                  className="h-40 relative flex items-end p-5"
                  style={{ background: getCourseGradient(course.target_areas ?? []) }}
                >
                  {/* Status badge */}
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    course.is_published
                      ? 'bg-[#27AE60]/20 text-[#EDFAF3] border-[#27AE60]/30'
                      : 'bg-white/10 text-white/80 border-white/20'
                  }`}>
                    {course.is_published ? 'Publicado' : 'Borrador'}
                  </span>

                  {/* Decorative icon */}
                  <div className="absolute top-3 right-3 opacity-20 pointer-events-none" aria-hidden="true">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>

                  {/* Course title */}
                  <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 relative z-10">
                    {course.title}
                  </h3>
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1 gap-3">
                  {course.description && (
                    <p className="text-[#6B7280] text-sm line-clamp-2">{course.description}</p>
                  )}

                  {/* Deadline */}
                  {course.deadline && (
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                      deadlineStatus === 'overdue' ? 'text-[#E74C3C]'
                      : deadlineStatus === 'soon'   ? 'text-[#F5A623]'
                      : 'text-[#27AE60]'
                    }`}>
                      <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        Vence:{' '}
                        {new Intl.DateTimeFormat('es-CL', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        }).format(new Date(course.deadline))}
                      </span>
                      {deadlineStatus === 'overdue' && (
                        <span className="bg-[#E74C3C]/10 px-1.5 py-0.5 rounded-full">Vencido</span>
                      )}
                      {deadlineStatus === 'soon' && (
                        <span className="bg-[#F5A623]/10 px-1.5 py-0.5 rounded-full">Próximo</span>
                      )}
                    </div>
                  )}

                  {/* Created at */}
                  <p className="text-xs text-[#6B7280]">
                    Creado: {new Date(course.created_at).toLocaleDateString('es-CL')}
                  </p>

                  {/* Footer buttons */}
                  <div className="flex gap-2 mt-auto pt-1">
                    <Link
                      href={`/admin/cursos/${course.id}/editar`}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[#1A1A2E] font-semibold text-sm text-center hover:bg-slate-50 transition-colors"
                    >
                      Editar
                    </Link>
                    <Link
                      href={`/admin/reportes?curso=${course.id}`}
                      className="flex-1 py-2.5 rounded-xl bg-[#2B4FA0] text-white font-semibold text-sm text-center hover:bg-[#1A2F6B] transition-colors"
                    >
                      Ver reporte
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
