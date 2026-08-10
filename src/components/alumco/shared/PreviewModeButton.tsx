'use client'

import { enterPreviewModeAction } from '@/lib/actions/preview'
import { Icono } from '@/components/alumco/ds'

/**
 * Entrada al modo vista previa desde el panel admin. Es un form con server
 * action porque la cookie tiene que setearse en el servidor (httpOnly), no
 * desde el cliente.
 */
export function PreviewModeButton() {
  return (
    <form action={enterPreviewModeAction} style={{ width: '100%' }}>
      <button
        type="submit"
        className="btn btn-secondary btn-sm"
        style={{ width: '100%', justifyContent: 'flex-start' }}
      >
        <Icono n="ojo" s={16} /> Ver como colaborador
      </button>
    </form>
  )
}
