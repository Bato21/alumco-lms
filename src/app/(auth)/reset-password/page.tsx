import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { ResetPasswordForm } from '@/components/alumco/auth/ResetPasswordForm'
import { MarcaAlumco } from '@/components/alumco/ds'

export const metadata: Metadata = {
  title: 'Restablecer contraseña',
}

interface ResetPasswordPageProps {
  searchParams: Promise<{
    code?: string
    token_hash?: string
    error?: string
    error_description?: string
  }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { code, token_hash: tokenHash, error, error_description: errorDescription } =
    await searchParams

  // Supabase rebota aquí con ?error=... cuando el enlace ya venció o fue usado.
  const enlaceRechazado = Boolean(error || errorDescription)
  const enlaceIncompleto = !enlaceRechazado && !code && !tokenHash

  return (
    <main
      id="contenido-principal"
      tabIndex={-1}
      className="flex flex-col items-center justify-center px-4 py-12"
      style={{ minHeight: '100vh' }}
    >
      <div className="w-full" style={{ maxWidth: 460 }}>
        <div
          className="col"
          style={{ alignItems: 'center', gap: 6, marginBottom: 28, textAlign: 'center' }}
        >
          <MarcaAlumco />
          <p className="texto-s silencio-3" style={{ marginTop: 6 }}>
            Kimün<span style={{ color: 'var(--ambar-700)' }}>Ko</span> · plataforma de capacitación de ONG
            Alumco
          </p>
        </div>

        <div className="card card-pad">
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <h1 className="t-display" style={{ fontSize: 26 }}>
              Restablecer contraseña
            </h1>
            {!enlaceRechazado && !enlaceIncompleto && (
              <p className="silencio" style={{ marginTop: 4 }}>
                Elija una contraseña nueva para su cuenta.
              </p>
            )}
          </div>

          {enlaceRechazado || enlaceIncompleto ? (
            <div className="col" style={{ gap: 18 }}>
              <div
                role="alert"
                className="fila"
                style={{
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 'var(--radio-m)',
                  background: 'var(--peligro-bg)',
                  color: 'var(--peligro)',
                  border: '2px solid var(--peligro)',
                  boxShadow: '3px 3px 0 var(--peligro)',
                  fontSize: 14.5,
                  fontWeight: 600,
                }}
              >
                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>
                  {enlaceRechazado
                    ? 'Este enlace ya no sirve: venció o fue usado antes.'
                    : 'Este enlace está incompleto. Ábralo tal como llegó en el correo, sin recortarlo.'}
                </span>
              </div>
              <p className="silencio" style={{ fontSize: 15 }}>
                Puede pedir uno nuevo desde «¿Olvidó su clave?» en la pantalla de ingreso. Los
                enlaces duran poco por seguridad.
              </p>
              <Link href="/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Volver a ingresar
              </Link>
            </div>
          ) : (
            <ResetPasswordForm code={code} tokenHash={tokenHash} />
          )}
        </div>

        <p className="texto-s" style={{ textAlign: 'center', marginTop: 22 }}>
          <a href="mailto:soporte@alumco.cl" className="silencio-3">
            ¿Problemas para ingresar? Contactar soporte
          </a>
        </p>
      </div>
    </main>
  )
}
