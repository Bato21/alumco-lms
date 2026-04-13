'use client'

import { useActionState, useState } from 'react'
import { forgotPasswordAction, type ActionResult } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'

const initialState: ActionResult = {}

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialState
  )

  if (state.success) {
    return (
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className="h-14 w-14 rounded-full bg-[#27AE60]/10 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-[#27AE60]" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold text-[#1A1A2E]">
            Revisa tu correo
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-[#1e3a8a] font-semibold hover:underline"
        >
          Volver al inicio de sesión
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      {state.error && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Correo electrónico
          </Label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <Input
              id="reset-email"
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

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 text-sm font-bold bg-[#1e3a8a] hover:bg-[#162a63] text-white rounded-xl"
          aria-busy={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Enviando...
            </>
          ) : (
            'Enviar enlace de recuperación'
          )}
        </Button>
      </form>

      <button
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-[#1e3a8a] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al inicio de sesión
      </button>
    </div>
  )
}