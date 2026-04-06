'use client'

import { useActionState, useState } from 'react'
import { registerRequestAction, type ActionResult } from '@/lib/actions/registro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Info, CheckCircle2 } from 'lucide-react'

const initialState: ActionResult = {}

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerRequestAction,
    initialState
  )

  if (state.success) {
    return (
      <div className="flex flex-col items-center text-center space-y-4 py-8">
        <div className="h-16 w-16 rounded-full bg-[#27AE60]/10 flex items-center justify-center">
          <CheckCircle2
            className="h-8 w-8 text-[#27AE60]"
            aria-hidden="true"
          />
        </div>
        <h2 className="text-xl font-semibold text-[#1A1A2E]">
          Solicitud enviada
        </h2>
        <p className="text-muted-foreground text-base max-w-sm">
          Te notificaremos por correo cuando un administrador
          active tu cuenta. Este proceso puede tomar algunas horas.
        </p>
        <a
          href="/login"
          className="text-[#2B4FA0] font-semibold hover:underline text-base"
        >
          Volver al inicio de sesión
        </a>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* Error global */}
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

      {/* Nombre completo */}
      <div className="space-y-2">
        <Label htmlFor="full_name" className="text-base font-medium">
          Nombre completo
        </Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          disabled={isPending}
          placeholder="María González"
          className="h-12 text-base"
        />
      </div>

      {/* RUT */}
      <div className="space-y-2">
        <Label htmlFor="rut" className="text-base font-medium">
          RUT
        </Label>
        <Input
          id="rut"
          name="rut"
          type="text"
          autoComplete="off"
          required
          disabled={isPending}
          placeholder="12.345.678-9"
          className="h-12 text-base"
        />
      </div>

      {/* Correo */}
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
          placeholder="nombre@ejemplo.cl"
          className="h-12 text-base"
        />
      </div>

      {/* Contraseña */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-base font-medium">
          Contraseña
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
          placeholder="Mínimo 8 caracteres"
          className="h-12 text-base"
        />
      </div>

      {/* Confirmar contraseña */}
      <div className="space-y-2">
        <Label htmlFor="confirm_password" className="text-base font-medium">
          Confirmar contraseña
        </Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
          placeholder="Repite tu contraseña"
          className="h-12 text-base"
        />
      </div>

      {/* Banner informativo */}
      <div
        className="flex gap-3 rounded-xl border border-[#F5A623] bg-[#FFF8E7] p-4"
        role="note"
        aria-label="Información sobre el proceso de aprobación"
      >
        <Info
          className="h-5 w-5 shrink-0 text-[#F5A623] mt-0.5"
          aria-hidden="true"
        />
        <p className="text-sm text-[#1A1A2E] leading-snug">
          Tu solicitud será revisada por un administrador antes de
          activar tu cuenta. Recibirás un correo cuando sea aprobada.
        </p>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 text-base font-semibold bg-[#2B4FA0] hover:bg-[#2B4FA0]/90"
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Loader2
              className="mr-2 h-5 w-5 animate-spin"
              aria-hidden="true"
            />
            Enviando solicitud...
          </>
        ) : (
          'Enviar solicitud'
        )}
      </Button>
    </form>
  )
}