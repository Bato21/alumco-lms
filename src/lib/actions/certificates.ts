'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'

void degrees // imported for potential use

// ── Tipos de respuesta ─────────────────────────────────────

export interface CertificateResult {
  error?: string
  success?: boolean
  certificateId?: string
}

// ── Generar certificado al aprobar quiz ────────────────────

export async function generateCertificateAction(
  quizAttemptId: string,
  courseId: string
): Promise<CertificateResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const adminClient = await createAdminClient()

  // Verificar que el intento existe y fue aprobado
  const { data: attempt } = await adminClient
    .from('quiz_attempts')
    .select('id, status, user_id')
    .eq('id', quizAttemptId)
    .single()

  if (!attempt) return { error: 'Intento no encontrado' }
  if (attempt.status !== 'aprobado') return { error: 'El intento no fue aprobado' }
  if (attempt.user_id !== user.id) return { error: 'No autorizado' }

  // Verificar que no exista ya un certificado para este usuario y curso
  const { data: existing } = await adminClient
    .from('certificates')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (existing) {
    return { success: true, certificateId: existing.id }
  }

  // Crear el certificado
  const { data: certificate, error } = await adminClient
    .from('certificates')
    .insert({
      user_id: user.id,
      quiz_attempt_id: quizAttemptId,
      course_id: courseId,
      pdf_url: null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: 'Error al generar el certificado.' }
  }

  revalidatePath(`/cursos/${courseId}`)
  revalidatePath(`/cursos/${courseId}/certificado`)
  return { success: true, certificateId: certificate.id }
}

// ── Obtener certificado del usuario para un curso ──────────

export async function getCertificateAction(
  courseId: string
): Promise<{
  id: string
  issued_at: string
  pdf_url: string | null
} | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('certificates')
    .select('id, issued_at, pdf_url')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  return data ?? null
}

// ── Generar PDF del certificado ────────────────────────────

export async function generateCertificatePDF(
  certificateId: string
): Promise<{ success?: boolean; pdfBase64?: string; error?: string }> {
  try {
    const adminClient = await createAdminClient()

    const { data: cert } = await adminClient
      .from('certificates')
      .select('id, issued_at, user_id, course_id, courses(title, created_by)')
      .eq('id', certificateId)
      .single()

    if (!cert) return { error: 'Certificado no encontrado' }

    const course = Array.isArray(cert.courses) ? cert.courses[0] : cert.courses

    const { data: worker } = await adminClient
      .from('profiles')
      .select('full_name, rut, sede, area_trabajo')
      .eq('id', cert.user_id)
      .single()

    const { data: creator } = await adminClient
      .from('profiles')
      .select('full_name, firma_url')
      .eq('id', (course as { created_by?: string } | null)?.created_by ?? '')
      .single()

    const { data: directora } = await adminClient
      .from('profiles')
      .select('full_name, firma_url')
      .eq('role', 'admin')
      .eq('sede', worker?.sede ?? 'sede_1')
      .limit(1)
      .single()

    // ── Construir el PDF ──────────────────────────────────
    const pdfDoc = await PDFDocument.create()

    // A4 vertical: 595.28 x 841.89 puntos
    const page = pdfDoc.addPage([595.28, 841.89])
    const { width, height } = page.getSize()
    // width = 595.28, height = 841.89

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

    const colorBlue = rgb(0.169, 0.310, 0.627)
    const colorDark = rgb(0.102, 0.102, 0.180)
    const colorGray = rgb(0.420, 0.447, 0.502)
    const colorGold = rgb(0.961, 0.651, 0.137)
    const colorWhite = rgb(1, 1, 1)
    const colorNavy = rgb(0.102, 0.184, 0.420)

    // Borde superior dorado
    page.drawRectangle({ x: 0, y: height - 10, width, height: 10, color: colorGold })

    // Borde inferior azul
    page.drawRectangle({ x: 0, y: 0, width, height: 8, color: colorBlue })

    // Banda superior azul marino con logo
    page.drawRectangle({ x: 0, y: height - 120, width, height: 110, color: colorNavy })

    // Logo Alumco en banda superior
    try {
      const logoResponse = await fetch(
        'https://ongalumco.cl/wp-content/uploads/2023/11/logo-alumco-completoccc-300x102.png'
      )
      const logoBytes = await logoResponse.arrayBuffer()
      const logoImage = await pdfDoc.embedPng(new Uint8Array(logoBytes))
      const logoDims = logoImage.scaleToFit(140, 48)
      page.drawImage(logoImage, {
        x: (width - logoDims.width) / 2,
        y: height - 80,
        width: logoDims.width,
        height: logoDims.height,
      })
    } catch {
      page.drawText('ALUMCO', {
        x: width / 2 - 40, y: height - 70,
        size: 22, font: fontBold, color: colorWhite,
      })
    }

    // Subtítulo en banda superior
    page.drawText('CERTIFICADO DE APROBACIÓN', {
      x: width / 2 - 90, y: height - 100,
      size: 10, font: fontBold, color: colorGold,
    })

    // Línea decorativa dorada
    page.drawRectangle({ x: 60, y: height - 130, width: width - 120, height: 1.5, color: colorGold })

    // "Este certificado acredita que"
    page.drawText('Este certificado acredita que', {
      x: width / 2 - 90, y: height - 175,
      size: 12, font: fontItalic, color: colorGray,
    })

    // Nombre del trabajador
    const workerName = worker?.full_name ?? 'Colaborador'
    const nameFontSize = workerName.length > 30 ? 26 : 32
    const nameWidth = fontBold.widthOfTextAtSize(workerName, nameFontSize)
    page.drawText(workerName, {
      x: (width - nameWidth) / 2,
      y: height - 225,
      size: nameFontSize, font: fontBold, color: colorDark,
    })

    // Línea decorativa bajo nombre
    page.drawRectangle({
      x: (width - 160) / 2, y: height - 238,
      width: 160, height: 2, color: colorGold,
    })

    // "ha completado satisfactoriamente el curso"
    page.drawText('ha completado satisfactoriamente el curso', {
      x: width / 2 - 130, y: height - 270,
      size: 11, font: fontItalic, color: colorGray,
    })

    // Título del curso
    const courseTitle = (course as { title?: string } | null)?.title ?? 'Curso de capacitación'
    const courseFontSize = courseTitle.length > 45 ? 16 : 20
    const courseWidth = fontBold.widthOfTextAtSize(courseTitle, courseFontSize)
    page.drawText(courseTitle, {
      x: (width - courseWidth) / 2,
      y: height - 310,
      size: courseFontSize, font: fontBold, color: colorBlue,
      maxWidth: width - 120,
    })

    // Línea separadora
    page.drawRectangle({ x: 60, y: height - 345, width: width - 120, height: 0.5, color: rgb(0.9, 0.9, 0.9) })

    // Detalles: RUT, Área, Sede, Fecha — en grid 2x2
    const detailStartY = height - 380
    const col1X = 80
    const col2X = width / 2 + 20

    page.drawText('RUT', { x: col1X, y: detailStartY, size: 8, font: fontBold, color: colorGray })
    page.drawText(worker?.rut ?? 'No registrado', {
      x: col1X, y: detailStartY - 16, size: 10, font: fontRegular, color: colorDark,
    })

    const sedeLabel = worker?.sede === 'sede_1' ? 'Sede Hualpén' : 'Sede Coyhaique'
    page.drawText('SEDE', { x: col2X, y: detailStartY, size: 8, font: fontBold, color: colorGray })
    page.drawText(sedeLabel, {
      x: col2X, y: detailStartY - 16, size: 10, font: fontRegular, color: colorDark,
    })

    const areas = (worker?.area_trabajo as string[] ?? []).join(', ')
    page.drawText('ÁREA DE TRABAJO', { x: col1X, y: detailStartY - 45, size: 8, font: fontBold, color: colorGray })
    page.drawText(areas || 'Sin asignar', {
      x: col1X, y: detailStartY - 61, size: 10, font: fontRegular, color: colorDark,
      maxWidth: width / 2 - 100,
    })

    const issuedDate = new Intl.DateTimeFormat('es-CL', {
      day: '2-digit', month: 'long', year: 'numeric',
    }).format(new Date(cert.issued_at))
    page.drawText('FECHA DE EMISIÓN', { x: col2X, y: detailStartY - 45, size: 8, font: fontBold, color: colorGray })
    page.drawText(issuedDate, {
      x: col2X, y: detailStartY - 61, size: 10, font: fontRegular, color: colorDark,
    })

    page.drawText(`ID: ${cert.id.slice(0, 8).toUpperCase()}`, {
      x: width / 2 - 40, y: height - 470,
      size: 8, font: fontRegular, color: colorGray,
    })

    // Línea separadora antes de firmas
    page.drawRectangle({ x: 60, y: height - 490, width: width - 120, height: 0.5, color: rgb(0.9, 0.9, 0.9) })

    // ── Firmas ────────────────────────────────────────────
    const firmaY = 120
    const firma1X = 80
    const firma2X = width / 2 + 40

    async function drawFirma(
      x: number,
      firmaUrl: string | null | undefined,
      nombre: string,
      cargo: string
    ) {
      if (firmaUrl) {
        try {
          const res = await fetch(firmaUrl)
          const bytes = await res.arrayBuffer()
          const isJpg = firmaUrl.toLowerCase().includes('.jpg') ||
            firmaUrl.toLowerCase().includes('.jpeg')
          const img = isJpg
            ? await pdfDoc.embedJpg(new Uint8Array(bytes))
            : await pdfDoc.embedPng(new Uint8Array(bytes))
          const dims = img.scaleToFit(140, 60)
          page.drawImage(img, {
            x: x + (160 - dims.width) / 2,
            y: firmaY + 22,
            width: dims.width,
            height: dims.height,
          })
        } catch {
          page.drawRectangle({ x, y: firmaY + 22, width: 160, height: 1, color: colorGray })
        }
      } else {
        page.drawRectangle({ x, y: firmaY + 22, width: 160, height: 1, color: colorGray })
      }

      page.drawRectangle({ x, y: firmaY, width: 160, height: 1, color: colorDark })
      page.drawText(nombre, {
        x, y: firmaY - 14, size: 9, font: fontBold, color: colorDark, maxWidth: 160,
      })
      page.drawText(cargo, {
        x, y: firmaY - 27, size: 8, font: fontRegular, color: colorGray, maxWidth: 160,
      })
    }

    await drawFirma(
      firma1X,
      (creator as { firma_url?: string | null } | null)?.firma_url,
      (creator as { full_name?: string } | null)?.full_name ?? 'Instructor',
      'Instructor del curso'
    )

    await drawFirma(
      firma2X,
      (directora as { firma_url?: string | null } | null)?.firma_url,
      (directora as { full_name?: string } | null)?.full_name ?? 'Directora Técnica',
      'Directora Técnica ELEAM'
    )

    const pdfBytes = await pdfDoc.save()
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

    return { success: true, pdfBase64 }
  } catch (err) {
    console.error('Error generando PDF:', err)
    return { error: 'Error al generar el certificado PDF' }
  }
}

// ── Obtener todos los certificados (admin) ─────────────────

export async function getAllCertificatesAction(): Promise<{
  id: string
  issued_at: string
  pdf_url: string | null
  course_id: string
  user_id: string
}[]> {
  const adminClient = await createAdminClient()

  const { data } = await adminClient
    .from('certificates')
    .select('id, issued_at, pdf_url, course_id, user_id')
    .order('issued_at', { ascending: false })

  return data ?? []
}