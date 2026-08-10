// Iconos del sistema DIDASKO — port literal de lib/ui.jsx (objeto I + Icono)
import type { ReactNode } from 'react'

export type IconoNombre =
  | 'inicio' | 'cursos' | 'usuarios' | 'sede' | 'reportes' | 'certificado'
  | 'perfil' | 'campana' | 'lupa' | 'mas' | 'chevD' | 'chevR' | 'flechaIzq'
  | 'check' | 'reloj' | 'alerta' | 'salir' | 'editar' | 'ojo' | 'arrastrar'
  | 'basura' | 'play' | 'descargar' | 'cerrar' | 'calendario' | 'doc'
  | 'video' | 'quiz' | 'ajustes' | 'copiar' | 'candado' | 'estrella'

const I: Record<string, ReactNode> = {
  inicio: <path d="M3 10.5 12 3l9 7.5M5.5 9v10.5h13V9" />,
  cursos: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15ZM4 18h16M8 7.5h8M8 11h5" />,
  usuarios: <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 10.5A3.25 3.25 0 1 0 10 4a3.25 3.25 0 0 0 0 6.5ZM20 19v-1.2a3.3 3.3 0 0 0-2.4-3.2M14.6 4.3a3.25 3.25 0 0 1 0 5.9" />,
  sede: <path d="M12 21s-6.5-5.4-6.5-10.3a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21Zm0-8.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" />,
  reportes: <path d="M4 20h16M7 16v-5m5 5V8m5 8v-9" />,
  certificado: <path d="M12 13.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 0v7l-2.6-1.7L7 20.5l.8-5.2M12 20.5l2.6-1.7 2.4 1.7-.8-5.2" />,
  perfil: <path d="M12 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-7 8.5a7 7 0 0 1 14 0" />,
  campana: <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5ZM10 18.5a2.1 2.1 0 0 0 4 0" />,
  lupa: <path d="M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm9 3-4.8-4.8" />,
  mas: <path d="M12 5v14M5 12h14" />,
  chevD: <path d="m8 10 4 4 4-4" />,
  chevR: <path d="m10 8 4 4-4 4" />,
  flechaIzq: <path d="M19 12H5m6-6-6 6 6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  reloj: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13.5V12l3.5 2" />,
  alerta: <path d="M12 8.5v4.5m0 3.5h.01M10.3 4.1 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.1a2 2 0 0 0-3.4 0Z" />,
  salir: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 13 4-4-4-4m4 4H9" />,
  editar: <path d="M4 20h4.5L19 9.5a2.4 2.4 0 0 0-3.4-3.4L5 16.5V20ZM13.5 7.5l3 3" />,
  ojo: <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  arrastrar: <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />,
  basura: <path d="M4 7h16m-2 0-1 13H7L6 7m3 0V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7m-5 4v6m4-6v6" />,
  play: <path d="M7 5.5v13l11-6.5-11-6.5Z" />,
  descargar: <path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M4 19h16" />,
  cerrar: <path d="m6 6 12 12M18 6 6 18" />,
  calendario: <path d="M5 6.5h14A1.5 1.5 0 0 1 20.5 8v11A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V8A1.5 1.5 0 0 1 5 6.5Zm-1.5 5h17M8 3.5v4m8-4v4" />,
  doc: <path d="M13.5 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V8L13.5 3Zm0 0v5h5M9 12.5h6M9 16h6" />,
  video: <path d="M4.5 6.5h10A1.5 1.5 0 0 1 16 8v8a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 16V8a1.5 1.5 0 0 1 1.5-1.5ZM16 10.5l5-3v9l-5-3" />,
  quiz: <path d="M9 8.8a3 3 0 0 1 5.8 1c0 2-3 2.4-3 4.2M11.8 17.5h.01M12 21.5a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19Z" />,
  ajustes: <path d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm7.5-2.5a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.5-2.3 1a7.6 7.6 0 0 0-2.1-1.2L14.6 3h-5.2l-.4 2.6a7.6 7.6 0 0 0-2.1 1.2l-2.3-1-2 3.5 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.5 2.3-1c.6.5 1.4.9 2.1 1.2l.4 2.6h5.2l.4-2.6a7.6 7.6 0 0 0 2.1-1.2l2.3 1 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z" />,
  copiar: <path d="M9 9.5h10A1.5 1.5 0 0 1 20.5 11v8A1.5 1.5 0 0 1 19 20.5H9A1.5 1.5 0 0 1 7.5 19v-8A1.5 1.5 0 0 1 9 9.5Zm-4.5 7h-1A1.5 1.5 0 0 1 2 15V5a1.5 1.5 0 0 1 1.5-1.5h10A1.5 1.5 0 0 1 15 5v1.5" />,
  candado: <path d="M6 10.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19v-7A1.5 1.5 0 0 1 6 10.5Zm2-0.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5" />,
  estrella: <path d="m12 3.8 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.8Z" />,
}

export function Icono({ n, s = 20, sw = 1.7 }: { n: IconoNombre | string; s?: number; sw?: number }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {I[n] || I.doc}
    </svg>
  )
}
