'use client'

import { useActionState } from 'react'
import { registerRequestAction, type ActionResult } from '@/lib/actions/registro'
import { Loader2, AlertCircle, Info, CheckCircle2 } from 'lucide-react'

const initialState: ActionResult = {}

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerRequestAction, initialState)

  if (state.success) {
    return (
      <div className="col" style={{ alignItems: 'center', textAlign: 'center', gap: 16, padding: '24px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--ok-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 className="h-8 w-8" style={{ color: 'var(--ok)' }} aria-hidden="true" />
        </div>
        <h2 className="t-display" style={{ fontSize: 22 }}>Solicitud enviada</h2>
        <p className="silencio" style={{ maxWidth: 360 }}>
          Te notificaremos por correo cuando un administrador active tu cuenta. Este proceso puede tomar algunas horas.
        </p>
        <a href="/login" style={{ fontWeight: 600, color: 'var(--azul-800)' }}>Volver al inicio de sesión</a>
      </div>
    )
  }

  return (
    <form action={formAction} className="col" style={{ gap: 16 }} noValidate>
      {state.error && (
        <div
          role="alert"
          aria-live="assertive"
          className="fila"
          style={{ gap: 10, padding: '12px 14px', borderRadius: 'var(--radio-m)', background: 'var(--peligro-bg)', color: 'var(--peligro)', border: '2px solid var(--peligro)', boxShadow: '3px 3px 0 var(--peligro)', fontSize: 14.5, fontWeight: 600 }}
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="campo">
        <label htmlFor="full_name">Nombre completo</label>
        <input id="full_name" name="full_name" type="text" autoComplete="name" required disabled={isPending} placeholder="María González" className="input" />
      </div>

      <div className="campo">
        <label htmlFor="rut">RUT</label>
        <input id="rut" name="rut" type="text" autoComplete="off" required disabled={isPending} placeholder="12.345.678-9" className="input" />
      </div>

      <div className="campo">
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" required disabled={isPending} placeholder="nombre@ejemplo.cl" className="input" />
      </div>

      <div className="campo">
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required disabled={isPending} placeholder="Mínimo 8 caracteres" className="input" />
      </div>

      <div className="campo">
        <label htmlFor="confirm_password">Confirmar contraseña</label>
        <input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" required disabled={isPending} placeholder="Repite tu contraseña" className="input" />
      </div>

      <div
        role="note"
        aria-label="Información sobre el proceso de aprobación"
        className="fila"
        style={{ gap: 12, borderRadius: 'var(--radio-m)', border: '1.5px solid var(--ambar)', background: 'var(--ambar-50)', padding: 14, alignItems: 'flex-start' }}
      >
        <Info className="h-5 w-5 shrink-0" style={{ color: 'var(--ambar-700)', marginTop: 2 }} aria-hidden="true" />
        <p className="texto-s" style={{ lineHeight: 1.4 }}>
          Tu solicitud será revisada por un administrador antes de activar tu cuenta. Recibirás un correo cuando sea aprobada.
        </p>
      </div>

      <button type="submit" disabled={isPending} className="btn btn-primary btn-lg" style={{ width: '100%' }} aria-busy={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Enviando solicitud…
          </>
        ) : (
          'Enviar solicitud'
        )}
      </button>
    </form>
  )
}
