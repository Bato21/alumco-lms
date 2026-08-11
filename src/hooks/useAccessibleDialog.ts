'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Comportamiento de teclado obligatorio para un diálogo modal.
 *
 * Cubre los tres criterios que la auditoría (A11Y-12) encontró abiertos en los
 * siete diálogos de la plataforma:
 *
 * - **2.1.2 Sin trampas de teclado** — el foco se mantiene dentro del diálogo
 *   mientras está abierto. Sin esto, tabular se lleva el foco al documento de
 *   detrás, que sigue visible pero es inalcanzable de vuelta sin ratón.
 * - **2.4.3 Orden del foco** — al abrir, el foco entra al diálogo; al cerrar,
 *   vuelve al control que lo abrió. Sin la devolución, el foco cae al `<body>`
 *   y la persona reinicia el recorrido de la página desde arriba.
 * - **2.1.1 Teclado** — `Escape` cierra. El clic en el telón es una comodidad
 *   de ratón, no la vía de escape accesible.
 *
 * Uso:
 *
 * ```tsx
 * const dialogRef = useAccessibleDialog<HTMLDivElement>(open, () => setOpen(false))
 * // …
 * {open && <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" …>}
 * ```
 *
 * El elemento que recibe la `ref` debe llevar `tabIndex={-1}`: es el destino de
 * respaldo cuando el diálogo no contiene ningún control focusable.
 */
export function useAccessibleDialog<T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  onClose: () => void
) {
  const containerRef = useRef<T | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  // `onClose` suele llegar como arrow function en línea, así que cambia de
  // identidad en cada render. Guardarla en una ref evita que el efecto se
  // desmonte y se vuelva a montar constantemente, que reinstalaría el foco.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const getFocusables = useCallback((): HTMLElement[] => {
    const root = containerRef.current
    if (!root) return []

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
      el =>
        !el.hasAttribute('inert') &&
        el.getAttribute('aria-hidden') !== 'true' &&
        // `offsetParent` es null en elementos ocultos con `display:none`. No
        // detecta `visibility:hidden`, pero cubre el caso habitual de secciones
        // plegadas dentro del propio diálogo.
        (el.offsetParent !== null || el === document.activeElement)
    )
  }, [])

  useEffect(() => {
    if (!isOpen) return

    // Quién abrió el diálogo. Se captura antes de mover el foco.
    triggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    // El foco entra al primer control real; si no hay ninguno, al contenedor.
    const focusables = getFocusables()
    const first = focusables[0] ?? containerRef.current
    // rAF: en el primer paint el contenido del diálogo puede no estar montado
    // todavía (paneles que renderizan tras un estado de carga).
    const raf = requestAnimationFrame(() => first?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const current = getFocusables()
      if (current.length === 0) {
        // Nada que tabular: se retiene el foco en el contenedor.
        event.preventDefault()
        containerRef.current?.focus()
        return
      }

      const firstEl = current[0]
      const lastEl = current[current.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === firstEl || active === containerRef.current)) {
        event.preventDefault()
        lastEl.focus()
      } else if (!event.shiftKey && active === lastEl) {
        event.preventDefault()
        firstEl.focus()
      } else if (active instanceof Node && !containerRef.current?.contains(active)) {
        // El foco se escapó (p. ej. lo movió el navegador): se recupera.
        event.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown, true)

      // Devolución del foco. `isConnected` descarta el caso en que el disparador
      // ya no existe (una fila de tabla que se eliminó al confirmar el diálogo);
      // en ese caso se deja el foco donde el navegador lo ponga antes que
      // enviarlo a un nodo huérfano.
      const trigger = triggerRef.current
      if (trigger?.isConnected) trigger.focus()
      triggerRef.current = null
    }
  }, [isOpen, getFocusables])

  return containerRef
}
