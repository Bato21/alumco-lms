// Barra fija que avisa que la sesión es demo. El contenido demo está aislado
// del real y se reinicia periódicamente (cron reset_demo_world, cada 6 h).
export function DemoBanner() {
  return (
    <div
      role="status"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '7px 14px',
        textAlign: 'center',
        fontSize: 13.5,
        fontWeight: 700,
        letterSpacing: '0.01em',
        color: '#3a2a00',
        background: 'repeating-linear-gradient(45deg, #ffd54a, #ffd54a 14px, #ffcf33 14px, #ffcf33 28px)',
        borderBottom: '2px solid #b8860b',
      }}
    >
      <span aria-hidden="true">🧪</span>
      <span>
        MODO DEMO — todo lo que crees es privado de esta cuenta y se reinicia cada pocas horas.
      </span>
    </div>
  )
}
