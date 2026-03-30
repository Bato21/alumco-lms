import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Gestión de Cursos | Alumco LMS',
}

export default async function AdminCursosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/cursos')
  }

  // Fetch all courses
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('order_index')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--md-on-surface)]">Gestión de Cursos</h1>
          <p className="text-[var(--md-on-surface-variant)]">Crea y administra los cursos de capacitación</p>
        </div>
        <Link
          href="/admin/cursos/nuevo"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2B4FA0] text-white rounded-lg font-semibold hover:bg-[#2B4FA0]/90 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo curso
        </Link>
      </div>

      {/* Courses List */}
      <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--md-surface-container)]">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--md-on-surface)]">Curso</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--md-on-surface)]">Estado</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--md-on-surface)]">Creado</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--md-on-surface)]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--md-surface-container)]">
            {courses?.map((course) => (
              <tr key={course.id} className="hover:bg-[var(--md-surface-container-low)]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--md-primary-container)] flex items-center justify-center">
                      <svg className="w-5 h-5 text-[var(--md-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--md-on-surface)]">{course.title}</p>
                      <p className="text-sm text-[var(--md-on-surface-variant)]">{course.description?.slice(0, 60)}...</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    course.is_published
                      ? 'bg-[#27AE60]/10 text-[#27AE60]'
                      : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)]'
                  }`}>
                    {course.is_published ? 'Publicado' : 'Borrador'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-[var(--md-on-surface-variant)]">
                  {new Date(course.created_at).toLocaleDateString('es-CL')}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/admin/cursos/${course.id}/editar`}
                    className="text-sm text-[#2B4FA0] font-medium hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}

            {(!courses || courses.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <p className="text-[var(--md-on-surface-variant)]">No hay cursos creados aún.</p>
                  <Link
                    href="/admin/cursos/nuevo"
                    className="inline-block mt-4 text-[#2B4FA0] font-medium hover:underline"
                  >
                    Crear el primer curso
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
