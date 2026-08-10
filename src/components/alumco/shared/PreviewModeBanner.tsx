import { exitPreviewModeAction } from '@/lib/actions/preview'
import { Icono } from '@/components/alumco/ds'

/**
 * Banda persistente durante el modo vista previa.
 *
 * Tiene que estar siempre visible: un admin que olvide que está en preview y
 * reporte "no me aparece el panel" es exactamente el bug que este banner evita.
 * Dice además qué NO simula, para que nadie saque conclusiones equivocadas de
 * lo que ve.
 */
export function PreviewModeBanner({ role }: { role: 'admin' | 'profesor' }) {
  return (
    <div
      role="status"
      style={{
        background: 'var(--azul-900)',
        color: '#fff',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        fontSize: 13.5,
      }}
    >
      <span aria-hidden="true" style={{ display: 'inline-flex', color: 'var(--ambar)' }}>
        <Icono n="ojo" s={18} />
      </span>
      <span style={{ flex: '1 1 260px', lineHeight: 1.4 }}>
        <strong>Vista previa como colaborador.</strong>{' '}
        <span style={{ color: 'rgba(255,255,255,0.75)' }}>
          Sigues con tu sesión de {role}. Los cursos que ves son los de tu propio
          perfil, no los de otra persona.
        </span>
      </span>
      <form action={exitPreviewModeAction}>
        <button
          type="submit"
          className="btn btn-sm"
          style={{ background: 'var(--ambar)', color: 'var(--azul-950)', fontWeight: 700, border: 'none' }}
        >
          Salir de la vista previa
        </button>
      </form>
    </div>
  )
}
