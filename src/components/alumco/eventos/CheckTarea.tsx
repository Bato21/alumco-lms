'use client'

// Checkbox custom: el reset global fuerza min 48×48 en input[type=checkbox]
// (target táctil WCAG). Aquí el label da esa área clickeable y el input real
// queda invisible encima; el cuadrito visible mide 20px.

export function CheckTarea({ checked, disabled, onToggle, label }: {
  checked: boolean
  disabled?: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <label
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        flex: 'none',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        aria-label={label}
        style={{ position: 'absolute', inset: 0, margin: 0, opacity: 0, cursor: 'inherit' }}
      />
      <span
        aria-hidden="true"
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: `2px solid ${checked ? 'var(--ambar)' : 'var(--borde)'}`,
          background: checked ? 'var(--ambar)' : 'var(--blanco)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.12s ease, border-color 0.12s ease',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {checked && (
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
    </label>
  )
}
