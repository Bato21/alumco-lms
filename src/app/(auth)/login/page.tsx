import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { LoginForm } from '@/components/alumco/LoginForm'

export const metadata: Metadata = {
  title: 'Ingresar | Alumco LMS',
}

export default function LoginPage() {
  return (
    // 1. Cambiamos a min-h-screen y quitamos overflow-hidden para permitir scroll natural si es necesario
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="flex-grow flex flex-col md:flex-row">

        {/* Columna izquierda — branding (Azul profundo) */}
        {/* Agregamos sticky, top-0 y h-[100dvh] para anclarlo a la pantalla */}
        <section className="hidden md:flex w-full md:w-1/2 bg-[#1e3a8a] items-center justify-center p-8 md:p-16 relative overflow-hidden sticky top-0 h-[100dvh]">
          <div className="relative z-10 flex flex-col items-center justify-center max-w-lg text-center w-full">
            
            {/* Logo */}
            <div className="flex flex-col items-center space-y-4 mb-8">
              <svg
                viewBox="0 0 200 64"
                width="200"
                height="68"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="KimünKo"
                role="img"
              >
                <path
                  d="M22 2 C22 2 4 19 4 30 C4 41 12 49 22 49 C32 49 40 41 40 30 C40 19 22 2 22 2Z"
                  fill="#F5A623"
                />
                <ellipse
                  cx="16"
                  cy="26"
                  rx="4"
                  ry="7"
                  fill="white"
                  opacity="0.25"
                  transform="rotate(-20 16 26)"
                />
                <text
                  x="48"
                  y="36"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="24"
                  fontWeight="800"
                  letterSpacing="-0.5"
                >
                  <tspan fill="white">Kimün</tspan><tspan fill="#F5A623">Ko</tspan>
                </text>
                <text
                  x="48"
                  y="52"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="8"
                  fill="rgba(255,255,255,0.4)"
                  letterSpacing="2"
                >
                  sabiduría del agua
                </text>
              </svg>
              <div className="h-px w-12 bg-white/20" />
            </div>

            {/* Ajustamos un poco los tamaños de texto para pantallas más pequeñas */}
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
              Nuestros Cuidados son el reflejo de la Empatía.
            </h1>
            <p className="text-blue-100/70 text-base lg:text-lg font-light leading-relaxed max-w-md">
              Plataforma de capacitación continua para brindar la mejor atención
              a nuestras personas mayores.
            </p>
          </div>

          {/* Detalles estéticos de fondo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" aria-hidden="true" />
        </section>

        {/* Columna derecha — formulario */}
        {/* Quitamos el overflow-y-auto para que el scroll sea global */}
        <section className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
          <div className="w-full max-w-[440px] space-y-8 py-8">

            {/* Logo */}
            <div className="flex justify-center">
              <Image
                src="/LogoAlumco.png"
                alt="Alumco LMS"
                width={160}
                height={54}
                className="object-contain"
                priority
              />
            </div>

            {/* Tarjeta del Formulario */}
            <div className="w-full bg-white p-8 sm:p-12 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <header className="mb-10 text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Ingreso a Plataforma
                </h2>
                <p className="text-slate-500 text-sm mt-2">
                  Bienvenido de nuevo. Por favor ingrese sus credenciales.
                </p>
              </header>

              <LoginForm />

              {/* Footer de la tarjeta */}
              <footer className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
                <p className="text-sm text-slate-500">
                  ¿No tiene una cuenta todavía?
                </p>
                <Link
                  href="/registro"
                  className="text-[#1e3a8a] font-bold text-sm hover:text-[#162a63] transition-colors"
                >
                  Solicitar acceso a la administración
                </Link>
              </footer>
            </div>

            {/* Links legales */}
            <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400 font-medium">
              <a href="#" className="hover:text-[#1e3a8a] transition-colors">Términos de servicio</a>
              <a href="#" className="hover:text-[#1e3a8a] transition-colors">Política de privacidad</a>
              <a href="#" className="hover:text-[#1e3a8a] transition-colors">Soporte técnico</a>
            </div>

          </div>
        </section>

      </main>
    </div>
  )
}