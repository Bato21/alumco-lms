// src/app/(auth)/layout.tsx
//
// A11y: este layout NO envuelve en <main>. Las dos páginas del grupo tienen
// maquetas incompatibles entre sí (login es un split a pantalla completa donde
// el <main> debe ser solo el panel derecho; registro es una columna centrada),
// así que cada una declara su propio <main id="contenido-principal" tabIndex={-1}>,
// destino del enlace de salto de src/app/layout.tsx.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}