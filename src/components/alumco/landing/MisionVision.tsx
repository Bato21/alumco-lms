import { HeartPulse, Activity, Users, Brain, Sparkles } from 'lucide-react'

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
        style={{ padding: '110px 24px', background: 'var(--oliva-900)', color: '#fff' }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <span className="t-eyebrow claro">◆ Nuestra misión</span>
          <p
            style={{
              marginTop: 26,
              fontSize: 'clamp(22px, 3vw, 32px)',
              lineHeight: 1.45,
              color: 'rgba(255,255,255,0.66)',
              fontWeight: 400,
            }}
          >
            Brindar a las personas residentes de ELEAM una{' '}
            <span style={{ color: '#fff', fontWeight: 500 }}>
              atención integral, de calidad y centrada en la persona
            </span>{' '}
            desde un enfoque de derechos, considerando sus necesidades biomédicas, funcionales,
            sociales, mentales y espirituales, con una gestión eficiente de los recursos.
          </p>

          {/* Fila de áreas con íconos */}
          <div
            style={{
              marginTop: 56,
              paddingTop: 40,
              borderTop: '1px solid rgba(255,255,255,0.14)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: 24,
            }}
          >
            {AREAS.map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    background: 'var(--ambar)',
                    color: 'var(--oliva-950)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} strokeWidth={1.8} />
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.82)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
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
