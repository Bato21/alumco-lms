import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCachedUser } from '@/lib/supabase/server'
import { getMyAdminDaysSummary } from '@/lib/actions/admin-days'
import { DiasAdminClient } from './DiasAdminClient'

export const metadata: Metadata = { title: 'Días administrativos' }
export const dynamic = 'force-dynamic'

export default async function DiasAdministrativosPage() {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const summary = await getMyAdminDaysSummary()

  return (
    <div className="col max-w-4xl mx-auto" style={{ gap: 22 }} data-screen-label="Trabajador · Días administrativos">
      <div className="entra">
        <span className="t-eyebrow"><span aria-hidden="true">◆</span> Beneficios</span>
        <h1 className="t-display" style={{ fontSize: 32, marginTop: 8 }}>Días administrativos</h1>
        <p className="silencio" style={{ marginTop: 4, fontSize: 15 }}>
          Solicita y revisa tus días administrativos.
        </p>
      </div>

      {summary ? (
        <DiasAdminClient summary={summary} />
      ) : (
        <div className="card card-pad">
          <p className="silencio">No se pudo cargar tu información de días administrativos.</p>
        </div>
      )}
    </div>
  )
}
