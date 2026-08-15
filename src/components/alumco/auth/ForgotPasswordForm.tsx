'use client'

import { useActionState } from 'react'
import { forgotPasswordAction, type ActionResult } from '@/lib/actions/auth'
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'

const initialState: ActionResult = {}

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState)

  if (state.success) {
    return (
      <div className="col" style={{ alignItems: 'center', textAlign: 'center', gap: 16, padding: '16px 0' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--ok-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle2 className="h-7 w-7" style={{ color: 'var(--ok)' }} aria-hidden="true" />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 18 }}>Revise su correo</p>
          <p className="silencio" style={{ fontSize: 15, marginTop: 4 }}>
            Si existe una cuenta con ese correo, recibirá un enlace para restablecer su contraseña.
          </p>
        </div>
        <button
          onClick={onBack}
          style={{ fontSize: 15, fontWeight: 600, color: 'var(--azul-800)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Volver al inicio de sesión
        </button>
      </div>
    )
  }

  return (
    <div className="col" style={{ gap: 18 }}>
      <p className="silencio" style={{ fontSize: 15 }}>
        Ingrese su correo y le enviaremos un enlace para restablecer su contraseña.
      </p>

      {state.error && (
        <div
          id="recuperar-error"
          role="alert"
          aria-live="assertive"
          className="fila"
          style={{
            gap: 10,
            padding: '12px 14px',
            borderRadius: 'var(--radio-m)',
            background: 'var(--peligro-bg)',
            color: 'var(--peligro)',
            border: '2px solid var(--peligro)',
            boxShadow: '3px 3px 0 var(--peligro)',
            fontSize: 14.5,
            fontWeight: 600,
          }}
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="col" style={{ gap: 18 }}>
        <div className="campo">
          <label htmlFor="reset-email">Correo electrónico</label>
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            placeholder="nombre@alumco.cl"
            className="input"
            // A11Y-24 · El mensaje de error queda asociado al campo que lo originó.
            aria-invalid={state.field === 'email' || undefined}
            aria-describedby={state.field === 'email' ? 'recuperar-error' : undefined}
          />
        </div>

        <button type="submit" disabled={isPending} className="btn btn-primary btn-lg" style={{ width: '100%' }} aria-busy={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Enviando…
            </>
          ) : (
            'Enviar enlace de recuperación'
          )}
        </button>
      </form>

      <button
        onClick={onBack}
        className="fila"
        style={{ justifyContent: 'center', gap: 8, fontSize: 15, color: 'var(--tinta-2)', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44 }}
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        Volver al inicio de sesión
      </button>
    </div>
  )
}
