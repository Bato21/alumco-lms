'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex-1 h-11 rounded-lg border border-[#2B4FA0] text-[#2B4FA0] text-sm font-semibold hover:bg-[#2B4FA0]/5 transition-colors flex items-center justify-center gap-2"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="6 9 6 2 18 2 18 9"/>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Imprimir
    </button>
  )
}