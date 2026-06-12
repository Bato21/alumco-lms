import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { LoginForm } from '@/components/alumco/LoginForm'

export const metadata: Metadata = {
  title: 'Ingresar | Alumco LMS',
}

// Foto atmosférica del panel: poner en false para volver al gradiente puro
const SHOW_HERO_PHOTO = true

// Onda con tangentes idénticas en ambos extremos: el loop de deriva es perfecto.
// `amplitude` varía la forma por capa para que el agua no se vea repetida.
function wavePath(amplitude: number) {
  return `M0,64 C240,${64 + amplitude} 480,${64 - amplitude} 720,64 C960,${64 + amplitude} 1200,${64 - amplitude} 1440,64 L1440,120 L0,120 Z`
}

function Wave({ className, fill, amplitude = 64 }: { className?: string; fill: string; amplitude?: number }) {
  const d = wavePath(amplitude)
  return (
    <div className={`login-wave-layer absolute bottom-0 left-0 w-full overflow-hidden ${className ?? ''}`} aria-hidden="true">
      <div className="login-wave-bob">
        <div className="login-wave flex w-[200%] h-full">
          <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d={d} fill={fill} />
          </svg>
          <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d={d} fill={fill} />
          </svg>
        </div>
      </div>
    </div>
  )
}

function KimunkoDrop({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 44 52"
      width={size}
      height={size * 1.18}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
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
        opacity="0.3"
        transform="rotate(-20 16 26)"
      />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <div className="login-shell min-h-dvh md:h-dvh md:overflow-hidden flex flex-col md:flex-row bg-[#FCFAF6]">

      {/* Columna izquierda — branding "amanecer sobre agua", tratamiento cinematográfico */}
      <section className="hidden md:flex md:w-1/2 lg:w-[45%] relative flex-col p-10 lg:p-14 bg-gradient-to-b from-[#0d1c45] to-[#152a66] overflow-hidden film-grain cine-vignette">
        {SHOW_HERO_PHOTO && (
          <>
            {/* Foto atmosférica — amanecer sobre el mar, oscurecida a lo cine */}
            <Image
              src="/login-hero.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 50vw, 0px"
              className="object-cover scale-105"
              aria-hidden="true"
            />
            {/* Tinte navy de marca, profundo para legibilidad y mood */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#0d1c45cc] via-[#152a66d9] to-[#0a1638f2]"
              aria-hidden="true"
            />
          </>
        )}
        {/* Resplandor ámbar — el amanecer */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 75% 0%, rgba(245,166,35,0.14), transparent)',
          }}
          aria-hidden="true"
        />

        {/* Contenido central */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center pb-24">
          <div className="relative">
            <div className="mascot-drips" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="mascot-pose">
              <div className="login-float">
                <div className="mascot-sway">
                  <div className="mascot-breathe">
                    <KimunkoDrop size={88} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 text-3xl font-extrabold tracking-tight">
            <span className="text-white">Kimün</span>
            <span className="text-[#F5A623]">Ko</span>
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-blue-100/50">
            sabiduría del agua
          </p>

          <div className="h-px w-12 bg-white/20 my-8" />

          <p className="text-[10px] uppercase tracking-[0.3em] text-[#F5A623]/80 mb-4 flex items-center justify-center gap-2">
            <span aria-hidden="true">◆</span> Plataforma de capacitación
          </p>

          <p className="max-w-md font-display text-4xl lg:text-[2.75rem] font-medium text-white leading-[1.15] tracking-tight [text-wrap:balance]">
            Nuestros cuidados son el reflejo de la{' '}
            <em className="text-[#F5A623] italic">empatía</em>.
          </p>
          <p className="mt-5 max-w-sm text-blue-100/75 text-base lg:text-lg leading-relaxed">
            Plataforma de capacitación continua para brindar la mejor atención
            a nuestras personas mayores.
          </p>
        </div>

        {/* Splash al enviar */}
        <div className="mascot-splash" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        {/* Agua — tres capas de ondas con formas distintas */}
        <Wave className="h-32 login-wave-slow" fill="rgba(255,255,255,0.05)" amplitude={46} />
        <Wave className="h-24 login-wave-reverse" fill="rgba(245,166,35,0.07)" amplitude={72} />
        <Wave className="h-16" fill="rgba(255,255,255,0.08)" amplitude={58} />

        <p className="relative z-10 text-xs text-blue-100/40">
          © {new Date().getFullYear()} Alumco · Capacitación interna
        </p>
      </section>

      {/* Franja decorativa móvil */}
      <div className="md:hidden relative h-28 shrink-0 bg-gradient-to-b from-[#0d1c45] to-[#152a66] overflow-hidden film-grain">
        {SHOW_HERO_PHOTO && (
          <>
            <Image
              src="/login-hero.jpg"
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, 0px"
              className="object-cover object-[center_35%] scale-105"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#0d1c45b3] to-[#152a66cc]"
              aria-hidden="true"
            />
          </>
        )}
        <Wave className="h-10" fill="rgba(252,250,246,1)" />
      </div>

      {/* Columna derecha — formulario */}
      <section className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm login-fade-up">

            {/* Logo Alumco + relación con KimünKo */}
            <div className="flex flex-col items-center mb-10">
              <Image
                src="/LogoAlumco.png"
                alt="Alumco LMS"
                width={200}
                height={68}
                className="object-contain"
                priority
              />
              <p className="mt-3 text-xs text-slate-400 tracking-wide">
                <span className="font-semibold text-slate-500">Kimün<span className="text-[#F5A623]">Ko</span></span>
                {' '}· plataforma de capacitación de ONG Alumco
              </p>
            </div>

            <header className="mb-8 text-center">
              <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
                Ingreso a la plataforma
              </h1>
              <p className="text-slate-600 text-base mt-2">
                Ingrese sus credenciales para continuar.
              </p>
            </header>

            <LoginForm />

            <p className="mt-8 text-center text-base text-slate-500">
              ¿No tiene una cuenta?{' '}
              <Link
                href="/registro"
                className="inline-flex items-center text-amber-700 font-semibold underline underline-offset-4 decoration-amber-700/40 hover:decoration-amber-700 hover:text-amber-800 transition-colors min-h-[44px]"
              >
                Solicitar acceso
              </Link>
            </p>
          </div>
        </div>

        {/* Soporte */}
        <footer className="shrink-0 pb-6 flex justify-center text-sm text-slate-500">
          <a
            href="mailto:soporte@alumco.cl"
            className="inline-flex items-center min-h-[44px] px-3 underline underline-offset-4 decoration-slate-300 hover:decoration-slate-500 hover:text-slate-700 transition-colors"
          >
            ¿Problemas para ingresar? Contactar soporte
          </a>
        </footer>
      </section>

    </div>
  )
}
