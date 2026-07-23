'use client'

import { useState, type ReactNode } from 'react'

interface TabDef {
  key: string
  label: string
  count: number
  content: ReactNode
}

// Tabs client-side: las tres tablas llegan ya renderizadas desde el server
// (los datos se fetchean todos de una), así que cambiar de pestaña no
// necesita navegación ni re-fetch — solo alternar qué se muestra.
export function TabsTrabajadores({ tabs, initialTab }: { tabs: TabDef[]; initialTab: string }) {
  const [active, setActive] = useState(
    tabs.some(t => t.key === initialTab) ? initialTab : tabs[0]?.key
  )

  function onSelect(key: string) {
    setActive(key)
    // Mantiene la URL compartible sin disparar navegación de Next
    window.history.replaceState(null, '', key === tabs[0]?.key ? location.pathname : `?tab=${key}`)
  }

  return (
    <>
      <div className="chips entra entra-1" style={{ marginBottom: 22 }} role="tablist">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => onSelect(t.key)}
            className={'chip' + (active === t.key ? ' activo' : '')}
          >
            {t.label}
            {t.count > 0 && <span className="conteo">{t.count}</span>}
          </button>
        ))}
      </div>

      {tabs.map(t => (
        <div key={t.key} role="tabpanel" hidden={active !== t.key}>
          {t.content}
        </div>
      ))}
    </>
  )
}
