import type { Metadata } from 'next'
import Link from 'next/link'
import { createCourseAction } from '@/lib/actions/courses'

export const metadata: Metadata = { title: 'Nuevo curso | Alumco LMS' }

export default function NuevoCursoPage() {
  async function handleCreate(formData: FormData) {
    'use server'
    const result = await createCourseAction(formData)
    if (result.success && result.id) {
      redirect(`/admin/cursos/${result.id}/editar`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-8 space-y-6 lg:space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-[#1A1A2E]">
          Crear nuevo curso
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Completa los datos básicos. Luego podrás agregar módulos y evaluaciones.
        </p>
      </div>

      {/* Formulario */}
      <form action={handleCreate} className="space-y-4 lg:space-y-6">
        <div className="bg-white rounded-xl border p-4 lg:p-6 space-y-4 lg:space-y-5">

          {/* Título */}
          <div className="space-y-1.5">
            <label
              htmlFor="title"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Título del curso *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Ej: Cuidado integral del adulto mayor"
              className="w-full h-12 px-4 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Describe brevemente el contenido y objetivos del curso"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors resize-none"
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-border"/>

          {/* Fecha límite */}
          <div className="space-y-1.5">
            <label
              htmlFor="deadline"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Fecha límite de cumplimiento
            </label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              className="w-full h-12 px-4 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
            />
            <p className="text-xs text-muted-foreground">
              Opcional. Si se define, los trabajadores recibirán alertas al acercarse al vencimiento.
            </p>
          </div>

          {/* Descripción del plazo */}
          <div className="space-y-1.5">
            <label
              htmlFor="deadline_description"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Descripción del plazo
            </label>
            <input
              id="deadline_description"
              name="deadline_description"
              type="text"
              placeholder="Ej: Obligatorio antes de auditoría SENAMA"
              className="w-full h-12 px-4 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/admin/cursos"
            className="flex-1 h-12 rounded-lg border text-base font-medium text-muted-foreground hover:bg-[#F5F5F5] transition-colors flex items-center justify-center min-h-[48px]"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex-1 h-12 rounded-lg bg-[#2B4FA0] text-white text-base font-bold hover:bg-[#2B4FA0]/90 transition-colors min-h-[48px]"
          >
            Crear y agregar módulos →
          </button>
        </div>
      </form>
    </div>
  )
}
