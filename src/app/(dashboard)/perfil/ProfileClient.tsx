'use client'

import { useState, useTransition } from 'react'
import { updateProfileAction } from '@/lib/actions/trabajadores'
import {
  Mail, MapPin, Calendar, CreditCard,
  BookOpen, Clock, CheckCircle, Award,
} from 'lucide-react'

interface ProfileClientProps {
  userId: string
  fullName: string
  rut: string | null
  email: string
  sede: string
  areas: string[]
  role: string
  status: string
  fechaNacimiento: string | null
  avatarUrl: string | null
  createdAt: string
  approvedAt: string | null
  completedCount: number
  inProgressCount: number
  notStartedCount: number
  certsCount: number
}

const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  profesor: 'Profesor',
  trabajador: 'Trabajador',
}

const sedeLabel: Record<string, string> = {
  sede_1: 'Sede Hualpén',
  sede_2: 'Sede Coyhaique',
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function ProfileClient({
  userId,
  fullName,
  rut,
  email,
  sede,
  areas,
  role,
  status,
  fechaNacimiento,
  avatarUrl,
  createdAt,
  completedCount,
  inProgressCount,
  notStartedCount,
  certsCount,
}: ProfileClientProps) {
  const initial = fechaNacimiento ?? ''
  const [fechaNac, setFechaNac] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const hasChanges = fechaNac !== initial

  function handleSave() {
    startTransition(async () => {
      setSuccessMsg(null)
      setErrorMsg(null)
      const fd = new FormData()
      fd.append('fecha_nacimiento', fechaNac)
      const result = await updateProfileAction(userId, fd)
      if (result.success) {
        setSuccessMsg('Perfil actualizado correctamente')
        setTimeout(() => setSuccessMsg(null), 3000)
      } else {
        setErrorMsg(result.error ?? 'Error al guardar')
      }
    })
  }

  const initial2 = fullName.charAt(0).toUpperCase()

  return (
    <div className="space-y-6">

      {/* ── Card perfil ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Avatar + nombre + badges */}
          <div className="flex flex-col items-center lg:items-start gap-3 lg:w-56 shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-[#2B4FA0]/10 text-[#2B4FA0] text-3xl font-bold flex items-center justify-center">
                {initial2}
              </div>
            )}
            <p className="font-bold text-xl text-[#1A1A2E] text-center lg:text-left">
              {fullName}
            </p>
            <span className="bg-[#E6F1FB] text-[#2B4FA0] rounded-full px-3 py-1 text-xs font-semibold">
              {roleLabel[role] ?? role}
            </span>
            {status === 'activo' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#27AE60]">
                <span className="h-2 w-2 rounded-full bg-[#27AE60]" />
                Activo
              </span>
            )}
          </div>

          {/* Datos de solo lectura */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                Correo electrónico
              </p>
              <p className="text-sm font-medium text-[#1A1A2E] break-all">{email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                RUT
              </p>
              <p className="text-sm font-medium text-[#1A1A2E]">
                {rut ?? <span className="text-[#6B7280] italic">No registrado</span>}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                Sede
              </p>
              <p className="text-sm font-medium text-[#1A1A2E]">
                {sedeLabel[sede] ?? sede}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                Fecha de ingreso
              </p>
              <p className="text-sm font-medium text-[#1A1A2E]">
                {createdAt ? formatDate(createdAt) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Áreas de trabajo ────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 space-y-3">
        <div>
          <h2 className="text-base font-bold text-[#1A1A2E]">Áreas de trabajo asignadas</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">Asignado por tu administrador</p>
        </div>

        {areas.length === 0 ? (
          <p className="text-sm text-[#6B7280] italic">Sin área asignada</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {areas.map(area => (
              <span
                key={area}
                className="bg-[#E6F1FB] text-[#2B4FA0] rounded-full px-3 py-1 text-sm font-semibold"
              >
                {area}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-[#6B7280]">
          Para modificar tus áreas de trabajo, contacta a tu administrador.
        </p>
      </div>

      {/* ── Formulario editable ─────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 space-y-4">
        <h2 className="text-base font-bold text-[#1A1A2E]">Información personal editable</h2>

        <div className="space-y-1.5">
          <label htmlFor="fecha_nacimiento" className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            Fecha de nacimiento
          </label>
          <input
            id="fecha_nacimiento"
            type="date"
            value={fechaNac}
            onChange={e => setFechaNac(e.target.value)}
            className="w-full sm:w-64 h-11 px-3 rounded-lg border border-slate-200 text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/30 focus:border-[#2B4FA0]"
          />
        </div>

        {successMsg && (
          <p className="text-sm font-semibold text-[#27AE60]">{successMsg}</p>
        )}
        {errorMsg && (
          <p className="text-sm font-semibold text-[#E74C3C]">{errorMsg}</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          className="h-11 px-6 rounded-lg bg-[#2B4FA0] text-white font-semibold text-sm hover:bg-[#1A2F6B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      {/* ── Stats rápidas ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-[#2B4FA0] text-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4">
            <CheckCircle className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Completados</p>
          <p className="text-3xl font-extrabold">{completedCount}</p>
        </div>

        <div className="bg-white border border-slate-200 text-[#1A1A2E] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5">
          <div className="w-10 h-10 rounded-full bg-[#E6F1FB] flex items-center justify-center mb-4">
            <Clock className="w-5 h-5 text-[#2B4FA0]" aria-hidden="true" />
          </div>
          <p className="text-[#1A1A2E]/70 text-xs font-semibold uppercase tracking-wider mb-1">En progreso</p>
          <p className="text-3xl font-extrabold">{inProgressCount}</p>
        </div>

        <div className="bg-[#F0F4FF] text-[#2B4FA0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5">
          <div className="w-10 h-10 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center mb-4">
            <BookOpen className="w-5 h-5 text-[#2B4FA0]" aria-hidden="true" />
          </div>
          <p className="text-[#2B4FA0]/70 text-xs font-semibold uppercase tracking-wider mb-1">Sin iniciar</p>
          <p className="text-3xl font-extrabold">{notStartedCount}</p>
        </div>

        <div className="bg-[#FFF8EC] text-[#92600A] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5">
          <div className="w-10 h-10 rounded-full bg-[#F5A623]/20 flex items-center justify-center mb-4">
            <Award className="w-5 h-5 text-[#F5A623]" aria-hidden="true" />
          </div>
          <p className="text-[#92600A]/70 text-xs font-semibold uppercase tracking-wider mb-1">Certificados</p>
          <p className="text-3xl font-extrabold">{certsCount}</p>
        </div>
      </div>

    </div>
  )
}
