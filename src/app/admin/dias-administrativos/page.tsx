import type { Metadata } from 'next'
import { getAdminDayRequests, getAdminDaysConfig } from '@/lib/actions/admin-days'
import { DiasAdminAdminClient } from './DiasAdminAdminClient'

export const metadata: Metadata = { title: 'Gestión de días administrativos' }
export const dynamic = 'force-dynamic'

export default async function AdminDiasAdministrativosPage() {
  const [requests, config] = await Promise.all([
    getAdminDayRequests(),
    getAdminDaysConfig(),
  ])

  return (
    <div className="col" style={{ gap: 22 }} data-screen-label="Admin · Días administrativos">
      <div>
        <span className="t-eyebrow">◆ Gestión</span>
        <h1 className="t-display" style={{ fontSize: 30, marginTop: 8 }}>Días administrativos</h1>
        <p className="silencio" style={{ marginTop: 4, fontSize: 15 }}>
          Aprueba o rechaza solicitudes y configura los cupos.
        </p>
      </div>

      <DiasAdminAdminClient requests={requests} config={config} />
    </div>
  )
}
