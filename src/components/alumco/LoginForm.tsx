'use client'

import { useActionState } from 'react'
import { loginAction, type ActionResult } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

const initialState: ActionResult = {}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  )

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error && (
        <Alert
          variant="destructive"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <AlertDescription className="text-base">
            {state.error}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-base font-medium">
          Correo electrónico
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          placeholder="nombre@alumco.cl"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-base font-medium">
          Contraseña
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
          placeholder="••••••••"
          className="h-12 text-base"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 text-base font-semibold"
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Ingresando...
          </>
        ) : (
          'Ingresar'
        )}
      </Button>
    </form>
  )
}