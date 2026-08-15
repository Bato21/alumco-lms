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

  // A11Y-24 · El error llega del servidor con el campo que lo originó, para
  // marcarlo con `aria-invalid` y apuntarle el `aria-describedby` (3.3.1).
  const campoConError = state.field
  const describedBy = (campo: string, ayudaId?: string) =>
    [campoConError === campo ? 'registro-error' : null, ayudaId].filter(Boolean).join(' ') || undefined

  return (
    <form action={formAction} className="col" style={{ gap: 16 }} noValidate>
      {state.error && (
        <div
          id="registro-error"
          role="alert"
          aria-live="assertive"
          className="fila"
          style={{ gap: 10, padding: '12px 14px', borderRadius: 'var(--radio-m)', background: 'var(--peligro-bg)', color: 'var(--peligro)', border: '2px solid var(--peligro)', boxShadow: '3px 3px 0 var(--peligro)', fontSize: 14.5, fontWeight: 600 }}
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      {/* 3.3.2 · La obligatoriedad tiene que constar en texto, no sólo en el
          atributo `required` ni en un asterisco de color. */}
      <p className="texto-s silencio-3" style={{ margin: 0 }}>
        Todos los campos son obligatorios.
      </p>

      <div className="campo">
        <label htmlFor="full_name">Nombre completo</label>
        <input
          id="full_name" name="full_name" type="text" autoComplete="name" required disabled={isPending}
          placeholder="María González" className="input"
          aria-invalid={campoConError === 'full_name' || undefined}
          aria-describedby={describedBy('full_name')}
        />
      </div>

      <div className="campo">
        <label htmlFor="rut">RUT</label>
        <input
          id="rut" name="rut" type="text" autoComplete="off" required disabled={isPending}
          className="input"
          aria-invalid={campoConError === 'rut' || undefined}
          aria-describedby={describedBy('rut', 'rut-ayuda')}
        />
        {/* 3.3.2 · El formato vivía sólo en el `placeholder`, que desaparece en
            cuanto se empieza a escribir. */}
        <p id="rut-ayuda" className="ayuda">Con puntos y guion, por ejemplo 12.345.678-9.</p>
      </div>

      <div className="campo">
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email" name="email" type="email" autoComplete="email" required disabled={isPending}
          placeholder="nombre@ejemplo.cl" className="input"
          aria-invalid={campoConError === 'email' || undefined}
          aria-describedby={describedBy('email')}
        />
      </div>

      <div className="campo">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password" name="password" type="password" autoComplete="new-password" required disabled={isPending}
          className="input"
          aria-invalid={campoConError === 'password' || undefined}
          aria-describedby={describedBy('password', 'password-ayuda')}
        />
        <p id="password-ayuda" className="ayuda">Mínimo 8 caracteres.</p>
      </div>

      <div className="campo">
        <label htmlFor="confirm_password">Confirmar contraseña</label>
        <input
          id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" required disabled={isPending}
          placeholder="Repite tu contraseña" className="input"
          aria-invalid={campoConError === 'confirm_password' || undefined}
          aria-describedby={describedBy('confirm_password')}
        />
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
