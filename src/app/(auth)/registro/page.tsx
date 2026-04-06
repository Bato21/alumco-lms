import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/alumco/RegisterForm'

export const metadata: Metadata = {
  title: 'Solicitar acceso',
}

export default function RegistroPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] px-4 py-12">
      <div className="w-full max-w-[520px] space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <img
            src="https://ongalumco.cl/wp-content/uploads/2023/11/logo-alumco-completoccc-300x102.png"
            alt="Alumco LMS"
            width={180}
            height={61}
            className="object-contain"
          />
          <p className="text-muted-foreground text-base">
            Plataforma de capacitación continua
          </p>
        </div>

        {/* Tarjeta */}
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#2B4FA0]">
              Crear cuenta
            </h1>
            <p className="mt-1 text-muted-foreground text-base">
              Completa tus datos para solicitar acceso a la plataforma
            </p>
          </div>

          <div className="h-px bg-border mb-6" />

          <RegisterForm />
        </div>

        {/* Link a login */}
        <p className="text-center text-base text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="text-[#2B4FA0] font-semibold hover:underline"
          >
            Ingresar
          </Link>
        </p>
      </div>
    </main>
  )
}