'use client'

import { useActionState } from 'react'
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
        <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-lg">
            Revise su correo
          </p>
          <p className="text-base text-slate-600 mt-1">
            Si existe una cuenta con ese correo, recibirá un enlace para restablecer su contraseña.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-base text-amber-700 font-semibold underline underline-offset-4 decoration-amber-700/40 hover:decoration-amber-700 hover:text-amber-800 transition-colors min-h-[44px]"
        >
          Volver al inicio de sesión
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-base text-slate-600">
        Ingrese su correo y le enviaremos un enlace para restablecer su contraseña.
      </p>

      {state.error && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <AlertDescription className="text-base">{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="reset-email" className="text-base font-medium text-slate-700">
            Correo electrónico
          </Label>
          <Input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            placeholder="nombre@alumco.cl"
            className="h-12 text-base bg-white border-slate-300 rounded-lg shadow-sm transition-[border-color,box-shadow] duration-200 focus-visible:ring-[#F5A623]/40 focus-visible:border-[#F5A623]"
          />
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
              Enviando…
            </>
          ) : (
            'Enviar enlace de recuperación'
          )}
        </Button>
      </form>

      <button
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-base text-slate-600 hover:text-amber-700 transition-colors min-h-[44px]"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        Volver al inicio de sesión
      </button>
    </div>
  )
}
