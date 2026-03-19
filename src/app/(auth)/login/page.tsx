// src/app/(auth)/login/page.tsx
import type { Metadata } from 'next'
import { LoginForm } from '@/components/alumco/LoginForm'
import { GraduationCap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ingresar',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">

      {/* Tarjeta central */}
      <div className="w-full max-w-sm space-y-8">

        {/* Logo + marca */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary"
            aria-hidden="true"
          >
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Alumco LMS
            </h1>
            <p className="mt-1 text-muted-foreground text-base">
              Plataforma de capacitación continua
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">
            Ingresa a tu cuenta
          </h2>
          <LoginForm />
        </div>

        {/* Pie */}
        <p className="text-center text-sm text-muted-foreground">
          ¿Problemas para ingresar? Contacta a tu administrador.
        </p>
      </div>
    </main>
  )
}