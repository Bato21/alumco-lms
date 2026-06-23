'use client'

import { useActionState, useRef, useState } from 'react'
import { loginAction, type ActionResult } from '@/lib/actions/auth'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

const initialState: ActionResult = {}

// Credenciales demo (mismas que usan las capturas de docs/flujo-plataforma)
const DEMO = {
  colaborador: { email: 'Baptiste@gmail.com', password: '12345678' },
  admin: { email: 'da.ongalumco@gmail.com', password: 'alumco123' },
} as const

export function LoginForm() {
  const [showForgot, setShowForgot] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  function loginDemo(rol: keyof typeof DEMO) {
    const form = formRef.current
    if (!form) return
    const { email, password } = DEMO[rol]
    ;(form.elements.namedItem('email') as HTMLInputElement).value = email
    ;(form.elements.namedItem('password') as HTMLInputElement).value = password
    form.requestSubmit()
  }

  if (showForgot) {
    return <ForgotPasswordForm onBack={() => setShowForgot(false)} />
  }

  return (
    <form ref={formRef} action={formAction} className="col" style={{ gap: 18 }} noValidate>
      {state.error && (
        <div
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
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          disabled={isPending}
          placeholder="nombre@alumco.cl"
          className="input"
        />
      </div>

      <div className="campo">
        <div className="fila">
          <label htmlFor="password" className="crece">
            Contraseña
          </label>
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            style={{ fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--azul-800)' }}
          >
            ¿Olvidó su clave?
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            disabled={isPending}
            placeholder="••••••••"
            onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
            onBlur={() => setCapsLockOn(false)}
            className="input"
            style={{ paddingRight: 48 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={isPending}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
            {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
        {capsLockOn && (
          <p className="texto-s fila" style={{ gap: 6, color: 'var(--aviso)' }} aria-live="polite">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            Mayúsculas activadas
          </p>
        )}
      </div>

      <button type="submit" disabled={isPending} className="btn btn-primary btn-lg" style={{ width: '100%' }} aria-busy={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Ingresando…
          </>
        ) : (
          'Ingresar'
        )}
      </button>

      {/* Accesos demo — rellenan credenciales y envían el formulario */}
      <div className="col" style={{ gap: 8, marginTop: 4 }}>
        <p className="texto-s silencio-3" style={{ textAlign: 'center', margin: 0 }}>
          Acceso demo
        </p>
        <div className="fila" style={{ gap: 10 }}>
          <button
            type="button"
            onClick={() => loginDemo('colaborador')}
            disabled={isPending}
            className="btn btn-secondary crece"
          >
            Colaborador
          </button>
          <button
            type="button"
            onClick={() => loginDemo('admin')}
            disabled={isPending}
            className="btn btn-secondary crece"
          >
            Admin
          </button>
        </div>
      </div>
    </form>
  )
}
