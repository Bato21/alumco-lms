'use client'

import { useState } from 'react'
import { generateCertificatePDF } from '@/lib/actions/certificates'

interface DownloadCertificateButtonProps {
  certificateId: string
  workerName: string
  courseTitle: string
}

export function DownloadCertificateButton({
  certificateId,
  workerName,
  courseTitle,
}: DownloadCertificateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setIsGenerating(true)
    setError(null)
    try {
      const result = await generateCertificatePDF(certificateId)
      if (!result.success || !result.pdfBase64) {
        setError(result.error ?? 'Error al generar el PDF')
        return
      }
      const byteChars = atob(result.pdfBase64)
      const byteNums = Array.from(byteChars).map(c => c.charCodeAt(0))
      const blob = new Blob([new Uint8Array(byteNums)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificado-${workerName.replace(/\s+/g, '-')}-${courseTitle.replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Error inesperado al generar el PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#F5A623] text-white text-sm font-semibold hover:bg-[#e0961a] transition-colors min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Generando PDF...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar PDF
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-[#E74C3C] font-medium">{error}</p>
      )}
    </div>
  )
}
