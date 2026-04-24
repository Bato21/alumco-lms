import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Logo */}
        <img
          src="https://ongalumco.cl/wp-content/uploads/2023/11/logo-alumco-completoccc-300x102.png"
          alt="Alumco"
          className="h-10 object-contain mx-auto opacity-80"
        />

        {/* Número 404 */}
        <div className="relative">
          <p className="text-[160px] font-black text-[#2B4FA0]/8 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-2xl bg-[#E6F1FB] flex items-center justify-center">
              <svg className="h-10 w-10 text-[#2B4FA0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Mensaje */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#1A1A2E]">
            Página no encontrada
          </h1>
          <p className="text-[#6B7280]">
            La página que buscas no existe o fue movida.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/inicio"
            className="px-6 py-3 bg-[#2B4FA0] text-white rounded-xl font-semibold text-sm hover:bg-[#2B4FA0]/90 transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Ir al inicio
          </Link>
          <Link
            href="/cursos"
            className="px-6 py-3 bg-white border border-slate-200 text-[#1A1A2E] rounded-xl font-semibold text-sm hover:border-[#2B4FA0] transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            Ver mis cursos
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400">
          KimuKo · ONG Alumco
        </p>
      </div>
    </div>
  )
}
