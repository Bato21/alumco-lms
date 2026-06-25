import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { LoginForm } from '@/components/alumco/auth/LoginForm'
import { Onda } from '@/components/alumco/ds'

export const metadata: Metadata = {
  title: 'Ingresar | Alumco LMS',
}

// Gota mascota animada (reacciona al formulario vía :has() en .login-shell)
function GotaMascota({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="0 0 44 52" width={size} height={size * 1.18} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22 2 C22 2 4 19 4 30 C4 41 12 49 22 49 C32 49 40 41 40 30 C40 19 22 2 22 2Z" fill="var(--oliva-clara, #aac6a3)" />
      <ellipse cx="16" cy="26" rx="4" ry="7" fill="white" opacity="0.3" transform="rotate(-20 16 26)" />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <div className="login-shell paleta-azul flex flex-col md:flex-row" style={{ minHeight: '100vh' }}>

      {/* Panel de marca — "Amanecer sobre agua" */}
      <div
        className="hidden md:flex film-grain"
        style={{
          flex: '0 0 44%',
          background: 'var(--grad-marca)',
          color: '#fff',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Foto atmosférica difuminada */}
        <Image
          src="/login-hero.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 44vw, 0px"
          aria-hidden="true"
          style={{ objectFit: 'cover', transform: 'scale(1.08)', filter: 'blur(2px)' }}
        />
        {/* Tinte navy de marca para legibilidad (suave: deja ver la foto) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(168deg, rgba(13,28,69,0.55) 0%, rgba(21,42,102,0.6) 55%, rgba(10,22,56,0.72) 100%)',
          }}
        />
        {/* Resplandor ámbar — el amanecer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(90% 60% at 50% 115%, rgba(245,166,35,0.22) 0%, rgba(245,166,35,0.06) 45%, transparent 70%)',
          }}
        />
        <div className="col entra" style={{ alignItems: 'center', textAlign: 'center', gap: 0, position: 'relative', zIndex: 1, maxWidth: 420 }}>
          {/* Gota mascota — reacciona al formulario vía :has() (animaciones en globals.css) */}
          <div
            className="login-float"
            style={{ position: 'relative', width: 96, height: 116, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          >
            {/* anillos en el agua (mientras carga) */}
            <div className="mascot-splash" aria-hidden="true">
              <span /><span /><span />
            </div>
            {/* la gota: float (ancestro) ∘ sway ∘ breathe ∘ pose */}
            <div className="mascot-sway">
              <div className="mascot-breathe">
                <div className="mascot-pose">
                  <GotaMascota size={72} />
                </div>
              </div>
            </div>
            {/* gotitas que saltan al escribir la contraseña */}
            <div className="mascot-drips" aria-hidden="true">
              <span /><span /><span />
            </div>
          </div>
          <div style={{ marginTop: 18, fontFamily: 'var(--fuente-cuerpo)', fontWeight: 700, fontSize: 26 }}>
            Kimün<span style={{ color: 'var(--oliva-clara)' }}>Ko</span>
          </div>
          <div style={{ fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
            Sabiduría del agua
          </div>
          <div style={{ width: 56, height: 1, background: 'rgba(255,255,255,0.25)', margin: '30px 0' }} />
          <span className="t-eyebrow" style={{ color: 'var(--ambar)' }}>◆ Plataforma de capacitación</span>
          <h1 className="t-display" style={{ fontSize: 42, color: '#fff', marginTop: 16 }}>
            Nuestros cuidados son el reflejo de la <span style={{ fontStyle: 'italic', color: 'var(--oliva-clara)' }}>empatía</span>.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 18, fontSize: 16, lineHeight: 1.6 }}>
            Capacitación continua para brindar la mejor atención a nuestras personas mayores.
          </p>
        </div>
        <div className="login-wave-layer" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <Onda alto={52} color="rgba(255,255,255,0.07)" />
        </div>
        <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center', fontSize: 12.5, color: 'rgba(255,255,255,0.45)', zIndex: 1 }}>
          © {new Date().getFullYear()} Alumco · Capacitación interna
        </div>
      </div>

      {/* Formulario */}
      <div className="crece" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', background: 'var(--crema)', backgroundImage: 'none' }}>
        <div className="col entra entra-1" style={{ width: 430, maxWidth: '100%', gap: 0 }}>
          <Link
            href="/"
            className="texto-s silencio-3"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
          >
            <span aria-hidden="true">←</span> Volver a la página principal
          </Link>

          {/* Card del login (look típico: borde + sombra suave) */}
          <div className="card" style={{ padding: '34px 32px' }}>
            <div className="col" style={{ alignItems: 'center', gap: 6, marginBottom: 30, textAlign: 'center' }}>
              {/* Logo del cliente — ONG Alumco (marca KimünKo abajo) */}
              <Image
                src="/LogoAlumco.png"
                alt="Alumco"
                width={168}
                height={57}
                priority
                style={{ objectFit: 'contain' }}
              />
              <p className="texto-s silencio-3" style={{ marginTop: 6 }}>
                Kimün<span style={{ color: 'var(--ambar)' }}>Ko</span> · plataforma de capacitación de ONG Alumco
              </p>
            </div>
            <h2 className="t-display" style={{ fontSize: 27, textAlign: 'center' }}>Ingreso a la plataforma</h2>
            <p className="silencio" style={{ textAlign: 'center', marginTop: 6, marginBottom: 26 }}>
              Ingrese sus credenciales para continuar.
            </p>

            <LoginForm />

            <p className="texto-s" style={{ textAlign: 'center', marginTop: 24, color: 'var(--tinta-2)' }}>
              ¿No tiene una cuenta?{' '}
              <Link href="/registro" style={{ fontWeight: 600 }}>Solicitar acceso</Link>
            </p>
          </div>

          <p className="texto-s" style={{ textAlign: 'center', marginTop: 18 }}>
            <a href="mailto:soporte@alumco.cl" className="silencio-3">¿Problemas para ingresar? Contactar soporte</a>
          </p>
        </div>
      </div>
    </div>
  )
}
