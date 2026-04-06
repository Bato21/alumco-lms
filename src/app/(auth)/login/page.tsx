import type { Metadata } from 'next'
import { LoginForm } from '@/components/alumco/LoginForm'
import { AlumcoLogo } from '@/components/alumco/AlumcoLogo'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Login | Alumco LMS',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-6 bg-[var(--md-surface)] relative">
      {/* Logo Section */}
      <AlumcoLogo className="mb-12" size="md" />

      {/* Login Card */}
      <div className="w-full max-w-[440px] bg-[var(--md-surface-container-lowest)] architectural-shadow rounded-xl p-8 md:p-10 ghost-border">
        <div className="text-center mb-10">
          <h2 className="text-[1.5rem] font-bold text-[#2B4FA0] leading-tight mb-2">
            Bienvenido/a
          </h2>
          <p className="text-[var(--md-secondary)] font-medium">
            Ingresa a la plataforma de capacitación
          </p>
        </div>

        <LoginForm />

        {/* Card Footer */}
        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Problemas para ingresar? Contacta a tu administrador.
          </p>
          <p className="text-base">
            ¿Primera vez?{' '}
            <Link
              href="/registro"
              className="text-[#2B4FA0] font-semibold hover:underline"
            >
              Solicitar acceso
            </Link>
          </p>
        </div>
      </div>

      {/* External Links */}
      <div className="mt-8 flex gap-6 text-sm text-[var(--md-outline)]">
        <a
          href="#"
          className="hover:text-[var(--md-primary)] transition-colors"
        >
          Términos de servicio
        </a>
        <a
          href="#"
          className="hover:text-[var(--md-primary)] transition-colors"
        >
          Privacidad
        </a>
      </div>

      {/* Visual Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-[var(--md-primary)]/5 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -left-[5%] w-[40%] h-[40%] bg-[var(--md-secondary)]/5 rounded-full blur-[120px]"></div>
      </div>
    </main>
  )
}
