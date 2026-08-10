'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  saveUserPreferencesAction,
  type PreferencesValues,
} from '@/lib/actions/preferences'
import { FONT_SCALE_LABELS, type FontScale } from '@/lib/types/database'
import { Icono } from '@/components/alumco/ds'

const ESCALAS = Object.keys(FONT_SCALE_LABELS) as FontScale[]

const MOVIMIENTO: { valor: 'sistema' | 'reducido' | 'completo'; label: string; ayuda: string }[] = [
  { valor: 'sistema', label: 'Según mi dispositivo', ayuda: 'Usa la configuración del sistema operativo' },
  { valor: 'reducido', label: 'Reducir movimiento', ayuda: 'Quita animaciones y transiciones' },
  { valor: 'completo', label: 'Mostrar animaciones', ayuda: 'Aunque el sistema pida reducirlas' },
]

/**
 * Preferencias de accesibilidad. Se guardan en la base, no solo en el
 * navegador: el equipo rota entre computadores compartidos y la
 * configuración tiene que viajar con la persona.
 */
export function AccessibilityPanel({ initial }: { initial: PreferencesValues }) {
  const router = useRouter()
  const [prefs, setPrefs] = useState<PreferencesValues>(initial)
  const [pendiente, startTransition] = useTransition()

  const movimiento: 'sistema' | 'reducido' | 'completo' =
    prefs.reduced_motion === null ? 'sistema' : prefs.reduced_motion ? 'reducido' : 'completo'

  const sucio =
    prefs.font_scale !== initial.font_scale ||
    prefs.high_contrast !== initial.high_contrast ||
    prefs.reduced_motion !== initial.reduced_motion

  function guardar() {
    startTransition(async () => {
      const res = await saveUserPreferencesAction(prefs)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Preferencias guardadas.')
      router.refresh()
    })
  }

  return (
    <div className="card card-pad col" style={{ gap: 18 }}>
      <div className="fila" style={{ gap: 12 }}>
        <span
          aria-hidden="true"
          style={{
            width: 44, height: 44, borderRadius: '50%', flex: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--azul-50)', color: 'var(--azul-800)',
          }}
        >
          <Icono n="ojo" s={22} />
        </span>
        <div className="crece">
          <h2 style={{ fontSize: 16.5 }}>Accesibilidad</h2>
          <p className="texto-s silencio-3">
            Se guardan en tu cuenta y te acompañan en cualquier computador.
          </p>
        </div>
      </div>

      {/* Tamaño de letra */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Tamaño del contenido</legend>
        <div className="fila" style={{ gap: 8, flexWrap: 'wrap' }}>
          {ESCALAS.map((escala, i) => (
            <label
              key={escala}
              className={prefs.font_scale === escala ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
              style={{ cursor: 'pointer', fontSize: 13 + i * 2 }}
            >
              <input
                type="radio"
                name="font-scale"
                value={escala}
                checked={prefs.font_scale === escala}
                disabled={pendiente}
                onChange={() => setPrefs((p) => ({ ...p, font_scale: escala }))}
                className="sr-only"
              />
              {FONT_SCALE_LABELS[escala]}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Alto contraste */}
      <label className="fila" style={{ gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
        <input
          type="checkbox"
          checked={prefs.high_contrast}
          disabled={pendiente}
          onChange={(e) => setPrefs((p) => ({ ...p, high_contrast: e.target.checked }))}
          style={{ marginTop: 3 }}
        />
        <span className="crece">
          <span style={{ fontSize: 14, fontWeight: 600, display: 'block' }}>Alto contraste</span>
          <span className="texto-s silencio-3">
            Oscurece los textos secundarios y marca más los bordes y el foco.
          </span>
        </span>
      </label>

      {/* Movimiento */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Animaciones</legend>
        <div className="col" style={{ gap: 8 }}>
          {MOVIMIENTO.map((op) => (
            <label key={op.valor} className="fila" style={{ gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
              <input
                type="radio"
                name="reduced-motion"
                checked={movimiento === op.valor}
                disabled={pendiente}
                onChange={() =>
                  setPrefs((p) => ({
                    ...p,
                    reduced_motion: op.valor === 'sistema' ? null : op.valor === 'reducido',
                  }))
                }
                style={{ marginTop: 3 }}
              />
              <span className="crece">
                <span style={{ fontSize: 14, fontWeight: 600, display: 'block' }}>{op.label}</span>
                <span className="texto-s silencio-3">{op.ayuda}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="fila" style={{ gap: 10 }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={guardar}
          disabled={pendiente || !sucio}
        >
          {pendiente ? 'Guardando…' : 'Guardar preferencias'}
        </button>
        {sucio && !pendiente && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPrefs(initial)}>
            Descartar
          </button>
        )}
      </div>
    </div>
  )
}
