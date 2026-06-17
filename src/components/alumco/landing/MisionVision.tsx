export default function MisionVision() {
  return (
    <section id="mision-vision" style={{ padding: '96px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 56,
        }}
      >
        <div>
          <span className="t-eyebrow">◆ Quiénes somos</span>
          <h2 className="t-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginTop: 12 }}>
            Misión
          </h2>
          <div style={{ width: 56, height: 3, background: 'var(--ambar)', borderRadius: 2, margin: '18px 0 22px' }} />
          <p style={{ color: 'var(--tinta-2)', fontSize: 17, lineHeight: 1.7 }}>
            Brindar a los y las residentes de ELEAM una atención integral, de calidad y centrada en la
            persona desde un enfoque de derechos, considerando sus necesidades en las áreas: biomédica,
            funcional, social, mental y espiritual con el apoyo de sus personas significativas, realizando
            una gestión eficiente de los recursos disponibles.
          </p>
        </div>
        <div>
          <span className="t-eyebrow">◆ Hacia dónde vamos</span>
          <h2 className="t-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginTop: 12 }}>
            Visión
          </h2>
          <div style={{ width: 56, height: 3, background: 'var(--azul-700)', borderRadius: 2, margin: '18px 0 22px' }} />
          <p style={{ color: 'var(--tinta-2)', fontSize: 17, lineHeight: 1.7 }}>
            Ser un ELEAM de referencia a nivel nacional especializado en brindar una atención
            transdisciplinaria dirigida a mejorar la calidad de vida de las personas mayores durante toda
            su estadía.
          </p>
        </div>
      </div>
    </section>
  )
}
