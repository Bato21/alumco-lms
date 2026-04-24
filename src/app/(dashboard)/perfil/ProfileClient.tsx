'use client'

import { useState, useTransition } from 'react'
import { updateProfileAction, uploadFirmaAction, deleteFirmaAction } from '@/lib/actions/trabajadores'
import {
  Mail, MapPin, Calendar, CreditCard,
  BookOpen, Clock, CheckCircle, Award,
  Users, TrendingUp,
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
  firmaUrl: string | null
  createdAt: string
  approvedAt: string | null
  completedCount: number
  inProgressCount: number
  notStartedCount: number
  certsCount: number
  totalCreated?: number
  capacitatedWorkers?: number
  approvalRate?: number
  totalCerts?: number
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
  firmaUrl: initialFirmaUrl,
  createdAt,
  completedCount,
  inProgressCount,
  notStartedCount,
  certsCount,
  totalCreated,
  capacitatedWorkers,
  approvalRate,
  totalCerts,
}: ProfileClientProps) {
  const initial = fechaNacimiento ?? ''
  const [fechaNac, setFechaNac] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [firmaUrl, setFirmaUrl] = useState(initialFirmaUrl)
  const [firmaFile, setFirmaFile] = useState<File | null>(null)
  const [firmaPreview, setFirmaPreview] = useState<string | null>(initialFirmaUrl)
  const [isFirmaPending, startFirmaTransition] = useTransition()
  const [firmaError, setFirmaError] = useState<string | null>(null)
  const [firmaSuccess, setFirmaSuccess] = useState(false)

  const hasChanges = fechaNac !== initial

  function handleFirmaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFirmaFile(file)
    const reader = new FileReader()
    reader.onload = () => setFirmaPreview(reader.result as string)
    reader.readAsDataURL(file)
    setFirmaError(null)
  }

  function handleUploadFirma() {
    if (!firmaFile) return
    setFirmaError(null)
    setFirmaSuccess(false)
    startFirmaTransition(async () => {
      const fd = new FormData()
      fd.append('firma', firmaFile)
      const result = await uploadFirmaAction(userId, fd)
      if (result.success) {
        setFirmaSuccess(true)
        setFirmaFile(null)
        if (result.url) setFirmaUrl(result.url)
        setTimeout(() => setFirmaSuccess(false), 3000)
      } else {
        setFirmaError(result.error ?? 'Error al subir la firma')
      }
    })
  }

  function handleDeleteFirma() {
    if (!confirm('¿Eliminar tu firma digital?')) return
    setFirmaError(null)
    startFirmaTransition(async () => {
      const result = await deleteFirmaAction(userId)
      if (result.success) {
        setFirmaUrl(null)
        setFirmaPreview(null)
        setFirmaFile(null)
      } else {
        setFirmaError(result.error ?? 'Error al eliminar la firma')
      }
    })
  }

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

      {/* ── Firma digital (solo admin / profesor) ───────────── */}
      {(role === 'admin' || role === 'profesor') && (
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 space-y-4">
          <div>
            <h2 className="font-bold text-[#1A1A2E]">Firma digital</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Tu firma se incluirá automáticamente en los certificados
              de los cursos que has creado.
            </p>
          </div>

          {firmaPreview ? (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center bg-slate-50 min-h-[120px]">
                <img
                  src={firmaPreview}
                  alt="Tu firma digital"
                  className="max-h-24 max-w-full object-contain"
                />
              </div>
              <div className="flex gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border-2 border-[#2B4FA0] text-[#2B4FA0] text-sm font-semibold cursor-pointer hover:bg-[#F0F4FF] transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleFirmaChange}
                  />
                  Cambiar firma
                </label>
                <button
                  onClick={handleDeleteFirma}
                  disabled={isFirmaPending}
                  className="px-4 h-10 rounded-lg border-2 border-[#E74C3C] text-[#E74C3C] text-sm font-semibold hover:bg-[#FAECE7] transition-colors disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-[#2B4FA0] hover:bg-[#F0F4FF]/50 transition-colors min-h-[140px]">
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleFirmaChange}
              />
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#1A1A2E]">Subir firma digital</p>
                <p className="text-xs text-[#6B7280] mt-1">PNG o JPG · Fondo transparente recomendado · Máx 2MB</p>
              </div>
            </label>
          )}

          {firmaFile && (
            <div className="flex items-center justify-between gap-3 p-3 bg-[#F0F4FF] rounded-lg">
              <p className="text-sm text-[#2B4FA0] font-medium truncate">{firmaFile.name}</p>
              <button
                onClick={handleUploadFirma}
                disabled={isFirmaPending}
                className="shrink-0 px-4 h-9 bg-[#2B4FA0] text-white text-sm font-semibold rounded-lg hover:bg-[#2B4FA0]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isFirmaPending ? 'Guardando...' : 'Guardar firma'}
              </button>
            </div>
          )}

          {firmaError && (
            <p className="text-sm text-[#E74C3C] font-medium">{firmaError}</p>
          )}
          {firmaSuccess && (
            <p className="text-sm text-[#27AE60] font-medium">✓ Firma guardada correctamente</p>
          )}
        </div>
      )}

      {/* ── Stats rápidas ────────────────────────────────────── */}
      {(role === 'admin' || role === 'profesor') ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          <div className="bg-[#2B4FA0] text-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Cursos creados</p>
            <p className="text-3xl font-extrabold">{totalCreated ?? 0}</p>
          </div>

          <div className="bg-white border border-slate-200 text-[#1A1A2E] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5">
            <div className="w-10 h-10 rounded-full bg-[#E6F1FB] flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-[#2B4FA0]" aria-hidden="true" />
            </div>
            <p className="text-[#1A1A2E]/70 text-xs font-semibold uppercase tracking-wider mb-1">Trabajadores capacitados</p>
            <p className="text-3xl font-extrabold">{capacitatedWorkers ?? 0}</p>
          </div>

          <div className="bg-[#EDFAF3] text-[#1A6B3A] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5">
            <div className="w-10 h-10 rounded-full bg-[#27AE60]/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-[#27AE60]" aria-hidden="true" />
            </div>
            <p className="text-[#1A6B3A]/70 text-xs font-semibold uppercase tracking-wider mb-1">Aprobación</p>
            <p className="text-3xl font-extrabold">{approvalRate ?? 0}%</p>
          </div>

          <div className="bg-[#FFF8EC] text-[#92600A] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5">
            <div className="w-10 h-10 rounded-full bg-[#F5A623]/20 flex items-center justify-center mb-4">
              <Award className="w-5 h-5 text-[#F5A623]" aria-hidden="true" />
            </div>
            <p className="text-[#92600A]/70 text-xs font-semibold uppercase tracking-wider mb-1">Certificados emitidos</p>
            <p className="text-3xl font-extrabold">{totalCerts ?? 0}</p>
          </div>
        </div>
      ) : (
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
      )}

    </div>
  )
}
