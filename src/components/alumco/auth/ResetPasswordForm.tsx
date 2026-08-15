'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { resetPasswordAction, type ActionResult } from '@/lib/actions/auth'
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'

const initialState: ActionResult = {}

interface ResetPasswordFormProps {
  /** Credencial de un solo uso que venía en el enlace del correo. */
  code?: string
  tokenHash?: string
}

export function ResetPasswordForm({ code, tokenHash }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState)
  const [verContrasena, setVerContrasena] = useState(false)
  const [mayusculas, setMayusculas] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  // Foco explícito en el primer campo, no `autoFocus`: así se mueve DESPUÉS de
  // que el <h1> existe y el lector de pantalla no se salta el título (2.4.3).
  useEffect(() => {
    passwordRef.current?.focus()
  }, [])

  if (state.success) {
    return (
      <div
        role="status"
        className="col"
        style={{ alignItems: 'center', textAlign: 'center', gap: 16, padding: '16px 0' }}
      >
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
          <p style={{ fontWeight: 700, fontSize: 18 }}>Contraseña actualizada</p>
          <p className="silencio" style={{ fontSize: 15, marginTop: 4 }}>
            Ya puede ingresar a la plataforma con su contraseña nueva.
          </p>
        </div>
        <Link href="/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
          Ir a ingresar
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="col" style={{ gap: 18 }} noValidate>
      <input type="hidden" name="code" value={code ?? ''} />
      <input type="hidden" name="token_hash" value={tokenHash ?? ''} />

      {state.error && (
        <div
          id="reset-error"
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

      <div className="campo">
        <label htmlFor="password">Contraseña nueva (obligatoria)</label>
        <div style={{ position: 'relative' }}>
          <input
            id="password"
            ref={passwordRef}
            name="password"
            type={verContrasena ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            disabled={isPending}
            // A11Y-24 · Antes cualquier error marcaba inválidos LOS DOS campos,
            // aunque el fallo fuera sólo de uno. `state.field` dice cuál.
            aria-describedby={state.field === 'password' ? 'reset-error password-ayuda' : 'password-ayuda'}
            aria-invalid={state.field === 'password' || undefined}
            placeholder="••••••••"
            onKeyUp={(e) => setMayusculas(e.getModifierState('CapsLock'))}
            onBlur={() => setMayusculas(false)}
            className="input"
            style={{ paddingRight: 48 }}
          />
          <button
            type="button"
            onClick={() => setVerContrasena((v) => !v)}
            disabled={isPending}
            aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              height: '100%',
              width: 46,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--tinta-3)',
            }}
          >
            {verContrasena ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        <p id="password-ayuda" className="texto-s silencio-3" style={{ marginTop: 6 }}>
          Mínimo 8 caracteres.
        </p>
        {mayusculas && (
          <p className="texto-s fila" style={{ gap: 6, color: 'var(--aviso)' }} aria-live="polite">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            Mayúsculas activadas
          </p>
        )}
      </div>

      <div className="campo">
        <label htmlFor="confirm">Repita la contraseña nueva (obligatoria)</label>
        <input
          id="confirm"
          name="confirm"
          type={verContrasena ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={8}
          disabled={isPending}
          aria-invalid={state.field === 'confirm' || undefined}
          aria-describedby={state.field === 'confirm' ? 'reset-error' : undefined}
          placeholder="••••••••"
          className="input"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary btn-lg"
        style={{ width: '100%' }}
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Guardando…
          </>
        ) : (
          'Guardar contraseña'
        )}
      </button>
    </form>
  )
}
