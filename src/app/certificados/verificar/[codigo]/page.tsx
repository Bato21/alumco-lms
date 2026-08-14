import type { Metadata } from 'next'
import Link from 'next/link'
import { Icono, MarcaAlumco, Onda } from '@/components/alumco/ds'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import {
  verifyCertificateByCode,
  normalizeVerificationCode,
  type VerificationResult,
} from '@/lib/certificates/verify'

// Ruta pública: sin sesión y sin cachear (el resultado depende del folio y del
// rate limit por IP).
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  // `absolute`: es una página pública con su propia marca; la plantilla del
  // layout raíz añadiría un segundo sufijo.
  title: { absolute: 'Verificar certificado | Alumco · KimünKo' },
  description:
    'Comprueba la autenticidad de un certificado de capacitación emitido por ONG Alumco.',
  // Los folios no deben terminar indexados: la página es para quien tiene el
  // certificado en la mano, no para buscadores.
  robots: { index: false, follow: false },
}

/** 20 verificaciones por IP cada 10 minutos: sobra para un fiscalizador, corta un script. */
const LIMITE = 20
const VENTANA_MS = 10 * 60 * 1000

interface Props {
  params: Promise<{ codigo: string }>
}

export default async function VerificarCertificadoPage({ params }: Props) {
  const { codigo } = await params
  const code = normalizeVerificationCode(decodeURIComponent(codigo))

  const ip = await getClientIp()
  const limite = checkRateLimit(`verificar:${ip}`, LIMITE, VENTANA_MS)

  const resultado: VerificationResult = limite.ok
    ? await verifyCertificateByCode(code)
    : { status: 'limite_excedido', retryAfter: limite.retryAfter }

  return (
    <main id="contenido-principal" tabIndex={-1} style={{ minHeight: '100dvh', background: 'var(--crema, #FAF7F0)', padding: '32px 16px 56px' }}>
      <div className="col" style={{ maxWidth: 560, margin: '0 auto', gap: 20 }}>

        <div className="fila" style={{ justifyContent: 'center', paddingTop: 8 }}>
          <MarcaAlumco />
        </div>

        <Resultado resultado={resultado} codigo={code} />

        <p className="texto-s silencio-3" style={{ textAlign: 'center', lineHeight: 1.5 }}>
          Esta página permite comprobar la autenticidad de un certificado emitido por{' '}
          <strong>ONG Alumco</strong> a través de su plataforma de capacitación KimünKo.
          Solo muestra los datos necesarios para acreditarlo.
        </p>

        <div className="fila" style={{ justifyContent: 'center' }}>
          <Link href="/" className="btn btn-ghost btn-sm">Ir a la plataforma</Link>
        </div>
      </div>
    </main>
  )
}

function Resultado({ resultado, codigo }: { resultado: VerificationResult; codigo: string }) {
  if (resultado.status === 'valido') {
    return <CertificadoValido cert={resultado.certificate} />
  }
  if (resultado.status === 'limite_excedido') {
    return (
      <Aviso
        icono="reloj"
        tono="aviso"
        titulo="Demasiadas consultas"
        texto={`Se alcanzó el límite de verificaciones desde esta conexión. Vuelve a intentarlo en ${formatoEspera(resultado.retryAfter)}.`}
      />
    )
  }
  // 'no_encontrado' y 'formato_invalido' comparten mensaje a propósito: distinguirlos
  // le confirmaría a quien enumera códigos cuáles tienen el formato correcto.
  return (
    <Aviso
      icono="alerta"
      tono="peligro"
      titulo="Certificado no válido"
      texto="No encontramos ningún certificado con ese folio. Revisa que esté bien escrito o vuelve a escanear el código QR del documento."
      codigo={codigo}
    />
  )
}

function CertificadoValido({
  cert,
}: {
  cert: {
    code: string
    workerName: string
    courseTitle: string
    issuedAt: string
    sede: string
    isDemo: boolean
  }
}) {
  const fecha = new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(cert.issuedAt))

  return (
    <div className="card entra" style={{ overflow: 'hidden', padding: 0 }}>
      {/* Cabecera de estado — icono + texto, no solo color (accesibilidad daltónica) */}
      <div
        className="col"
        style={{
          background: cert.isDemo ? 'var(--arena-100)' : 'var(--ok)',
          color: cert.isDemo ? 'var(--tinta)' : '#fff',
          padding: '26px 24px 18px',
          alignItems: 'center',
          gap: 8,
          textAlign: 'center',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: cert.isDemo ? 'var(--blanco)' : 'rgba(255,255,255,0.22)',
          }}
        >
          <Icono n={cert.isDemo ? 'alerta' : 'check'} s={28} />
        </span>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.9 }}>
          {cert.isDemo ? 'Certificado de demostración' : 'Certificado válido'}
        </p>
        <h1 className="t-display" style={{ fontSize: 21, color: 'inherit' }}>
          {cert.isDemo
            ? 'Este folio pertenece al entorno de prueba'
            : 'Emitido por ONG Alumco'}
        </h1>
      </div>

      {!cert.isDemo && <Onda color="var(--ok)" alto={22} voltear />}

      <div className="col card-pad" style={{ gap: 18 }}>
        <Dato etiqueta="Titular" valor={cert.workerName} destacado />
        <Dato etiqueta="Curso aprobado" valor={cert.courseTitle} />

        <div className="grid grid-cols-2 gap-4">
          <Dato etiqueta="Fecha de emisión" valor={fecha} />
          <Dato etiqueta="Sede" valor={cert.sede} />
        </div>

        <div
          className="col"
          style={{
            gap: 4,
            padding: '12px 14px',
            borderRadius: 12,
            background: 'var(--crema, #FAF7F0)',
            border: '1px solid var(--borde-suave)',
          }}
        >
          <span className="texto-s silencio-3" style={{ fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10.5 }}>
            Folio de verificación
          </span>
          <code style={{ fontSize: 16, letterSpacing: '0.16em', fontWeight: 600, color: 'var(--tinta)' }}>
            {cert.code}
          </code>
        </div>

        {cert.isDemo && (
          <p className="texto-s silencio" style={{ lineHeight: 1.5 }}>
            Los certificados del entorno de demostración existen para mostrar cómo
            funciona la plataforma. <strong>No acreditan capacitación de ninguna persona real.</strong>
          </p>
        )}
      </div>
    </div>
  )
}

function Dato({ etiqueta, valor, destacado = false }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div className="col" style={{ gap: 3 }}>
      <span
        className="silencio-3"
        style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
      >
        {etiqueta}
      </span>
      <span
        style={{
          fontSize: destacado ? 22 : 15.5,
          fontWeight: destacado ? 640 : 600,
          fontFamily: destacado ? 'var(--fuente-display)' : undefined,
          color: 'var(--tinta)',
          lineHeight: 1.25,
          overflowWrap: 'anywhere',
        }}
      >
        {valor}
      </span>
    </div>
  )
}

function Aviso({
  icono,
  tono,
  titulo,
  texto,
  codigo,
}: {
  icono: 'alerta' | 'reloj'
  tono: 'peligro' | 'aviso'
  titulo: string
  texto: string
  codigo?: string
}) {
  const color = tono === 'peligro' ? 'var(--peligro)' : 'var(--aviso)'
  const fondo = tono === 'peligro' ? 'var(--peligro-bg)' : 'var(--ambar-50)'

  return (
    <div className="card card-pad col entra" style={{ gap: 12, alignItems: 'center', textAlign: 'center', padding: 32 }}>
      <span
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: fondo,
          color,
        }}
      >
        <Icono n={icono} s={28} />
      </span>
      <h1 className="t-display" style={{ fontSize: 22 }}>{titulo}</h1>
      <p className="silencio" style={{ maxWidth: 400, lineHeight: 1.5 }}>{texto}</p>
      {codigo && (
        <code className="texto-s silencio-3" style={{ letterSpacing: '0.12em', marginTop: 4, overflowWrap: 'anywhere' }}>
          {codigo}
        </code>
      )}
    </div>
  )
}

function formatoEspera(segundos: number): string {
  if (segundos < 60) return `${segundos} segundos`
  const min = Math.ceil(segundos / 60)
  return `${min} minuto${min !== 1 ? 's' : ''}`
}
