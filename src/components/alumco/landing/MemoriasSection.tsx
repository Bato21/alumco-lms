import { FileText, Download } from 'lucide-react'

const DOCS = [
  'Convenio',
  'Estado financiero',
  'Balance',
  'Memorial',
  'Nómina de directorio',
  'Plan vigente (PICV)',
  'Presupuesto adjudicado',
  'Recursos recibidos',
]

export default function MemoriasSection() {
  return (
    <section id="memorias" style={{ padding: '96px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
        <span className="t-eyebrow">◆ Transparencia</span>
        <h2 className="t-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginTop: 12 }}>
          Memorias
        </h2>
        <p style={{ color: 'var(--tinta-2)', fontSize: 17, lineHeight: 1.7, marginTop: 18 }}>
          La transparencia financiera es fundamental para nosotros. A lo largo del año, hemos gestionado
          nuestros recursos con responsabilidad y eficiencia, asegurando que cada donación se utilice para
          el beneficio directo de nuestros residentes. Nuestro compromiso con la integridad financiera se
          refleja en cada partida de gastos.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        {DOCS.map((doc) => (
          <a
            key={doc}
            href="#"
            className="card card-hover"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 18px',
              color: 'var(--tinta)',
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--azul-50)',
                color: 'var(--azul-800)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileText size={18} />
            </span>
            <span style={{ fontWeight: 500, fontSize: 15, flex: 1 }}>{doc}</span>
            <Download size={16} style={{ color: 'var(--tinta-3)' }} />
          </a>
        ))}
      </div>
    </section>
  )
}
