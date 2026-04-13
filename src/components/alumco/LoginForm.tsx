'use client'

import { useActionState, useState } from 'react'
import { loginAction, type ActionResult } from '@/lib/actions/auth'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

const initialState: ActionResult = {}

export function LoginForm() {
  const [showForgot, setShowForgot] = useState(false)
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  )

  if (showForgot) {
    return <ForgotPasswordForm onBack={() => setShowForgot(false)} />
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <AlertDescription className="text-base">
            {state.error}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Correo electrónico
        </Label>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="20" height="16" x="2" y="4" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            placeholder="nombre@alumco.cl"
            className="h-12 pl-10 text-sm bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Contraseña
          </Label>
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="text-xs text-[#1e3a8a] font-semibold hover:underline"
          >
            ¿Olvidó su clave?
          </button>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            placeholder="••••••••"
            className="h-12 pl-10 text-sm bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 text-sm font-bold bg-[#1e3a8a] hover:bg-[#162a63] text-white rounded-xl shadow-lg shadow-blue-900/10"
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Ingresando...
          </>
        ) : (
          <>
            Ingresar
            <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </>
        )}
      </Button>
    </form>
  )
}