import { ShieldCheck, RefreshCw, HeartHandshake, Users, Award, type LucideIcon } from 'lucide-react'
import { ValoresFondo } from './ValoresFondo'

interface Valor {
  icon: LucideIcon
  titulo: string
  texto: string
  area: string
}

// Tarjetas alrededor (2 izquierda, 2 derecha). Empatía va al centro, destacada.
const LATERALES: Valor[] = [
  { icon: ShieldCheck, titulo: 'Transparencia', texto: 'Somos transparentes y actuamos con coherencia.', area: 'a' },
  { icon: RefreshCw, titulo: 'Constancia', texto: 'Somos constantes, aprendemos y nos adaptamos a los cambios.', area: 'b' },
  { icon: Users, titulo: 'Comunidad', texto: 'Somos un equipo que se coordina con la comunidad para realizar mejoras sociales.', area: 'd' },
  { icon: Award, titulo: 'Excelencia', texto: 'Desarrollamos una gestión de calidad para alcanzar la excelencia.', area: 'e' },
]

export default function ValoresSection() {
  return (
    <section
      id="valores"
      className="valores-sec"
      style={{
        padding: '110px 24px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #0f1f4d 0%, #11244f 52%, #0e1e48 100%)',
      }}
    >
      {/* Círculos ámbar que siguen el cursor, al fondo de la sección */}
      <ValoresFondo />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <span className="t-eyebrow claro">◆ Lo que nos guía</span>
          <h2 className="t-display" style={{ fontSize: 'clamp(30px, 4.6vw, 48px)', marginTop: 14, color: '#fff' }}>
            Nuestros valores
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.66)', fontSize: 17, lineHeight: 1.65, marginTop: 18 }}>
            Los principios que sostienen cada decisión y cada cuidado en el ELEAM.
          </p>
        </div>

        <div className="valores-grid" style={{ marginTop: 56 }}>
          {/* Tarjeta central destacada — Empatía */}
          <article className="valor-card featured" style={{ gridArea: 'c' }}>
            <span className="valor-badge" aria-hidden="true">
              <HeartHandshake size={30} strokeWidth={1.8} />
            </span>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Empatía</h3>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 16.5, lineHeight: 1.6, maxWidth: 320 }}>
              Tenemos una actitud positiva y empática.
            </p>
          </article>

          {/* Tarjetas alrededor */}
          {LATERALES.map(({ icon: Icon, titulo, texto, area }) => (
            <article key={titulo} className="valor-card" style={{ gridArea: area }}>
              <span className="valor-badge" aria-hidden="true">
                <Icon size={23} strokeWidth={1.9} />
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{titulo}</h3>
              <p style={{ color: 'rgba(255,255,255,0.66)', fontSize: 14.5, lineHeight: 1.55 }}>{texto}</p>
            </article>
          ))}
        </div>

        {/* Frase de cierre */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 46,
            color: 'rgba(255,255,255,0.62)',
            fontSize: 15.5,
            fontStyle: 'italic',
          }}
        >
          <span style={{ color: '#F5A623', fontStyle: 'normal' }}>◆</span>{' '}
          Cuidar también es actuar con propósito.
        </p>
      </div>

      <style>{`
        .valores-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: 1fr 1.12fr 1fr;
          grid-template-areas:
            "a c d"
            "b c e";
          align-items: stretch;
        }
        .valor-card {
          position: relative;
          border-radius: 20px;
          padding: 26px;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);
          box-shadow: 0 12px 34px rgba(0,0,0,0.22);
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        }
        .valor-card:hover {
          transform: translateY(-4px);
          border-color: rgba(245,166,35,0.42);
          box-shadow: 0 20px 46px rgba(0,0,0,0.3);
        }
        .valor-card.featured {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 38px 32px;
          border-color: rgba(245,166,35,0.5);
          background: linear-gradient(180deg, rgba(245,166,35,0.10) 0%, rgba(255,255,255,0.05) 100%);
          box-shadow:
            0 0 0 1px rgba(245,166,35,0.22),
            0 24px 64px rgba(245,166,35,0.16),
            0 16px 44px rgba(0,0,0,0.32);
        }
        .valor-card.featured:hover {
          transform: translateY(-4px);
          border-color: rgba(245,166,35,0.7);
        }
        .valor-badge {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #F5A623;
          background: rgba(245,166,35,0.13);
          border: 1px solid rgba(245,166,35,0.4);
          box-shadow: 0 6px 16px rgba(245,166,35,0.12);
          margin-bottom: 16px;
        }
        .valor-card.featured .valor-badge {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #F5A623 0%, #e0961a 100%);
          color: #0f1f4d;
          border: none;
          box-shadow: 0 12px 28px rgba(245,166,35,0.42);
        }
        @media (max-width: 860px) {
          .valores-grid {
            grid-template-columns: 1fr 1fr;
            grid-template-areas:
              "c c"
              "a b"
              "d e";
          }
          .valor-card.featured { text-align: center; align-items: center; }
        }
        @media (max-width: 540px) {
          .valores-grid {
            grid-template-columns: 1fr;
            grid-template-areas:
              "c"
              "a"
              "b"
              "d"
              "e";
          }
        }
      `}</style>
    </section>
  )
}
