// src/lib/types/database.ts

export type UserRole = 'admin' | 'trabajador' | 'profesor'
export type ContentType = 'video' | 'pdf' | 'slides' | 'quiz' | 'texto'
export type AttemptStatus = 'aprobado' | 'reprobado' | 'en_progreso'
export type Sede = string
export type ProfileStatus = 'pendiente' | 'activo' | 'suspendido'

export interface SedeRecord {
  id: string
  nombre: string
  activa: boolean
  created_at: string
}

// ── Filas de cada tabla ────────────────────────────────────

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  sede: Sede
  area_trabajo: AreaTrabajo[]
  fecha_nacimiento: string | null
  avatar_url: string | null
  firma_url: string | null
  is_active: boolean
  status: ProfileStatus
  rut: string | null
  requested_at: string | null
  approved_by: string | null
  approved_at: string | null
  onboarding_completed: boolean | null
  is_demo: boolean
  created_at: string
  updated_at: string
}

export type AreaTrabajo =
  | 'Enfermería'
  | 'Auxiliar de enfermería'
  | 'Kinesiología'
  | 'Terapia ocupacional'
  | 'Nutrición'
  | 'Trabajo social'
  | 'Psicología'
  | 'Administración'
  | 'Dirección técnica'
  | 'Geriatría'
  | 'Sin asignar'

export const AREAS_TRABAJO: AreaTrabajo[] = [
  'Enfermería',
  'Auxiliar de enfermería',
  'Kinesiología',
  'Terapia ocupacional',
  'Nutrición',
  'Trabajo social',
  'Psicología',
  'Administración',
  'Dirección técnica',
  'Geriatría',
]


export interface Course {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  is_published: boolean
  order_index: number
  created_by: string | null
  target_areas: string[] | null
  deadline: string | null
  deadline_description: string | null
  is_demo: boolean
  // Curso origen si este se creó duplicando otro. Solo trazabilidad — el clon
  // es independiente. Ver supabase/propuestas/course-duplication-and-text-modules.sql.
  duplicated_from: string | null
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  content_type: ContentType
  content_url: string
  // HTML ya saneado en el servidor. Solo se usa con content_type = 'texto'.
  content_html: string | null
  order_index: number
  duration_mins: number | null
  is_required: boolean
  is_final_module: boolean
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  module_id: string
  title: string
  passing_score: number
  max_attempts: number
  created_at: string
  updated_at: string
}

// JSONB tipado: cada opción de pregunta
export interface QuestionOption {
  id: 'a' | 'b' | 'c' | 'd'
  text: string
}

export interface Question {
  id: string
  quiz_id: string
  question_text: string
  options: QuestionOption[]
  correct_option: 'a' | 'b' | 'c' | 'd'
  order_index: number
  created_at: string
}

// JSONB tipado: respuestas del usuario { question_id: opcion_elegida }
export type UserAnswers = Record<string, 'a' | 'b' | 'c' | 'd'>

// Tipos para resultados de quiz
export interface QuizSubmitResult {
  success: boolean
  score: number
  passed: boolean
  attemptNumber: number
  attemptsRemaining: number
  error?: string
  courseCompleted?: boolean
  questionResults?: Record<string, boolean>
}

export interface QuizStatus {
  attemptsUsed: number
  maxAttempts: number
  attemptsRemaining: number
  hasPassedBefore: boolean
  lastScore: number | null
  isBlocked: boolean
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  status: AttemptStatus
  answers: UserAnswers
  attempt_number: number
  completed_at: string
}

export interface Certificate {
  id: string
  user_id: string
  quiz_attempt_id: string
  course_id: string
  issued_at: string
  pdf_url: string | null
  // Folio corto (Crockford base32, 12 chars) que va en el QR del PDF y en la
  // ruta pública /certificados/verificar/[codigo]. Lo genera un trigger.
  verification_code: string
}

export interface CourseProgress {
  id: string
  user_id: string
  course_id: string
  last_module_id: string | null
  completed_modules: string[]
  is_completed: boolean
  started_at: string
  completed_at: string | null
  updated_at: string | null
  last_quiz_reset_at: string | null
}

// ── Vista de reportes ──────────────────────────────────────

export interface ReporteAvance {
  user_id: string
  full_name: string
  sede: Sede
  area_trabajo: AreaTrabajo[]
  edad: number | null
  course_id: string
  course_title: string
  is_completed: boolean | null
  completed_at: string | null
  total_aprobados: number
  total_reprobados: number
}

// ── Eventos institucionales ────────────────────────────────
// Schema real migrado por Bato en la DB viva (no el v1 original de este
// repo). Secciones custom por evento con miembros encargado/colaborador,
// tareas por sección con 3 estados, eventos por sede, doc de alimentación
// como advertencia (no bloqueante). Ver docs/superpowers/plans/2026-07-04-eventos-v2-schema-bato.md.

export type EventType = 'dieciocho' | 'navidad' | 'ano_nuevo'
export type EventStatus = 'planificacion' | 'activo' | 'finalizado'
export type EventSectionMemberRole = 'encargado' | 'colaborador'
export type EventTaskStatus = 'pendiente' | 'en_progreso' | 'completada'
export type EventDocType = 'dificultades_alimenticias' | 'general'

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  dieciocho: '18 de septiembre',
  navidad: 'Navidad',
  ano_nuevo: 'Año Nuevo',
}

export const EVENT_TYPE_EMOJI: Record<EventType, string> = {
  dieciocho: '🎉',
  navidad: '🎄',
  ano_nuevo: '🎆',
}

export interface EventRecord {
  id: string
  title: string
  event_type: EventType
  description: string
  event_date: string
  status: EventStatus
  cover_image_url: string | null
  sede_id: string
  created_by: string
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface EventSection {
  id: string
  event_id: string
  name: string
  description: string | null
  order_index: number
}

// PK compuesta (section_id, user_id) — sin id propio.
export interface EventSectionMember {
  section_id: string
  user_id: string
  member_role: EventSectionMemberRole
}

export interface EventTask {
  id: string
  section_id: string
  title: string
  description: string | null
  status: EventTaskStatus
  due_date: string | null
  due_time: string | null
  order_index: number
  completed_at: string | null
  completed_by: string | null
  created_by: string
  updated_at: string
}

export interface EventDocument {
  id: string
  event_id: string
  doc_type: EventDocType
  title: string
  file_url: string
  uploaded_by: string
  created_at: string
}

// Galería de fotos — tabla PROPUESTA, aún no existe en la DB viva.
// Ver supabase/propuestas/event-photos.sql (pendiente de que Bato la corra).
export interface EventPhoto {
  id: string
  event_id: string
  image_url: string
  caption: string | null
  uploaded_by: string
  created_at: string
}

// ── Días administrativos ───────────────────────────────────
// Solicitudes de días libres del trabajador. Cupo por área configurable por el
// admin (default 5) y período de renovación configurable. Ver
// supabase/propuestas/admin-days.sql (pendiente de que se corra en la DB viva).

export type AdminDayStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada'
export type AdminDayResetPeriod = 'anual' | 'fijo'

export const ADMIN_DAY_STATUS_LABELS: Record<AdminDayStatus, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
}

// Reglas de negocio (constantes de producto, no configurables por ahora).
export const ADMIN_DAY_MAX_PER_REQUEST = 5
export const ADMIN_DAY_MIN_ADVANCE_BUSINESS_DAYS = 5

export interface AdminDayConfig {
  id: boolean
  default_quota: number
  reset_period: AdminDayResetPeriod
  updated_by: string | null
  updated_at: string
}

export interface AdminDayAreaQuota {
  area: string
  quota: number
}

export interface AdminDayRequest {
  id: string
  user_id: string
  start_date: string
  end_date: string
  days_count: number
  reason: string | null
  status: AdminDayStatus
  review_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

// ── Ajustes de plataforma ──────────────────────────────────
// Key-value para lo configurable desde la UI admin. Ver
// supabase/propuestas/platform-settings.sql.

export interface PlatformSetting {
  key: string
  value: unknown
  updated_by: string | null
  updated_at: string
}

/** Key del target de cobertura anual (% de trabajadores certificados en el año). */
export const SETTING_ANNUAL_TARGET = 'annual_certification_target'
export const DEFAULT_ANNUAL_TARGET = 85

// ── Tickets de soporte ─────────────────────────────────────
// Ver supabase/propuestas/support-tickets.sql.

export type SupportCategory =
  | 'acceso'
  | 'error_tecnico'
  | 'contenido_curso'
  | 'certificado'
  | 'cuenta'
  | 'otro'

export type SupportPriority = 'baja' | 'media' | 'alta'
export type SupportStatus = 'abierto' | 'en_progreso' | 'cerrado'

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  acceso: 'Problema de acceso',
  error_tecnico: 'Error técnico',
  contenido_curso: 'Contenido de un curso',
  certificado: 'Certificados',
  cuenta: 'Mi cuenta',
  otro: 'Otro',
}

export const SUPPORT_PRIORITY_LABELS: Record<SupportPriority, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
}

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  abierto: 'Abierto',
  en_progreso: 'En progreso',
  cerrado: 'Cerrado',
}

export interface SupportTicket {
  id: string
  requester_id: string | null
  requester_email: string | null
  requester_name: string | null
  category: SupportCategory
  priority: SupportPriority
  status: SupportStatus
  subject: string
  description: string
  context: Record<string, unknown>
  assignee_id: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
  closed_at: string | null
}

export interface SupportTicketMessage {
  id: string
  ticket_id: string
  author_id: string | null
  body: string
  is_internal: boolean
  created_at: string
}

// ── Feedback de cursos ─────────────────────────────────────
// Ver supabase/propuestas/course-feedback.sql.

export interface CourseFeedback {
  id: string
  course_id: string
  user_id: string
  rating: number
  comment: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
}

// ── Preferencias de accesibilidad ──────────────────────────
// Ver supabase/propuestas/accessibility-preferences.sql.

export type FontScale = 'normal' | 'grande' | 'extra'

export const FONT_SCALE_LABELS: Record<FontScale, string> = {
  normal: 'Normal',
  grande: 'Grande',
  extra: 'Muy grande',
}

export interface UserPreferences {
  user_id: string
  font_scale: FontScale
  high_contrast: boolean
  /** null = respetar prefers-reduced-motion del sistema. */
  reduced_motion: boolean | null
  updated_at: string
}

/** Lo que se aplica cuando el usuario todavía no guardó preferencias. */
export const DEFAULT_PREFERENCES: Omit<UserPreferences, 'user_id' | 'updated_at'> = {
  font_scale: 'normal',
  high_contrast: false,
  reduced_motion: null,
}

// ── Payload del wizard de creación de eventos ──────────────
// Los archivos 'use server' solo pueden exportar funciones async, así que
// este tipo vive acá (no en events.ts) y se importa donde se necesite.
export interface CreateEventPayload {
  title: string
  event_type: EventType
  sede_id: string
  event_date: string
  description: string
  sections: {
    name: string
    description?: string
    members: { user_id: string; member_role: EventSectionMemberRole }[]
    tasks: { title: string; description?: string; due_date?: string | null }[]
  }[]
}

// ── Tipo principal de la DB para el cliente Supabase ───────
// Permite usar supabase.from<Database>('tabla') con autocompletado

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Pick<Profile, 'status' | 'sede' | 'area_trabajo' | 'role' | 'approved_by' | 'approved_at' | 'full_name' | 'rut' | 'fecha_nacimiento' | 'avatar_url' | 'firma_url' | 'onboarding_completed'>>
        Relationships: []
      }
      courses: {
        Row: Course
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Course, 'id' | 'created_at'>>
        Relationships: []
      }
      modules: {
        Row: Module
        Insert: Omit<Module, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Module, 'id' | 'created_at'>>
        Relationships: []
      }
      quizzes: {
        Row: Quiz
        Insert: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Quiz, 'id' | 'created_at'>>
        Relationships: []
      }
      questions: {
        Row: Question
        Insert: Omit<Question, 'id' | 'created_at'>
        Update: Partial<Omit<Question, 'id' | 'created_at'>>
        Relationships: []
      }
      quiz_attempts: {
        Row: QuizAttempt
        Insert: Omit<QuizAttempt, 'id' | 'completed_at' | 'attempt_number'>
        Update: Record<string, never>  // Tabla inmutable — no se permiten updates
        Relationships: []
      }
      certificates: {
        Row: Certificate
        // verification_code lo pone un trigger — nunca se manda desde el cliente.
        Insert: Omit<Certificate, 'id' | 'issued_at' | 'verification_code'>
        Update: Pick<Certificate, 'pdf_url'>
        Relationships: []
      }
      course_progress: {
        Row: CourseProgress
        Insert: Omit<CourseProgress, 'id' | 'started_at'>
        Update: Partial<Omit<CourseProgress, 'id' | 'user_id' | 'course_id' | 'started_at'>>
        Relationships: []
      }
      events: {
        Row: EventRecord
        Insert: Omit<EventRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventRecord, 'id' | 'created_at' | 'created_by'>>
        Relationships: []
      }
      event_sections: {
        Row: EventSection
        Insert: Omit<EventSection, 'id'>
        Update: Partial<Omit<EventSection, 'id' | 'event_id'>>
        Relationships: []
      }
      event_section_members: {
        Row: EventSectionMember
        Insert: EventSectionMember
        Update: Partial<Pick<EventSectionMember, 'member_role'>>
        Relationships: []
      }
      event_tasks: {
        Row: EventTask
        Insert: Omit<EventTask, 'id' | 'updated_at' | 'completed_at' | 'completed_by'>
        Update: Partial<Omit<EventTask, 'id' | 'section_id' | 'created_by'>>
        Relationships: []
      }
      event_documents: {
        Row: EventDocument
        Insert: Omit<EventDocument, 'id' | 'created_at'>
        Update: Record<string, never>
        Relationships: []
      }
      // Pendiente: tabla propuesta, ver supabase/propuestas/event-photos.sql
      event_photos: {
        Row: EventPhoto
        Insert: Omit<EventPhoto, 'id' | 'created_at'>
        Update: Record<string, never>
        Relationships: []
      }
      // Pendiente: tablas propuestas, ver supabase/propuestas/admin-days.sql
      admin_day_config: {
        Row: AdminDayConfig
        Insert: Partial<AdminDayConfig> & { id?: boolean }
        Update: Partial<Omit<AdminDayConfig, 'id'>>
        Relationships: []
      }
      admin_day_area_quotas: {
        Row: AdminDayAreaQuota
        Insert: AdminDayAreaQuota
        Update: Partial<Pick<AdminDayAreaQuota, 'quota'>>
        Relationships: []
      }
      admin_day_requests: {
        Row: AdminDayRequest
        Insert: Omit<AdminDayRequest, 'id' | 'created_at' | 'reviewed_by' | 'reviewed_at' | 'review_note' | 'status'> & {
          status?: AdminDayStatus
        }
        Update: Partial<Omit<AdminDayRequest, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      // Pendiente: tabla propuesta, ver supabase/propuestas/platform-settings.sql
      platform_settings: {
        Row: PlatformSetting
        Insert: Omit<PlatformSetting, 'updated_at'>
        Update: Partial<Omit<PlatformSetting, 'key'>>
        Relationships: []
      }
      // Pendiente: tablas propuestas, ver supabase/propuestas/support-tickets.sql
      support_tickets: {
        Row: SupportTicket
        Insert: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at' | 'closed_at' | 'status' | 'priority'> & {
          status?: SupportStatus
          priority?: SupportPriority
        }
        Update: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assignee_id' | 'closed_at'>>
        Relationships: []
      }
      support_ticket_messages: {
        Row: SupportTicketMessage
        Insert: Omit<SupportTicketMessage, 'id' | 'created_at'>
        Update: Record<string, never>  // El hilo es inmutable
        Relationships: []
      }
      // Pendiente: tabla propuesta, ver supabase/propuestas/course-feedback.sql
      course_feedback: {
        Row: CourseFeedback
        Insert: Omit<CourseFeedback, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Pick<CourseFeedback, 'rating' | 'comment'>>
        Relationships: []
      }
      // Pendiente: tabla propuesta, ver supabase/propuestas/accessibility-preferences.sql
      user_preferences: {
        Row: UserPreferences
        Insert: Omit<UserPreferences, 'updated_at'>
        Update: Partial<Omit<UserPreferences, 'user_id'>>
        Relationships: []
      }
    }
    Views: {
      reporte_avance: {
        Row: ReporteAvance
        Relationships: []
      }
    }
    Enums: {
      user_role: UserRole
      content_type: ContentType
      attempt_status: AttemptStatus
      sede: Sede
      profile_status: ProfileStatus
    }
    Functions: Record<string, never>
  }
}