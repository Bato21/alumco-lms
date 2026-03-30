'use client'

import { useActionState } from 'react'
import { loginAction, type ActionResult } from '@/lib/actions/auth'
import { AlertCircle, Loader2 } from 'lucide-react'

const initialState: ActionResult = {}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  )

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error && (
        <div
          className="flex items-center gap-3 p-4 rounded-lg bg-[var(--md-error-container)] text-[var(--md-on-error-container)]"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium">{state.error}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[var(--md-on-surface-variant)]"
        >
          Correo electrónico
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            placeholder="nombre@empresa.com"
            className="w-full h-[52px] px-4 bg-[var(--md-surface-container-low)] border-none rounded-lg text-[var(--md-on-surface)] placeholder:text-[var(--md-outline-variant)] focus:ring-2 focus:ring-[var(--md-primary)]/50 transition-all outline-none ghost-border"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[var(--md-on-surface-variant)]"
          >
            Contraseña
          </label>
          <a
            href="#"
            className="text-sm text-[var(--md-primary)] font-semibold hover:underline decoration-2 underline-offset-4"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            placeholder="••••••••"
            className="w-full h-[52px] px-4 bg-[var(--md-surface-container-low)] border-none rounded-lg text-[var(--md-on-surface)] placeholder:text-[var(--md-outline-variant)] focus:ring-2 focus:ring-[var(--md-primary)]/50 transition-all outline-none ghost-border"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-[52px] bg-[#2B4FA0] text-white font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>Ingresando...</span>
          </>
        ) : (
          <>
            <span>Ingresar</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </>
        )}
      </button>
    </form>
  )
}
