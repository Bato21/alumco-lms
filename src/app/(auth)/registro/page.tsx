import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/alumco/RegisterForm'
import { MarcaAlumco } from '@/components/alumco/ds'

export const metadata: Metadata = {
  title: 'Solicitar acceso',
}

export default function RegistroPage() {
  return (
    <main className="flex flex-col items-center justify-center px-4 py-12" style={{ minHeight: '100vh' }}>
      <div className="w-full" style={{ maxWidth: 520 }}>
        <div className="col" style={{ alignItems: 'center', gap: 6, marginBottom: 28, textAlign: 'center' }}>
          <MarcaAlumco />
          <p className="texto-s silencio-3" style={{ marginTop: 6 }}>
            Kimün<span style={{ color: 'var(--ambar)' }}>Ko</span> · plataforma de capacitación de ONG Alumco
          </p>
        </div>

        <div className="card card-pad">
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <h1 className="t-display" style={{ fontSize: 26 }}>Crear cuenta</h1>
            <p className="silencio" style={{ marginTop: 4 }}>Completa tus datos para solicitar acceso a la plataforma.</p>
          </div>
          <RegisterForm />
        </div>

        <p className="texto-s" style={{ textAlign: 'center', marginTop: 22, color: 'var(--tinta-2)' }}>
          ¿Ya tienes cuenta? <Link href="/login" style={{ fontWeight: 600 }}>Ingresar</Link>
        </p>
      </div>
    </main>
  )
}
