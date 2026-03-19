import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { GraduationCap } from 'lucide-react'

export const metadata: Metadata = { title: 'Mis Cursos' }

export default async function CursosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, sede')
    .eq('id', user!.id)
    .single()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url')
    .eq('is_published', true)
    .order('order_index')

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Bienvenido'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hola, {firstName}</h1>
        <p className="text-muted-foreground mt-1">Tus cursos disponibles</p>
      </div>

      {courses && courses.length > 0 ? (
        <ul className="space-y-4" role="list">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                href={`/cursos/${course.id}`}
                className="block rounded-2xl border bg-card p-5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <h2 className="font-semibold text-lg leading-tight">
                  {course.title}
                </h2>
                {course.description && (
                  <p className="mt-1 text-muted-foreground text-base line-clamp-2">
                    {course.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="font-medium">No hay cursos disponibles aún</p>
          <p className="text-sm text-muted-foreground">
            Tu administrador publicará cursos próximamente.
          </p>
        </div>
      )}
    </div>
  )
}