import { ShieldCheck, RefreshCw, HeartHandshake, Users, Award, type LucideIcon } from 'lucide-react'

const VALORES: { icon: LucideIcon; titulo: string; texto: string }[] = [
  { icon: ShieldCheck, titulo: 'Transparencia', texto: 'Somos transparentes y actuamos con coherencia.' },
  { icon: RefreshCw, titulo: 'Constancia', texto: 'Somos constantes, aprendemos y nos adaptamos a los cambios.' },
  { icon: HeartHandshake, titulo: 'Empatía', texto: 'Tenemos una actitud positiva y empática.' },
  { icon: Users, titulo: 'Comunidad', texto: 'Somos un equipo que se coordina con la comunidad para realizar mejoras sociales.' },
  { icon: Award, titulo: 'Excelencia', texto: 'Desarrollamos una gestión de calidad para alcanzar la excelencia.' },
]

export default function ValoresSection() {
  return (
    <section id="valores" style={{ padding: '110px 24px', background: 'var(--azul-950)', color: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <span className="t-eyebrow claro">◆ Lo que nos guía</span>
          <h2 className="t-display" style={{ fontSize: 'clamp(30px, 4.6vw, 48px)', marginTop: 14, color: '#fff' }}>
            Nuestros valores
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.66)', fontSize: 17, lineHeight: 1.65, marginTop: 18 }}>
            Los principios que sostienen cada decisión y cada cuidado en el ELEAM.
          </p>
        </div>

        <div
          style={{
            marginTop: 56,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}
        >
          {VALORES.map(({ icon: Icon, titulo, texto }) => (
            <div
              key={titulo}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 18,
                padding: 28,
              }}
            >
              <span
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'var(--ambar)',
                  color: 'var(--azul-950)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <Icon size={24} strokeWidth={1.9} />
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{titulo}</h3>
              <p style={{ color: 'rgba(255,255,255,0.66)', fontSize: 15, lineHeight: 1.55 }}>{texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
