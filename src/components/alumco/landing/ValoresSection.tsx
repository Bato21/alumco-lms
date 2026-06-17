import { ShieldCheck, RefreshCw, HeartHandshake, Users, Award, type LucideIcon } from 'lucide-react'

const VALORES: { icon: LucideIcon; texto: string }[] = [
  { icon: ShieldCheck, texto: 'Somos transparentes y actuamos con coherencia.' },
  { icon: RefreshCw, texto: 'Somos constantes, aprendemos y nos adaptamos a los cambios.' },
  { icon: HeartHandshake, texto: 'Tenemos una actitud positiva y empática.' },
  { icon: Users, texto: 'Somos un equipo que se coordina con la comunidad para realizar mejoras sociales.' },
  { icon: Award, texto: 'Desarrollamos una gestión de calidad para alcanzar la excelencia.' },
]

export default function ValoresSection() {
  return (
    <section
      id="valores"
      style={{ padding: '96px 24px', background: 'var(--arena-100)', borderBlock: '1px solid var(--borde-suave)' }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
        <span className="t-eyebrow">◆ Lo que nos guía</span>
        <h2 className="t-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginTop: 12 }}>
          Nuestros valores
        </h2>
        <div
          style={{
            marginTop: 48,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
          }}
        >
          {VALORES.map(({ icon: Icon, texto }) => (
            <div key={texto} className="card card-hover card-pad" style={{ textAlign: 'center', padding: 28 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: 'var(--ambar-50)',
                  color: 'var(--ambar-700)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <Icon size={26} strokeWidth={1.8} />
              </div>
              <p style={{ color: 'var(--tinta)', fontSize: 16, lineHeight: 1.55, fontWeight: 500 }}>{texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
