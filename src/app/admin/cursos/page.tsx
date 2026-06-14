import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EncabezadoPagina, Icono, BadgeEstado, Badge, Vacio } from '@/components/alumco/ds'

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
  const user = await getCachedUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: courses }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: { role: string } | null }>,
    supabase
      .from('courses')
      .select('*')
      .order('order_index') as unknown as Promise<{ data: { id: string; title: string; description: string | null; thumbnail_url: string | null; is_published: boolean; order_index: number; created_by: string | null; created_at: string; updated_at: string; target_areas: string[] | null; deadline: string | null; deadline_description: string | null }[] | null }>,
  ])

  if (profile?.role !== 'admin' && profile?.role !== 'profesor') redirect('/inicio')

  const allCourses = courses ?? []
  const publicados = allCourses.filter(c => c.is_published)
  const borradores = allCourses.filter(c => !c.is_published)

  const filteredCourses =
    tab === 'publicados' ? publicados
    : tab === 'borradores' ? borradores
    : allCourses

  const getDeadlineStatus = (deadline: string | null): 'overdue' | 'soon' | 'ok' | null => {
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
    { key: 'todos', label: 'Todos', count: allCourses.length },
    { key: 'publicados', label: 'Publicados', count: publicados.length },
    { key: 'borradores', label: 'Borradores', count: borradores.length },
  ]

  const fmtFecha = (d: string) =>
    new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d))

  return (
    <div data-screen-label="Admin · Gestión de cursos">
      <EncabezadoPagina titulo="Gestión de cursos" sub="Crea, edita y publica las capacitaciones del equipo">
        <Link href="/admin/cursos/nuevo" className="btn btn-primary">
          <Icono n="mas" s={18} /> Nueva capacitación
        </Link>
      </EncabezadoPagina>

      {/* Chips de filtro */}
      <div className="chips entra entra-1" style={{ marginBottom: 22 }}>
        {tabs.map((t) => (
          <Link key={t.key} href={`/admin/cursos?tab=${t.key}`} className={'chip' + (tab === t.key ? ' activo' : '')}>
            {t.label} <span className="conteo">{t.count}</span>
          </Link>
        ))}
      </div>

      {filteredCourses.length === 0 ? (
        <div className="card">
          <Vacio
            icono="cursos"
            titulo="Sin cursos en esta vista"
            texto="Cuando crees una capacitación nueva aparecerá aquí, lista para asignar a las sedes."
          />
        </div>
      ) : (
        <div
          className="entra entra-2"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}
        >
          {filteredCourses.map((course) => {
            const ds = getDeadlineStatus(course.deadline ?? null)
            return (
              <article key={course.id} className="card card-hover col card-pad" style={{ gap: 14 }}>
                <div className="fila" style={{ gap: 14, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      flex: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--ambar-100)',
                      color: 'var(--ambar-700)',
                    }}
                  >
                    <Icono n="cursos" s={24} />
                  </span>
                  <div className="crece">
                    <div className="fila" style={{ gap: 8, marginBottom: 6 }}>
                      <BadgeEstado estado={course.is_published ? 'publicado' : 'borrador'} />
                      {ds === 'overdue' && <Badge tono="peligro" punto={false}>Vencido</Badge>}
                      {ds === 'soon' && <Badge tono="aviso" punto={false}>Por vencer</Badge>}
                    </div>
                    <h3 style={{ fontSize: 16.5, lineHeight: 1.3 }}>{course.title}</h3>
                  </div>
                </div>

                {course.description && (
                  <p className="texto-s silencio" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.description}
                  </p>
                )}

                <div className="fila texto-s silencio" style={{ gap: 16, flexWrap: 'wrap' }}>
                  {course.deadline && (
                    <span className="fila" style={{ gap: 6 }}>
                      <Icono n="calendario" s={16} /> vence {fmtFecha(course.deadline)}
                    </span>
                  )}
                  <span className="fila" style={{ gap: 6 }}>
                    <Icono n="reloj" s={16} /> creado {fmtFecha(course.created_at)}
                  </span>
                </div>

                <div className="fila" style={{ gap: 10, marginTop: 'auto' }}>
                  <Link href={`/admin/cursos/${course.id}/editar`} className="btn btn-secondary btn-sm crece">
                    <Icono n="editar" s={16} /> Editar
                  </Link>
                  <Link href={`/admin/reportes?curso=${course.id}`} className="btn btn-marca btn-sm crece">
                    <Icono n="reportes" s={16} /> Ver reporte
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
