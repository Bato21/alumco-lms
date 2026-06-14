import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/alumco/LoginForm'
import { Gota, MarcaAlumco, Onda } from '@/components/alumco/ds'

export const metadata: Metadata = {
  title: 'Ingresar | Alumco LMS',
}

export default function LoginPage() {
  return (
    <div className="login-shell flex flex-col md:flex-row" style={{ minHeight: '100vh' }}>

      {/* Panel de marca — "Amanecer sobre agua" */}
      <div
        className="hidden md:flex"
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(90% 60% at 50% 115%, rgba(245,166,35,0.22) 0%, rgba(245,166,35,0.05) 45%, transparent 70%)',
          }}
        />
        <div className="col entra" style={{ alignItems: 'center', textAlign: 'center', gap: 0, position: 'relative', zIndex: 1, maxWidth: 420 }}>
          <Gota s={52} />
          <div style={{ marginTop: 18, fontFamily: 'var(--fuente-cuerpo)', fontWeight: 700, fontSize: 26 }}>
            Kimün<span style={{ color: 'var(--ambar)' }}>Ko</span>
          </div>
          <div style={{ fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
            Sabiduría del agua
          </div>
          <div style={{ width: 56, height: 1, background: 'rgba(255,255,255,0.25)', margin: '30px 0' }} />
          <span className="t-eyebrow" style={{ color: 'var(--ambar)' }}>◆ Plataforma de capacitación</span>
          <h1 className="t-display" style={{ fontSize: 42, color: '#fff', marginTop: 16 }}>
            Nuestros cuidados son el reflejo de la <em style={{ color: 'var(--ambar)' }}>empatía</em>.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 18, fontSize: 16, lineHeight: 1.6 }}>
            Capacitación continua para brindar la mejor atención a nuestras personas mayores.
          </p>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <Onda alto={52} color="rgba(255,255,255,0.07)" />
        </div>
        <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center', fontSize: 12.5, color: 'rgba(255,255,255,0.45)', zIndex: 1 }}>
          © {new Date().getFullYear()} Alumco · Capacitación interna
        </div>
      </div>

      {/* Formulario */}
      <div className="crece" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <div className="col entra entra-1" style={{ width: 400, maxWidth: '100%', gap: 0 }}>
          <div className="col" style={{ alignItems: 'center', gap: 6, marginBottom: 34, textAlign: 'center' }}>
            <MarcaAlumco />
            <p className="texto-s silencio-3" style={{ marginTop: 6 }}>
              Kimün<span style={{ color: 'var(--ambar)' }}>Ko</span> · plataforma de capacitación de ONG Alumco
            </p>
          </div>
          <h2 className="t-display" style={{ fontSize: 28, textAlign: 'center' }}>Ingreso a la plataforma</h2>
          <p className="silencio" style={{ textAlign: 'center', marginTop: 6, marginBottom: 28 }}>
            Ingrese sus credenciales para continuar.
          </p>

          <LoginForm />

          <p className="texto-s" style={{ textAlign: 'center', marginTop: 26, color: 'var(--tinta-2)' }}>
            ¿No tiene una cuenta?{' '}
            <Link href="/registro" style={{ fontWeight: 600 }}>Solicitar acceso</Link>
          </p>

          <p className="texto-s" style={{ textAlign: 'center', marginTop: 20 }}>
            <a href="mailto:soporte@alumco.cl" className="silencio-3">¿Problemas para ingresar? Contactar soporte</a>
          </p>
        </div>
      </div>
    </div>
  )
}
