'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { createEventAction, uploadEventDocumentAction } from '@/lib/actions/events'
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_EMOJI,
  type CreateEventPayload,
  type EventDocType,
  type EventSectionMemberRole,
  type EventType,
} from '@/lib/types/database'
import { Icono } from '@/components/alumco/ds'

interface SedeOption {
  id: string
  nombre: string
}

interface ProfileOption {
  id: string
  full_name: string
  sede: string
  area_trabajo: string[]
}

interface SectionMemberDraft {
  user_id: string
  member_role: EventSectionMemberRole
}

interface SectionDraft {
  key: string
  name: string
  description: string
  members: SectionMemberDraft[]
}

interface DocDraft {
  key: string
  file: File
  title: string
}

type WizardStep = 1 | 2 | 3 | 4

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Datos',
  2: 'Secciones',
  3: 'Equipos',
  4: 'Documentos',
}

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fila"
      style={{ gap: 10, padding: '12px 14px', borderRadius: 'var(--radio-m)', background: 'var(--peligro-bg)', color: 'var(--peligro)', border: '2px solid var(--peligro)', boxShadow: '3px 3px 0 var(--peligro)', fontSize: 14.5, fontWeight: 600 }}
    >
      <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

export function WizardEvento({ sedes, profiles }: { sedes: SedeOption[]; profiles: ProfileOption[] }) {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>(1)
  const [pending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [stepError, setStepError] = useState<string | null>(null)

  // Paso 1 — datos del evento
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState<EventType | ''>('')
  const [sedeId, setSedeId] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [description, setDescription] = useState('')

  // Paso 2 — secciones
  const [sections, setSections] = useState<SectionDraft[]>([])
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionDesc, setNewSectionDesc] = useState('')

  // Paso 4 — documentos
  const [alimentacionFile, setAlimentacionFile] = useState<File | null>(null)
  const [generalDocs, setGeneralDocs] = useState<DocDraft[]>([])

  // Paso 3 usa esta lista: perfiles activos de la sede elegida en el paso 1.
  const profilesDeLaSede = useMemo(
    () => profiles.filter(p => p.sede === sedeId),
    [profiles, sedeId],
  )

  function goToStep(next: WizardStep) {
    setStepError(null)
    setStep(next)
  }

  function validateStep1(): string | null {
    if (title.trim().length < 3) return 'El título debe tener al menos 3 caracteres'
    if (!eventType) return 'Selecciona una celebración'
    if (!sedeId) return 'Selecciona una sede'
    if (!eventDate) return 'Selecciona la fecha del evento'
    if (description.trim().length < 10) return 'Describe el evento (mínimo 10 caracteres)'
    return null
  }

  function validateStep2(): string | null {
    if (sections.length === 0) return 'Agrega al menos una sección para continuar'
    const nombres = sections.map(s => s.name.trim().toLowerCase())
    if (new Set(nombres).size !== nombres.length) return 'Hay secciones con nombres repetidos'
    return null
  }

  function handleNext() {
    if (step === 1) {
      const err = validateStep1()
      if (err) { setStepError(err); return }
      goToStep(2)
    } else if (step === 2) {
      const err = validateStep2()
      if (err) { setStepError(err); return }
      goToStep(3)
    } else if (step === 3) {
      goToStep(4)
    }
  }

  function handleBack() {
    if (step > 1) goToStep((step - 1) as WizardStep)
  }

  function addSection() {
    const name = newSectionName.trim()
    if (name.length < 2) { setStepError('El nombre de la sección debe tener al menos 2 caracteres'); return }
    if (sections.some(s => s.name.trim().toLowerCase() === name.toLowerCase())) {
      setStepError('Ya agregaste una sección con ese nombre')
      return
    }
    setStepError(null)
    setSections(prev => [...prev, { key: uid(), name, description: newSectionDesc.trim(), members: [] }])
    setNewSectionName('')
    setNewSectionDesc('')
  }

  function removeSection(key: string) {
    setSections(prev => prev.filter(s => s.key !== key))
  }

  function addMember(sectionKey: string, userId: string) {
    setSections(prev => prev.map(s => {
      if (s.key !== sectionKey) return s
      if (s.members.some(m => m.user_id === userId)) return s
      return { ...s, members: [...s.members, { user_id: userId, member_role: 'colaborador' as EventSectionMemberRole }] }
    }))
  }

  function removeMember(sectionKey: string, userId: string) {
    setSections(prev => prev.map(s => s.key === sectionKey
      ? { ...s, members: s.members.filter(m => m.user_id !== userId) }
      : s))
  }

  function setMemberRole(sectionKey: string, userId: string, role: EventSectionMemberRole) {
    setSections(prev => prev.map(s => s.key === sectionKey
      ? { ...s, members: s.members.map(m => m.user_id === userId ? { ...m, member_role: role } : m) }
      : s))
  }

  function addGeneralDoc(file: File) {
    setGeneralDocs(prev => [...prev, { key: uid(), file, title: file.name }])
  }

  function removeGeneralDoc(key: string) {
    setGeneralDocs(prev => prev.filter(d => d.key !== key))
  }

  function handleSubmit() {
    setSubmitError(null)

    const payload: CreateEventPayload = {
      title: title.trim(),
      event_type: eventType as EventType,
      sede_id: sedeId,
      event_date: eventDate,
      description: description.trim(),
      sections: sections.map(s => ({
        name: s.name,
        description: s.description || undefined,
        members: s.members,
        tasks: [],
      })),
    }

    startTransition(async () => {
      const res = await createEventAction(payload)
      if (res.error || !res.eventId) {
        setSubmitError(res.error ?? 'No se pudo crear el evento')
        return
      }

      const eventId = res.eventId
      const docsToUpload: { file: File; doc_type: EventDocType; title: string }[] = []
      if (alimentacionFile) {
        docsToUpload.push({ file: alimentacionFile, doc_type: 'dificultades_alimenticias', title: alimentacionFile.name })
      }
      for (const d of generalDocs) {
        docsToUpload.push({ file: d.file, doc_type: 'general', title: d.title })
      }

      // El evento ya existe en este punto: si una subida falla seguimos con
      // las demás y redirigimos igual — el detalle muestra la advertencia si
      // falta el documento de alimentación.
      for (const doc of docsToUpload) {
        const fd = new FormData()
        fd.append('file', doc.file)
        fd.append('doc_type', doc.doc_type)
        fd.append('title', doc.title)
        await uploadEventDocumentAction(eventId, fd)
      }

      router.push(`/admin/eventos/${eventId}`)
    })
  }

  return (
    <div className="col entra" style={{ gap: 20 }}>
      <ol className="fila" style={{ gap: 10, flexWrap: 'wrap' }} aria-label="Progreso del formulario">
        {([1, 2, 3, 4] as WizardStep[]).map(n => {
          const activo = n === step
          const completado = n < step
          return (
            <li key={n} className="fila" style={{ gap: 8, alignItems: 'center' }}>
              <span
                aria-current={activo ? 'step' : undefined}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  background: activo ? 'var(--azul-800)' : completado ? 'var(--ok-bg)' : 'var(--arena-200)',
                  color: activo ? '#fff' : completado ? 'var(--ok)' : 'var(--tinta-3)',
                }}
              >
                {n}
              </span>
              <span className="texto-s" style={{ fontWeight: activo ? 700 : 500, color: activo ? 'var(--tinta)' : 'var(--tinta-3)' }}>
                {STEP_LABELS[n]}
              </span>
            </li>
          )
        })}
      </ol>

      {submitError && <ErrorBanner message={submitError} />}
      {stepError && <ErrorBanner message={stepError} />}

      <div className="card card-pad col" style={{ gap: 18 }}>
        {step === 1 && (
          <div className="col" style={{ gap: 16 }}>
            <div className="campo">
              <label htmlFor="title">Título</label>
              <input
                id="title"
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Fiestas Patrias 2026"
                disabled={pending}
              />
            </div>

            <div className="campo">
              <label htmlFor="event_type">Celebración</label>
              <select
                id="event_type"
                className="select"
                value={eventType}
                onChange={e => setEventType(e.target.value as EventType)}
                disabled={pending}
              >
                <option value="" disabled>Selecciona una celebración…</option>
                {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{EVENT_TYPE_EMOJI[value]} {label}</option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="sede_id">Sede</label>
              <select
                id="sede_id"
                className="select"
                value={sedeId}
                onChange={e => setSedeId(e.target.value)}
                disabled={pending}
              >
                <option value="" disabled>Selecciona una sede…</option>
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="event_date">Fecha del evento</label>
              <input
                id="event_date"
                type="date"
                className="input"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                disabled={pending}
              />
            </div>

            <div className="campo">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                className="textarea"
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Qué se celebra, dónde, consideraciones generales…"
                disabled={pending}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="col" style={{ gap: 16 }}>
            <p className="texto-s silencio">
              Organiza el evento en secciones (por ejemplo: Cocina, Decoración, Sonido). Puedes agregar o quitar las que necesites.
            </p>

            {sections.length === 0 ? (
              <p className="silencio texto-s">Aún no agregas secciones.</p>
            ) : (
              <ul className="col" style={{ gap: 8 }}>
                {sections.map(s => (
                  <li
                    key={s.key}
                    className="fila"
                    style={{ gap: 10, alignItems: 'flex-start', border: '1px solid var(--arena-200)', borderRadius: 'var(--radio-m)', padding: 12 }}
                  >
                    <div className="crece">
                      <p style={{ fontWeight: 600 }}>{s.name}</p>
                      {s.description && <p className="texto-s silencio-3">{s.description}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSection(s.key)}
                      className="btn btn-ghost btn-sm btn-icon"
                      aria-label={`Quitar sección ${s.name}`}
                    >
                      <Icono n="basura" s={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="fila" style={{ gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--arena-200)', paddingTop: 16 }}>
              <input
                value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                placeholder="Nombre de la sección…"
                className="input crece"
                style={{ minWidth: 180 }}
                aria-label="Nombre de la sección"
              />
              <input
                value={newSectionDesc}
                onChange={e => setNewSectionDesc(e.target.value)}
                placeholder="Descripción (opcional)…"
                className="input crece"
                style={{ minWidth: 180 }}
                aria-label="Descripción de la sección"
              />
              <button type="button" onClick={addSection} className="btn btn-primary">
                <Icono n="mas" s={16} /> Agregar sección
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="col" style={{ gap: 20 }}>
            <p className="texto-s silencio">
              Asigna a los trabajadores de la sede elegida a cada sección. Puedes dejar secciones sin miembros por ahora.
            </p>
            {sections.length === 0 ? (
              <p className="silencio texto-s">No hay secciones creadas.</p>
            ) : (
              sections.map(s => (
                <SeccionMiembros
                  key={s.key}
                  section={s}
                  profiles={profilesDeLaSede}
                  onAdd={userId => addMember(s.key, userId)}
                  onRemove={userId => removeMember(s.key, userId)}
                  onRoleChange={(userId, role) => setMemberRole(s.key, userId, role)}
                />
              ))
            )}
          </div>
        )}

        {step === 4 && (
          <div className="col" style={{ gap: 18 }}>
            <div
              className="col"
              style={{ gap: 10, border: '2px solid var(--aviso)', background: 'var(--aviso-bg)', borderRadius: 'var(--radio-m)', padding: 14 }}
            >
              <div className="fila" style={{ gap: 10, alignItems: 'flex-start' }}>
                <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: 'var(--aviso)' }} aria-hidden="true" />
                <div className="crece">
                  <p style={{ fontWeight: 700, color: 'var(--aviso)' }}>Lista de dificultades alimenticias</p>
                  <p className="texto-s" style={{ color: 'var(--aviso)' }}>
                    Se recomienda subirla ahora, pero no es obligatoria: el evento se puede crear sin ella. Si falta, se mostrará una advertencia en el detalle del evento.
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept=".pdf,.xlsx,.docx"
                disabled={pending}
                onChange={e => setAlimentacionFile(e.target.files?.[0] ?? null)}
                aria-label="Archivo de dificultades alimenticias"
              />
              {alimentacionFile && (
                <p className="texto-s" style={{ color: 'var(--aviso)' }}>Seleccionado: {alimentacionFile.name}</p>
              )}
            </div>

            <div className="col" style={{ gap: 10 }}>
              <p style={{ fontWeight: 600 }}>Documentos generales (opcional)</p>
              {generalDocs.length > 0 && (
                <ul className="col" style={{ gap: 6 }}>
                  {generalDocs.map(d => (
                    <li key={d.key} className="fila" style={{ gap: 8 }}>
                      <Icono n="doc" s={16} />
                      <span className="crece texto-s">{d.title}</span>
                      <button
                        type="button"
                        onClick={() => removeGeneralDoc(d.key)}
                        className="btn btn-ghost btn-sm btn-icon"
                        aria-label={`Quitar ${d.title}`}
                      >
                        <Icono n="cerrar" s={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <input
                type="file"
                accept=".pdf,.xlsx,.docx"
                disabled={pending}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) addGeneralDoc(file)
                  e.target.value = ''
                }}
                aria-label="Agregar documento general"
              />
            </div>
          </div>
        )}
      </div>

      <div className="fila" style={{ justifyContent: 'space-between' }}>
        <button type="button" onClick={handleBack} disabled={step === 1 || pending} className="btn btn-ghost">
          Atrás
        </button>
        {step < 4 ? (
          <button type="button" onClick={handleNext} disabled={pending} className="btn btn-primary">
            Siguiente
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={pending} className="btn btn-primary" aria-busy={pending}>
            {pending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Creando…
              </>
            ) : (
              'Crear evento'
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function SeccionMiembros({ section, profiles, onAdd, onRemove, onRoleChange }: {
  section: SectionDraft
  profiles: ProfileOption[]
  onAdd: (userId: string) => void
  onRemove: (userId: string) => void
  onRoleChange: (userId: string, role: EventSectionMemberRole) => void
}) {
  const [search, setSearch] = useState('')
  const memberIds = new Set(section.members.map(m => m.user_id))
  const disponibles = profiles.filter(p =>
    !memberIds.has(p.id) && p.full_name.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <div className="col" style={{ gap: 10, border: '1px solid var(--arena-200)', borderRadius: 'var(--radio-m)', padding: 14 }}>
      <p style={{ fontWeight: 600 }}>{section.name}</p>

      {section.members.length > 0 && (
        <ul className="col" style={{ gap: 6 }}>
          {section.members.map(m => {
            const perfil = profiles.find(p => p.id === m.user_id)
            return (
              <li key={m.user_id} className="fila" style={{ gap: 8, alignItems: 'center' }}>
                <span className="crece texto-s">{perfil?.full_name ?? m.user_id}</span>
                <select
                  className="select"
                  value={m.member_role}
                  onChange={e => onRoleChange(m.user_id, e.target.value as EventSectionMemberRole)}
                  aria-label={`Rol de ${perfil?.full_name ?? ''}`}
                >
                  <option value="encargado">Encargado</option>
                  <option value="colaborador">Colaborador</option>
                </select>
                <button
                  type="button"
                  onClick={() => onRemove(m.user_id)}
                  className="btn btn-ghost btn-sm btn-icon"
                  aria-label={`Quitar a ${perfil?.full_name ?? ''}`}
                >
                  <Icono n="cerrar" s={14} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="input-busqueda">
        <Icono n="lupa" s={18} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar trabajador por nombre…"
          aria-label={`Buscar trabajador para ${section.name}`}
        />
      </div>

      {disponibles.length === 0 ? (
        <p className="texto-s silencio-3">
          {profiles.length === 0 ? 'No hay trabajadores activos en la sede elegida.' : 'No hay más trabajadores disponibles.'}
        </p>
      ) : (
        <ul className="col" style={{ gap: 4, maxHeight: 180, overflowY: 'auto' }}>
          {disponibles.map(p => (
            <li key={p.id} className="fila" style={{ justifyContent: 'space-between' }}>
              <span className="texto-s">{p.full_name}</span>
              <button type="button" onClick={() => onAdd(p.id)} className="btn btn-ghost btn-sm">
                <Icono n="mas" s={14} /> Agregar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
