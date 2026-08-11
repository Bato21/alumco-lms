import type { Metadata } from 'next'

// `page.tsx` de esta ruta es un Client Component ('use client') y por eso no
// puede exportar `metadata`. Era la única página de la app sin título propio:
// el navegador mostraba «Alumco LMS» a secas, igual que la portada (2.4.2).
export const metadata: Metadata = {
  title: 'Nuevo curso',
}

export default function NuevoCursoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
