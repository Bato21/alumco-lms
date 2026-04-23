// src/lib/types/database.ts

export type UserRole = 'admin' | 'trabajador' | 'profesor'
export type ContentType = 'video' | 'pdf' | 'slides' | 'quiz'
export type AttemptStatus = 'aprobado' | 'reprobado' | 'en_progreso'
export type Sede = 'sede_1' | 'sede_2'
export type ProfileStatus = 'pendiente' | 'activo' | 'suspendido'

// ── Filas de cada tabla ────────────────────────────────────

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  sede: Sede
  area_trabajo: AreaTrabajo[]
  fecha_nacimiento: string | null
  avatar_url: string | null
  is_active: boolean
  status: ProfileStatus
  rut: string | null
  requested_at: string | null
  approved_by: string | null
  approved_at: string | null
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

// ── Tipo principal de la DB para el cliente Supabase ───────
// Permite usar supabase.from<Database>('tabla') con autocompletado

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Pick<Profile, 'status' | 'sede' | 'area_trabajo' | 'role' | 'approved_by' | 'approved_at' | 'full_name' | 'rut' | 'fecha_nacimiento' | 'avatar_url'>>
      }
      courses: {
        Row: Course
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Course, 'id' | 'created_at'>>
      }
      modules: {
        Row: Module
        Insert: Omit<Module, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Module, 'id' | 'created_at'>>
      }
      quizzes: {
        Row: Quiz
        Insert: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Quiz, 'id' | 'created_at'>>
      }
      questions: {
        Row: Question
        Insert: Omit<Question, 'id' | 'created_at'>
        Update: Partial<Omit<Question, 'id' | 'created_at'>>
      }
      quiz_attempts: {
        Row: QuizAttempt
        Insert: Omit<QuizAttempt, 'id' | 'completed_at' | 'attempt_number'>
        Update: never  // Tabla inmutable
      }
      certificates: {
        Row: Certificate
        Insert: Omit<Certificate, 'id' | 'issued_at'>
        Update: Pick<Certificate, 'pdf_url'>
      }
      course_progress: {
        Row: CourseProgress
        Insert: Omit<CourseProgress, 'id' | 'started_at'>
        Update: Partial<Omit<CourseProgress, 'id' | 'user_id' | 'course_id' | 'started_at'>>
      }
    }
    Views: {
      reporte_avance: {
        Row: ReporteAvance
      }
    }
    Enums: {
      user_role: UserRole
      content_type: ContentType
      attempt_status: AttemptStatus
      sede: Sede
      profile_status: ProfileStatus
    }
  }
}