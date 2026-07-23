// src/lib/types/database.ts

export type UserRole = 'admin' | 'trabajador' | 'profesor'
export type ContentType = 'video' | 'pdf' | 'slides' | 'quiz'
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
        Insert: Omit<Certificate, 'id' | 'issued_at'>
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