import { HeartPulse, Activity, Users, Brain, Sparkles } from 'lucide-react'
import { CursorGlow } from './CursorGlow'

const AREAS = [
  { icon: HeartPulse, label: 'Biomédica' },
  { icon: Activity, label: 'Funcional' },
  { icon: Users, label: 'Social' },
  { icon: Brain, label: 'Mental' },
  { icon: Sparkles, label: 'Espiritual' },
]

export default function MisionVision() {
  return (
    <>
      {/* Misión — sección azul Alumco; recibe el fade del hero sin corte */}
      <section
        id="mision-vision"
        style={{
          padding: '132px 24px',
          background: 'linear-gradient(180deg, #0f1f4d 0%, #0e1d46 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Círculos ámbar que siguen el cursor, al fondo */}
        <CursorGlow />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#E2B673',
            }}
          >
            Nuestra misión
          </span>

          <p
            style={{
              marginTop: 30,
              fontFamily: 'var(--font-serif-display), Georgia, "Times New Roman", serif',
              fontSize: 'clamp(22px, 2.9vw, 31px)',
              lineHeight: 1.56,
              letterSpacing: '-0.01em',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.70)',
            }}
          >
            Brindar a las personas residentes de ELEAM una{' '}
            <span style={{ color: '#ffffff', fontWeight: 500 }}>
              atención integral, de calidad y centrada en la persona
            </span>{' '}
            desde un enfoque de derechos, considerando sus necesidades biomédicas, funcionales,
            sociales, mentales y espirituales, con una gestión eficiente de los recursos.
          </p>

          {/* Separador fino que divide la misión de las categorías */}
          <div
            aria-hidden="true"
            style={{ width: 72, height: 1, background: 'rgba(255,255,255,0.16)', margin: '54px auto 0' }}
          />

          {/* Categorías de atención */}
          <div className="mision-cats">
            {AREAS.map(({ icon: Icon, label }) => (
              <div key={label} className="mision-cat">
                <Icon size={26} strokeWidth={1.4} color="#E2B673" aria-hidden="true" />
                <span className="mision-cat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          /* Grid parejo (5 columnas) en vez de flex-wrap: evita que la última
             fila quede descuadrada al envolver. */
          .mision-cats {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 16px;
            margin-top: 46px;
          }
          .mision-cat {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 13px;
            padding: 24px 16px;
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 14px;
            background: rgba(255,255,255,0.025);
          }
          @media (max-width: 720px) {
            .mision-cats { grid-template-columns: repeat(3, 1fr); }
          }
          @media (max-width: 460px) {
            .mision-cats { grid-template-columns: repeat(2, 1fr); }
          }
          .mision-cat-label {
            font-size: 13.5px;
            font-weight: 500;
            letter-spacing: 0.015em;
            color: rgba(255,255,255,0.82);
          }
        `}</style>
      </section>

      {/* Visión — banda suave centrada */}
      <section style={{ padding: '96px 24px', background: 'var(--arena-100)', borderBlock: '1px solid var(--borde-suave)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <span className="t-eyebrow">◆ Hacia dónde vamos</span>
          <h2 className="t-display" style={{ fontSize: 'clamp(30px, 4.6vw, 48px)', marginTop: 14 }}>
            Nuestra visión
          </h2>
          <p style={{ color: 'var(--tinta-2)', fontSize: 'clamp(17px, 2vw, 20px)', lineHeight: 1.7, marginTop: 22 }}>
            Ser un ELEAM de referencia a nivel nacional, especializado en brindar una atención
            transdisciplinaria dirigida a mejorar la calidad de vida de las personas mayores durante
            toda su estadía.
          </p>
        </div>
      </section>
    </>
  )
}
