import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mi Perfil | Alumco LMS',
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, sede, area_trabajo, fecha_nacimiento, avatar_url, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-[var(--md-on-surface-variant)]">Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link
          href="/cursos"
          className="text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] transition-colors"
        >
          Mis cursos
        </Link>
        <svg className="w-4 h-4 text-[var(--md-outline)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="text-[var(--md-on-surface)] font-medium">Mi perfil</span>
      </div>

      {/* Profile Card */}
      <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-[var(--md-primary)] flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              profile.full_name.charAt(0).toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--md-on-surface)] mb-1">
              {profile.full_name}
            </h1>
            <p className="text-[var(--md-on-surface-variant)] mb-4 capitalize">
              {profile.role === 'admin' ? 'Administrador' : 'Trabajador'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="bg-[var(--md-surface-container-low)] rounded-lg p-4">
                <p className="text-xs text-[var(--md-on-surface-variant)] uppercase tracking-wide mb-1">Sede</p>
                <p className="font-medium text-[var(--md-on-surface)]">
                  {profile.sede === 'sede_1' ? 'Sede Principal' : 'Sede 2'}
                </p>
              </div>

              <div className="bg-[var(--md-surface-container-low)] rounded-lg p-4">
                <p className="text-xs text-[var(--md-on-surface-variant)] uppercase tracking-wide mb-1">Área de trabajo</p>
                <p className="font-medium text-[var(--md-on-surface)]">{profile.area_trabajo}</p>
              </div>

              {profile.fecha_nacimiento && (
                <div className="bg-[var(--md-surface-container-low)] rounded-lg p-4">
                  <p className="text-xs text-[var(--md-on-surface-variant)] uppercase tracking-wide mb-1">Fecha de nacimiento</p>
                  <p className="font-medium text-[var(--md-on-surface)]">
                    {new Date(profile.fecha_nacimiento).toLocaleDateString('es-CL')}
                  </p>
                </div>
              )}

              <div className="bg-[var(--md-surface-container-low)] rounded-lg p-4">
                <p className="text-xs text-[var(--md-on-surface-variant)] uppercase tracking-wide mb-1">Miembro desde</p>
                <p className="font-medium text-[var(--md-on-surface)]">
                  {new Date(profile.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] p-8">
        <h2 className="text-lg font-bold text-[var(--md-on-surface)] mb-4">Configuración de cuenta</h2>
        <p className="text-[var(--md-on-surface-variant)] text-sm">
          Para cambiar tu contraseña o actualizar tus datos, contacta al administrador de tu sede.
        </p>
      </div>
    </div>
  )
}
