'use client'

import { SURFACE, TINTA, TINTA_3 } from './chartTheme'

/**
 * Tooltip compartido de los gráficos. El texto va siempre en tokens de tinta;
 * la identidad la carga el punto de color al lado, nunca el color de la letra.
 */
export function ChartTooltip({
  active,
  label,
  valor,
  sufijo = '',
  detalle,
  color,
}: {
  active?: boolean
  label?: string
  valor?: number
  sufijo?: string
  detalle?: string
  color: string
}) {
  if (!active || valor === undefined) return null

  return (
    <div
      style={{
        background: SURFACE,
        border: '1px solid var(--borde)',
        borderRadius: 10,
        boxShadow: 'var(--sombra-2, 0 4px 16px rgba(0,0,0,0.10))',
        padding: '9px 12px',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: 11.5, color: TINTA_3, marginBottom: 3 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span
          aria-hidden="true"
          style={{ width: 9, height: 9, borderRadius: '50%', background: color, flex: 'none' }}
        />
        <strong style={{ fontSize: 14.5, color: TINTA }}>
          {valor.toLocaleString('es-CL')}{sufijo}
        </strong>
      </div>
      {detalle && (
        <div style={{ fontSize: 11.5, color: TINTA_3, marginTop: 3 }}>{detalle}</div>
      )}
    </div>
  )
}

/** Tabla plegable bajo cada gráfico — la vía no visual a los mismos datos. */
export function TablaDatos({
  columnas,
  filas,
}: {
  columnas: [string, string]
  filas: [string, string][]
}) {
  return (
    <details style={{ marginTop: 10 }}>
      <summary
        style={{
          fontSize: 12.5,
          color: TINTA_3,
          cursor: 'pointer',
          fontWeight: 600,
          listStyle: 'revert',
        }}
      >
        Ver los datos en tabla
      </summary>
      <div className="tabla-envoltura" style={{ marginTop: 8, maxHeight: 220, overflowY: 'auto' }}>
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">{columnas[0]}</th>
              <th scope="col" style={{ textAlign: 'right' }}>{columnas[1]}</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td style={{ textAlign: 'right' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
