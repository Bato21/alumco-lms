'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { setAnnualTargetAction } from '@/lib/actions/analytics'
import { Icono } from '@/components/alumco/ds'

/**
 * Edición inline del objetivo de cobertura anual. Se abre solo al pedirlo:
 * el dashboard se lee a diario y se configura una vez al año.
 */
export function AnnualTargetForm({ target }: { target: number }) {
  const [abierto, setAbierto] = useState(false)
  const [valor, setValor] = useState(String(target))
  const [pendiente, startTransition] = useTransition()

  function guardar() {
    const n = Number(valor)
    if (!Number.isFinite(n) || n < 1 || n > 100) {
      toast.error('El objetivo debe ser un número entre 1 y 100.')
      return
    }
    startTransition(async () => {
      const res = await setAnnualTargetAction(n)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(`Objetivo anual actualizado a ${n}%.`)
      setAbierto(false)
    })
  }

  if (!abierto) {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setAbierto(true)}
      >
        <Icono n="ajustes" s={15} /> Objetivo
      </button>
    )
  }

  return (
    <div className="fila" style={{ gap: 6 }}>
      <label htmlFor="objetivo-anual" className="sr-only">
        Objetivo de cobertura anual, en porcentaje
      </label>
      <input
        id="objetivo-anual"
        type="number"
        min={1}
        max={100}
        value={valor}
        autoFocus
        disabled={pendiente}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') guardar()
          if (e.key === 'Escape') setAbierto(false)
        }}
        style={{ width: 76 }}
      />
      <button type="button" className="btn btn-primary btn-sm" onClick={guardar} disabled={pendiente}>
        {pendiente ? 'Guardando…' : 'Guardar'}
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => { setValor(String(target)); setAbierto(false) }}
        disabled={pendiente}
      >
        Cancelar
      </button>
    </div>
  )
}
