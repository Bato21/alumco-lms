'use client'

import { useActionState, useState } from 'react'
import { loginAction, type ActionResult } from '@/lib/actions/auth'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

const initialState: ActionResult = {}

export function LoginForm() {
  const [showForgot, setShowForgot] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  )

  if (showForgot) {
    return <ForgotPasswordForm onBack={() => setShowForgot(false)} />
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.error && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <AlertDescription className="text-base">
            {state.error}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-base font-medium text-slate-700">
          Correo electrónico
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          disabled={isPending}
          placeholder="nombre@alumco.cl"
          className="h-12 text-base bg-white border-slate-300 rounded-lg shadow-sm transition-[border-color,box-shadow] duration-200 focus-visible:ring-[#F5A623]/40 focus-visible:border-[#F5A623]"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="password" className="text-base font-medium text-slate-700">
            Contraseña
          </Label>
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="text-base text-amber-700 font-semibold underline underline-offset-4 decoration-amber-700/40 hover:decoration-amber-700 hover:text-amber-800 transition-colors cursor-pointer min-h-[44px] flex items-center"
          >
            ¿Olvidó su clave?
          </button>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            disabled={isPending}
            placeholder="••••••••"
            onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
            onBlur={() => setCapsLockOn(false)}
            className="h-12 pr-12 text-base bg-white border-slate-300 rounded-lg shadow-sm transition-[border-color,box-shadow] duration-200 focus-visible:ring-[#F5A623]/40 focus-visible:border-[#F5A623]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={isPending}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors rounded-r-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]/40"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {capsLockOn && (
          <p className="text-sm text-amber-700 flex items-center gap-1.5" aria-live="polite">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            Mayúsculas activadas
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 text-base font-semibold bg-[#F5A623] hover:bg-[#E0930F] text-slate-900 rounded-lg transition-[background-color,box-shadow,transform] duration-200 hover:shadow-md hover:shadow-amber-200/60 active:scale-[0.98]"
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Ingresando…
          </>
        ) : (
          'Ingresar'
        )}
      </Button>
    </form>
  )
}
