import type { Metadata } from 'next'
import { EncabezadoPagina } from '@/components/alumco/ds'
import { CrearEventoForm } from '@/components/alumco/eventos/CrearEventoForm'

export const metadata: Metadata = { title: 'Nuevo evento | Alumco LMS' }

export default function NuevoEventoPage() {
  return (
    <div className="mx-auto max-w-2xl" data-screen-label="Admin · Nuevo evento">
      <EncabezadoPagina
        titulo="Nuevo evento"
        sub="Crea el evento en borrador; después asignas jefes, tareas y el documento de alimentación"
      />
      <CrearEventoForm />
    </div>
  )
}
