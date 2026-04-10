'use client'

interface CertificateBadgeProps {
  certificate: {
    id: string
    issued_at: string
    pdf_url: string | null
  }
  courseName: string
  workerName: string
}

export function CertificateBadge({
  certificate,
  courseName,
  workerName,
}: CertificateBadgeProps) {
  const issuedDate = new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(certificate.issued_at))

  return (
    <div className="bg-white rounded-2xl border-2 border-[#F5A623] p-6 space-y-4">

      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-[#F5A623]/10 flex items-center justify-center shrink-0">
          <svg
            className="h-6 w-6 text-[#F5A623]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="6"/>
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#F5A623] uppercase tracking-wider">
            Certificado obtenido
          </p>
          <h3 className="font-bold text-[#1A1A2E] text-lg leading-tight">
            {courseName}
          </h3>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#F5A623]/20"/>

      {/* Detalles */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Trabajador</span>
          <span className="font-medium text-[#1A1A2E]">{workerName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fecha de emisión</span>
          <span className="font-medium text-[#1A1A2E]">{issuedDate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">ID del certificado</span>
          <span className="font-mono text-xs text-muted-foreground">
            {certificate.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <a
          href={`/cursos/certificado/${certificate.id}`}
          className="flex-1 h-10 rounded-lg bg-[#F5A623] text-white text-sm font-semibold hover:bg-[#F5A623]/90 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Ver certificado
        </a>

        {certificate.pdf_url && (
          <a
            href={certificate.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-10 rounded-lg border border-[#F5A623] text-[#F5A623] text-sm font-semibold hover:bg-[#F5A623]/5 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar PDF
          </a>
        )}
      </div>
    </div>
  )
}