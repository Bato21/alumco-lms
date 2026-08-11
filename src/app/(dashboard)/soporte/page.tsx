import type { Metadata } from 'next'
import { getMyTicketsAction } from '@/lib/actions/support'
import { SoporteClient } from './SoporteClient'

export const metadata: Metadata = { title: 'Soporte' }
export const dynamic = 'force-dynamic'

export default async function SoportePage() {
  const { data, error } = await getMyTicketsAction()

  if (error) {
    return (
      <div className="card card-pad" data-screen-label="Trabajador · Soporte">
        <p className="silencio">{error}</p>
      </div>
    )
  }

  return (
    <div data-screen-label="Trabajador · Soporte">
      <SoporteClient tickets={data ?? []} />
    </div>
  )
}
