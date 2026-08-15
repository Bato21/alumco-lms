'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { loginAction, type ActionResult } from '@/lib/actions/auth'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

const initialState: ActionResult = {}

// Cuentas demo reales (burbuja aislada, sede_demo, is_demo=true). Su contenido
// vive en su propio mundo y se reinicia con un cron. Ver docs/superpowers/
// plans/2026-07-23-acceso-demo-burbuja.md
const DEMO = {
  colaborador: { email: 'demo-colab@kimunko.demo', password: 'democolab2026' },
  admin: { email: 'demo-admin@kimunko.demo', password: 'demoadmin2026' },
} as const

export function LoginForm() {
  const [showForgot, setShowForgot] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  // Antes era `autoFocus` en el campo de correo. Se conserva el mismo
  // comportamiento (foco inicial en el correo) pero de forma explícita, no
  // declarativa: el foco se mueve DESPUÉS de que el <h1> y el resto de la
  // página existan, que es lo que evita que un lector de pantalla se salte
  // el título. Queda pendiente de decisión con la clienta si conviene
  // retirarlo en móvil, donde abre el teclado y tapa media pantalla.
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

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
          id="login-error"
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

      {/* 3.3.2 · La obligatoriedad tiene que constar en texto, no sólo en el
          atributo `required`. */}
      <p className="texto-s silencio-3" style={{ margin: 0 }}>
        Ambos campos son obligatorios.
      </p>

      <div className="campo">
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          ref={emailRef}
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          placeholder="nombre@alumco.cl"
          className="input"
          // A11Y-24 · El error se asocia al campo que lo originó. Cuando el
          // rechazo viene de Supabase no se dice cuál de los dos falló —sería un
          // oráculo de cuentas—, así que `state.field` llega vacío y no se marca
          // ninguno como inválido.
          aria-invalid={state.field === 'email' || undefined}
          aria-describedby={state.field === 'email' ? 'login-error' : undefined}
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
            aria-invalid={state.field === 'password' || undefined}
            aria-describedby={
              [
                state.field === 'password' ? 'login-error' : null,
                capsLockOn ? 'login-caps' : null,
              ].filter(Boolean).join(' ') || undefined
            }
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
          <p id="login-caps" className="texto-s fila" style={{ gap: 6, color: 'var(--aviso)' }} aria-live="polite">
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
      <div
        className="col"
        style={{
          gap: 10,
          marginTop: 8,
          padding: '16px 16px 18px',
          borderRadius: 'var(--radio-m)',
          border: '2px dashed var(--azul-800)',
          background: 'var(--azul-50)',
        }}
      >
        <div className="col" style={{ gap: 2, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--azul-800)' }}>
            Probar sin registrarse
          </p>
          <p className="texto-s silencio-3" style={{ margin: 0 }}>
            Entra con un clic y explora la plataforma
          </p>
        </div>
        <div className="fila" style={{ gap: 10 }}>
          <button
            type="button"
            onClick={() => loginDemo('colaborador')}
            disabled={isPending}
            className="btn btn-secondary crece"
          >
            Demo Colaborador
          </button>
          <button
            type="button"
            onClick={() => loginDemo('admin')}
            disabled={isPending}
            className="btn btn-secondary crece"
          >
            Demo Admin
          </button>
        </div>
      </div>
    </form>
  )
}
