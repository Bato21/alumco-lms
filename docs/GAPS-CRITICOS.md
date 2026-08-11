# Gaps Críticos vs. RepoConce — Plan de Cierre

> **Contexto:** Análisis comparativo entre nuestra plataforma (`alumco-lms`) y la del equipo ganador de la primera etapa (`RepoConce`, Laravel + Livewire). Este documento detalla los **4 gaps críticos** identificados y el plan concreto para cerrarlos.
>
> **Referencia completa:** `../FEATURES_RepoConce.md` (parte 2, §23)
>
> **Fecha:** 2026-08-05

---

## Índice

1. [Cómo leer este documento](#cómo-leer-este-documento)
2. [Gap 1 — Notificaciones por email](#gap-1--notificaciones-por-email)
3. [Gap 2 — Verificación pública de certificados con QR](#gap-2--verificación-pública-de-certificados-con-qr)
4. [Gap 3 — Business Intelligence ampliado](#gap-3--business-intelligence-ampliado)
5. [Gap 4 — Sistema de tickets de soporte](#gap-4--sistema-de-tickets-de-soporte)
6. [Roadmap consolidado](#roadmap-consolidado)
7. [Riesgos y consideraciones transversales](#riesgos-y-consideraciones-transversales)

---

## Cómo leer este documento

Cada gap sigue la misma estructura:

- **Qué tienen ellos** — descripción de la implementación de RepoConce
- **Qué tenemos nosotros** — el estado actual real de nuestro repo
- **Por qué importa** — justificación de negocio (ONG Alumco, ELEAMs, cumplimiento)
- **Alcance de la solución** — MVP mínimo funcional + iteraciones opcionales
- **Plan técnico** — cambios SQL, server actions, componentes, config
- **Archivos a crear/modificar** — paths concretos siguiendo la estructura actual
- **Estimación de esfuerzo** — en días-persona de trabajo enfocado
- **Criterios de aceptación** — cómo validar que el gap está cerrado

**Nota sobre nuestro stack:** todas las soluciones respetan las normativas de `CLAUDE.md`:
- Next.js 16 App Router, Server Components + Server Actions
- TypeScript estricto (cero `any`)
- Supabase (Auth + Postgres + Storage) con RLS
- shadcn/ui + Tailwind v4
- Zod para validación cliente y servidor
- Aislamiento `is_demo` respetado en todas las nuevas features

---

## Gap 1 — Notificaciones por email

### Qué tienen ellos
Sistema completo de notificaciones transaccionales por email con cola Redis:

- **8 tipos de notificación** (`app/Notifications/` en RepoConce):
  - `CourseAvailableNotification` — programada diario 8:00 AM
  - `CourseDeadlineReminderNotification` — programada diario 9:00 AM (recuerda 2 días antes)
  - `CourseCompletedCertificateNotification`
  - `CoursePlanningNotification`
  - `ResetPasswordNotification`
  - `SetupPasswordNotification`
  - `SupportTicketCreatedNotification`
  - `SupportTicketRequesterNotification`
- Todas usan `ShouldQueue` (Redis backend, no bloquean el request)
- **Deduplicación** vía tabla `notification_deliveries` (evita duplicados con key único)
- Tareas programadas con Laravel Scheduler

### Qué tenemos nosotros
- **Ninguna notificación transaccional por email** salvo el reset de contraseña vía Supabase Auth (que usa el SMTP del proyecto Supabase).
- Feedback al usuario limitado a toasts (Sonner) en la sesión activa.
- No hay recordatorios de deadline, no hay avisos de aprobación de solicitud, no hay notificación al generar certificado.

### Por qué importa
- El trabajador de un ELEAM no está permanentemente en la plataforma. Si un curso obligatorio vence en 2 días, **necesita un correo que se lo recuerde** (SENAMA audita el cumplimiento).
- Cuando un admin aprueba una solicitud, hoy el nuevo trabajador no se entera hasta que intenta entrar. Un email de bienvenida cierra el loop.
- Al generar un certificado, un email adjuntando/enlazando el PDF es la evidencia formal que RRHH suele pedir.

### Alcance de la solución

**MVP (Sprint 1 — 3 tipos de correo, cubren 80% del valor):**
1. Recordatorio de deadline de curso (T-2 días)
2. Aprobación de solicitud (bienvenida + link de login)
3. Certificado generado (con link a `/certificado/[id]`)

**Ampliación (Sprint 2):**
4. Curso publicado / asignado a un trabajador
5. Solicitud de días administrativos aprobada/rechazada
6. Recordatorio de evento próximo (T-3 días para encargados)

### Plan técnico

#### 1. Proveedor de correo
**Recomendación: [Resend](https://resend.com)** por:
- SDK oficial para Node.js con tipado TypeScript
- Integración trivial desde Vercel (mismo ecosistema)
- Free tier de 3.000 emails/mes (suficiente para el volumen actual)
- Plantillas React con `@react-email/components` (mantiene coherencia visual con el resto del stack)

Alternativa: SMTP directo vía nodemailer con las credenciales SMTP de Supabase (más limitado, sin analytics).

#### 2. Cambios en Supabase

**Nueva tabla `email_deliveries`** (equivalente al `notification_deliveries` de ellos, para deduplicación y auditoría):

```sql
create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,       -- ej: "deadline:{course_id}:{user_id}:{YYYY-MM-DD}"
  recipient_email text not null,
  recipient_user_id uuid references public.profiles(id),
  template_name text not null,           -- 'deadline_reminder' | 'welcome' | 'certificate_generated' | ...
  subject text not null,
  status text not null default 'pending',-- pending | sent | failed
  provider_message_id text,              -- id devuelto por Resend
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index email_deliveries_recipient_idx on public.email_deliveries (recipient_user_id);
create index email_deliveries_template_idx on public.email_deliveries (template_name);

-- RLS: solo admin lee esta tabla (auditoría interna)
alter table public.email_deliveries enable row level security;
```

El `dedupe_key` es la clave: garantiza que un mismo recordatorio de deadline no se envíe dos veces al mismo trabajador el mismo día (idempotencia frente a reintentos del cron).

#### 3. Envío programado (recordatorios diarios)

**Vercel Cron Jobs** en `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/deadline-reminders", "schedule": "0 12 * * *" }
  ]
}
```

*(12:00 UTC ≈ 09:00 hora Chile continental)*

Nueva ruta `src/app/api/cron/deadline-reminders/route.ts`:
- Verificar header `Authorization: Bearer ${CRON_SECRET}`
- Query: cursos con `deadline` entre hoy+2 y hoy+2, cruzar con `course_progress` para excluir a quienes ya completaron
- Para cada `(user, course)`: intentar `insert` en `email_deliveries` con `dedupe_key = "deadline:{course_id}:{user_id}:{today}"`; si el insert falla por `unique_violation`, saltar. Si tiene éxito, enviar el email vía Resend, luego actualizar `status='sent'`.

#### 4. Envío in-line (aprobación, certificado)

Nuevo módulo `src/lib/email/`:

```
src/lib/email/
├── client.ts               # cliente Resend con lazy singleton
├── send.ts                 # sendEmail() con dedupe + logging en email_deliveries
├── templates/
│   ├── DeadlineReminder.tsx
│   ├── WelcomeApproved.tsx
│   └── CertificateGenerated.tsx
└── types.ts                # discriminated union por template
```

Cada plantilla React (con `@react-email/components`) exporta:
- `subject(props)` — genera el subject
- `default export` — el componente JSX con la paleta corporativa Alumco

Integración en server actions existentes:
- `approveWorkerAction` (`src/lib/actions/registro.ts`) → llamar `sendEmail({ template: 'welcome_approved', to: ..., props: ... })` después del `update`
- `generateCertificateAction` (`src/lib/actions/certificates.ts`) → mismo patrón tras crear la fila

**Importante:** el envío es fire-and-forget con `try/catch` interno — si Resend falla, se loggea en `email_deliveries.status='failed'` pero **la server action no falla**. La UX principal (aprobar/generar cert) no debe romperse por un problema de correo.

#### 5. Variables de entorno

Agregar a `.env.local` y a Vercel:

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Alumco LMS <no-reply@ongalumco.cl>"
CRON_SECRET=<random-32-chars>
NEXT_PUBLIC_SITE_URL=https://kimunko.vercel.app
```

`RESEND_FROM_EMAIL` idealmente con dominio verificado en Resend (`ongalumco.cl`). Mientras se coordina con la ONG, usar `onboarding@resend.dev` (dominio de prueba de Resend).

### Archivos a crear/modificar

**Nuevos:**
- `supabase/migrations/YYYYMMDD_email_deliveries.sql`
- `src/lib/email/client.ts`
- `src/lib/email/send.ts`
- `src/lib/email/templates/DeadlineReminder.tsx`
- `src/lib/email/templates/WelcomeApproved.tsx`
- `src/lib/email/templates/CertificateGenerated.tsx`
- `src/lib/email/types.ts`
- `src/app/api/cron/deadline-reminders/route.ts`
- `vercel.json` (o extender el existente)

**Modificar:**
- `src/lib/actions/registro.ts` — llamada a `sendEmail` en `approveWorkerAction`
- `src/lib/actions/certificates.ts` — llamada a `sendEmail` en `generateCertificateAction`
- `package.json` — dependencias `resend`, `@react-email/components`
- `src/lib/types/database.ts` — tipo `EmailDelivery`

### Estimación
**2.5 días-persona** (incluye QA en Mailpit local + verificación en Vercel preview + registro de dominio en Resend).

### Criterios de aceptación
- [ ] Un trabajador con curso que vence en 2 días recibe un correo la mañana siguiente
- [ ] Reintentar el cron el mismo día NO envía duplicados (idempotencia por `dedupe_key`)
- [ ] Aprobar una solicitud dispara un correo de bienvenida con link de login
- [ ] Generar un certificado dispara un correo con link a `/certificado/[id]`
- [ ] Fallo del proveedor de correo NO rompe la acción principal (aprobar/generar)
- [ ] Los correos respetan la paleta y branding de Alumco
- [ ] Los correos a usuarios `is_demo` se marcan pero pueden opcionalmente redirigirse a una bandeja de test (evaluar)

---

## Gap 2 — Verificación pública de certificados con QR

### Qué tienen ellos
- Cada certificado tiene un `codigo_verificacion` único (columna en `certificados`)
- El PDF incluye un **código QR** que apunta a `/certificados/verificar/{codigo}`
- La ruta es **pública** (sin login), controlada por rate limit
- Muestra: nombre del trabajador, RUT, curso, fecha, y valida vigencia
- Un fiscalizador de SENAMA (o un futuro empleador) puede escanear el QR y verificar autenticidad sin credenciales

### Qué tenemos nosotros
- Ruta `/certificado/[certificateId]` **exige** que el caller sea el dueño o un admin (`src/app/certificado/[certificateId]/page.tsx`)
- El PDF no incluye QR
- No hay forma de que un tercero valide un certificado sin acceso a la plataforma

### Por qué importa
- **SENAMA fiscaliza el cumplimiento** de capacitación en ELEAMs. Un fiscalizador que ve un PDF impreso necesita poder validar que no es falsificado.
- Trabajadores rotan entre ELEAMs y otras instituciones — llevar un certificado verificable digitalmente aumenta su valor.
- Es un feature de **credibilidad institucional** con costo de implementación bajo.

### Alcance de la solución
MVP único (no requiere iteraciones):
1. Agregar columna `verification_code` a `certificates`
2. Backfill de códigos para certificados existentes
3. Ruta pública `/verificar/[codigo]`
4. Incorporar QR al PDF (con `qrcode`)
5. Rate limiting básico (opcional en MVP, recomendado antes de producción)

### Plan técnico

#### 1. Cambios en Supabase

```sql
-- 1. Agregar columna verification_code
alter table public.certificates
  add column if not exists verification_code text unique;

-- 2. Backfill (12 caracteres alfanuméricos, base32 sin ambigüedades)
update public.certificates
   set verification_code = upper(substring(md5(id::text || created_at::text), 1, 12))
 where verification_code is null;

alter table public.certificates
  alter column verification_code set not null;

-- 3. Trigger para nuevos certificados
create or replace function public.set_certificate_verification_code()
returns trigger language plpgsql as $$
begin
  if new.verification_code is null then
    new.verification_code := upper(substring(md5(new.id::text || now()::text), 1, 12));
  end if;
  return new;
end;
$$;

drop trigger if exists tr_set_certificate_verification_code on public.certificates;
create trigger tr_set_certificate_verification_code
  before insert on public.certificates
  for each row execute function public.set_certificate_verification_code();

-- 4. Índice
create index if not exists certificates_verification_code_idx
  on public.certificates (verification_code);

-- 5. RLS: policy pública SOLO para SELECT por verification_code
--    (no exponer listados, solo lookup exacto)
create policy "public_verify_certificate"
  on public.certificates for select
  using (true);  -- se aplicará controlado desde la ruta con .eq('verification_code', ...)
```

**Nota sobre RLS:** en vez de abrir la tabla completa, la práctica más segura es dejar la policy existente restringida y hacer el lookup en el server route con `createAdminClient()` (service_role) filtrando estrictamente por `verification_code`. Así el service_role nunca expone datos personales más allá de los estrictamente necesarios en la vista pública.

#### 2. Ruta pública

`src/app/verificar/[codigo]/page.tsx`:

```typescript
export const dynamic = 'force-dynamic';

export default async function VerificarPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;

  // Validar formato con Zod (12 chars alfanuméricos)
  const parsed = z.string().regex(/^[A-Z0-9]{12}$/).safeParse(codigo);
  if (!parsed.success) return <CertificadoInvalido />;

  const admin = createAdminClient();
  const { data: cert } = await admin
    .from('certificates')
    .select(`
      id, created_at, verification_code,
      profile:profiles(full_name, rut, sede),
      course:courses(title)
    `)
    .eq('verification_code', parsed.data)
    .maybeSingle();

  if (!cert) return <CertificadoNoEncontrado codigo={codigo} />;

  return <CertificadoValido cert={cert} />;
}
```

**Datos expuestos públicamente:** nombre completo, RUT (parcialmente enmascarado — `12.345.678-X` → `12.***.678-X`), sede, curso, fecha. **NO exponer:** email, área de trabajo, avatar, historial.

Componente visual: card con badge verde "✅ Certificado válido", datos del trabajador, curso, fecha de emisión, y botón "Descargar PDF original".

#### 3. QR en el PDF

Instalar `qrcode`:

```bash
npm install qrcode
npm install -D @types/qrcode
```

En `src/lib/certificates/generateCertificatePDF.ts` (o donde esté hoy la generación):

```typescript
import QRCode from 'qrcode';

// después de crear el PDF con pdf-lib
const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verificar/${verification_code}`;
const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
  errorCorrectionLevel: 'M',
  margin: 1,
  width: 200,
});
const qrPngBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
const qrImage = await pdfDoc.embedPng(qrPngBytes);
page.drawImage(qrImage, {
  x: pageWidth - 150,
  y: 50,
  width: 100,
  height: 100,
});
// Pequeño texto: "Verificar en {url}"
```

#### 4. Rate limiting (recomendado antes de producción)

Para evitar enumeración masiva de códigos (aunque el espacio 12^36 es enorme), usar `@upstash/ratelimit` con Redis (Upstash tiene free tier).

Alternativa mínima sin infraestructura extra: middleware simple con contador en memoria (aceptable para tráfico bajo, no escala).

### Archivos a crear/modificar

**Nuevos:**
- `supabase/migrations/YYYYMMDD_certificate_verification_code.sql`
- `src/app/verificar/[codigo]/page.tsx`
- `src/components/alumco/CertificadoValido.tsx`
- `src/components/alumco/CertificadoNoEncontrado.tsx`

**Modificar:**
- `src/lib/certificates/*` (donde esté la generación de PDF) — agregar QR
- `src/lib/types/database.ts` — agregar `verification_code: string` a `Certificate`
- `src/lib/utils.ts` — helper `maskRut()`
- `.env.local` + Vercel — validar `NEXT_PUBLIC_SITE_URL` en producción

### Estimación
**1.5 días-persona.**

### Criterios de aceptación
- [ ] Cada certificado tiene un `verification_code` único (backfill correcto para los existentes)
- [ ] El PDF incluye un QR escaneable que apunta a `/verificar/{codigo}`
- [ ] La ruta `/verificar/{codigo}` funciona **sin login**
- [ ] Muestra datos mínimos (nombre, RUT enmascarado, sede, curso, fecha)
- [ ] Códigos inválidos o inexistentes muestran un mensaje claro (no leak de "existe pero no puedes verlo")
- [ ] Los certificados de usuarios `is_demo` NO son verificables públicamente (o se marcan claramente como "DEMO")

---

## Gap 3 — Business Intelligence ampliado

### Qué tienen ellos
Dashboard admin con **4 vistas independientes** y múltiples visualizaciones:

- **Resumen** — cobertura anual vs. target 85%
- **Progreso** — avance y riesgo por segmento
- **Calidad** — evaluaciones + feedback
- **Segmentos** — desglose por sedes y estamentos

Gráficos con Chart.js:
- Certificados emitidos por mes (línea temporal)
- Cursos por sede (barras)
- Distribución etaria (pirámide)
- Gauge anual por capacitador
- Composición de participantes
- Participantes por sede
- Cursos con peor cumplimiento (top N)

### Qué tenemos nosotros
En `/admin/dashboard`:
- KPIs básicos: trabajadores activos, cursos publicados, certificados emitidos, % cumplimiento, aprobaciones pendientes
- Completaciones por sede (% Hualpén vs. Coyhaique)
- Cursos con peor cumplimiento (top 3) — ✅ **ya lo tenemos**
- Alertas: deadlines vencidos, trabajadores con poco progreso
- Actividad reciente
- Card de evento próximo

**Faltan:** visualizaciones temporales (mes a mes), gauge de cobertura vs. target, desglose por área de trabajo, pirámide etaria, y una vista de "calidad" (rating de feedback — que depende del Gap "feedback de cursos", ver §22 del comparativo).

### Por qué importa
- La directora técnica y el gerente necesitan reportar a la junta/directorio: **tendencia mensual** de certificaciones es la métrica más pedida.
- Para SENAMA (fiscalización): "cobertura anual vs. target" es la métrica formal.
- Para RRHH: **desglose por área** (Enfermería, TENS, Kinesiología...) revela dónde falta capacitación.
- Para el equipo de admin: **pirámide etaria** ayuda a diseñar cursos con contenido adecuado al perfil.

### Alcance de la solución

**MVP (Sprint 1):**
1. Gráfico temporal: certificados emitidos últimos 12 meses
2. Gauge de cobertura anual (certificados emitidos / target)
3. Desglose de cumplimiento por área de trabajo (barras horizontales)
4. Target anual configurable (una fila en tabla `platform_settings`)

**Ampliación (Sprint 2):**
5. Pirámide etaria de trabajadores activos
6. Tendencia semanal de logins (proxy de engagement)
7. Vista "Calidad" — requiere primero implementar feedback de cursos (dependencia externa a este gap)
8. Exportación PNG/PDF del dashboard completo

### Plan técnico

#### 1. Elección de librería de gráficos

**Recomendación: [Recharts](https://recharts.org)** por:
- Componentes React nativos (SSR-friendly, sin `use client` innecesario en wrappers)
- Tipado TypeScript sólido
- Composable con shadcn/ui (existen `<Chart>` primitives en shadcn/ui)

shadcn/ui provee un wrapper oficial (`chart.tsx`) sobre Recharts que ya usa la paleta CSS variables — encaja perfecto con la paleta Alumco.

Instalación:
```bash
npx shadcn@latest add chart
npm install recharts
```

#### 2. Nueva tabla `platform_settings`

```sql
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

insert into public.platform_settings (key, value) values
  ('annual_certification_target', '{"target": 85, "year": 2026}'::jsonb);

-- RLS: lectura para todos los autenticados, escritura solo admin
alter table public.platform_settings enable row level security;
create policy "read_settings" on public.platform_settings for select using (auth.role() = 'authenticated');
create policy "write_settings" on public.platform_settings for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
```

#### 3. Server actions nuevas

`src/lib/actions/analytics.ts`:

```typescript
'use server';

export async function getCertificatesByMonth(months = 12) {
  // Agregación SQL: certificates group by month, últimos N meses
  // Retornar Array<{ month: string; count: number; }> con meses sin datos rellenados con 0
}

export async function getComplianceByArea() {
  // Por cada area_trabajo distinta:
  //   - # trabajadores del área
  //   - # certificaciones esperadas (cursos con target_areas que incluyan el área × trabajadores)
  //   - # certificaciones logradas
  //   - % cumplimiento
}

export async function getAgeDistribution() {
  // Buckets de edad: 18-25, 26-35, 36-45, 46-55, 56-65, 65+
  // Count de trabajadores activos por bucket
}

export async function getAnnualCoverage() {
  // { target: 85, actual: 62, year: 2026 }
  // actual = % de trabajadores activos con al menos 1 certificado en el año
}
```

Todas con `requireAdmin()` al inicio y usando `createAdminClient()` para bypassear RLS.

#### 4. Componentes de dashboard

`src/components/alumco/dashboard/`:

```
├── CertificatesMonthlyChart.tsx   # LineChart de Recharts, últimos 12 meses
├── ComplianceByAreaChart.tsx      # BarChart horizontal
├── AgeDistributionChart.tsx       # BarChart vertical (pirámide simple)
├── AnnualCoverageGauge.tsx        # RadialBarChart con needle
└── DashboardTabs.tsx              # Tabs shadcn: Resumen | Progreso | Segmentos
```

Cada gráfico es un Server Component que hace fetch de su server action y pasa datos a un Client Component wrapper con Recharts.

#### 5. Reorganización de `/admin/dashboard`

Migrar a un layout con `<Tabs>` de shadcn:

- **Tab 1: Resumen** (default) — KPIs actuales + gauge de cobertura
- **Tab 2: Tendencias** — certificados por mes + logins/actividad
- **Tab 3: Segmentos** — cumplimiento por área + por sede + distribución etaria
- **Tab 4: Alertas** (existente) — deadlines vencidos, top peores cursos, actividad reciente

Mantener retrocompatibilidad — la vista actual sigue siendo el default tab.

### Archivos a crear/modificar

**Nuevos:**
- `supabase/migrations/YYYYMMDD_platform_settings.sql`
- `src/lib/actions/analytics.ts`
- `src/components/alumco/dashboard/CertificatesMonthlyChart.tsx`
- `src/components/alumco/dashboard/ComplianceByAreaChart.tsx`
- `src/components/alumco/dashboard/AgeDistributionChart.tsx`
- `src/components/alumco/dashboard/AnnualCoverageGauge.tsx`
- `src/components/alumco/dashboard/DashboardTabs.tsx`
- `src/app/admin/configuracion/page.tsx` — pantalla para editar `platform_settings` (target anual)
- `src/components/ui/chart.tsx` — vía `npx shadcn add chart`

**Modificar:**
- `src/app/admin/dashboard/page.tsx` — envolver en tabs
- `src/lib/types/database.ts` — tipo `PlatformSetting`
- `package.json` — dependencia `recharts`

### Estimación
**3 días-persona** para MVP (4 gráficos + tabs + tabla settings + pantalla de config).

### Criterios de aceptación
- [ ] Gráfico de certificados últimos 12 meses visible en el dashboard
- [ ] Gauge muestra `actual / target` de cobertura anual, target editable desde `/admin/configuracion`
- [ ] Cumplimiento por área de trabajo con al menos 5 áreas visibles
- [ ] Pirámide etaria de trabajadores activos (buckets de 10 años)
- [ ] Tabs no rompen navegación existente (default = Resumen)
- [ ] Datos filtrados por `is_demo` de forma consistente con el resto de la app
- [ ] Performance: dashboard carga en < 2s con 500 trabajadores y 2000 certificados

---

## Gap 4 — Sistema de tickets de soporte

### Qué tienen ellos
Sistema completo tipo helpdesk:
- Tabla `support_tickets` con categoría (acceso / error / curso / certificados / cuenta / otro), prioridad, estado
- Tabla `support_ticket_messages` con hilo de conversación
- Flag `is_internal` en mensajes (visible solo para desarrolladores)
- Tabla `support_ticket_attachments` con validación MIME/tamaño
- Contexto técnico auto-capturado (URL, user agent, timestamp)
- **Contacto público sin login** (rate limit 6/hora)
- Notificaciones por email al crear y responder
- Panel dev en `/dev/soporte`

### Qué tenemos nosotros
- **Nada.** Los usuarios reportan problemas por WhatsApp/email directo al equipo Alumco o al equipo de desarrollo.

### Por qué importa
- El equipo de admin de Alumco actualmente recibe reportes de forma **desorganizada** (WhatsApp de la directora, emails sueltos, mensajes en reuniones).
- No hay trazabilidad — un mismo bug puede reportarse 3 veces sin que nadie lo sepa.
- Cuando la plataforma escale a más ELEAMs o a más organizaciones, el modelo actual **no escala**.
- Es un gap que **RepoConce probablemente destacará** ante el jurado como diferencial.

### Alcance de la solución

**MVP (Sprint 2 — solo lo mínimo, evita over-engineering):**
1. Formulario "Reportar problema" accesible desde el sidebar (admin y trabajador)
2. Categoría (enum), asunto, descripción
3. Auto-captura de contexto (URL actual, user agent, user_id)
4. Panel admin en `/admin/soporte` con lista + detalle + cambio de estado (abierto → en_progreso → resuelto → cerrado)
5. Notificación email al equipo al crear + al usuario al cambiar estado

**Ampliación (post-competencia):**
6. Hilo de mensajes bidireccional
7. Adjuntos (screenshots)
8. Ticket público sin login (para la landing page — `/soporte/contacto`)
9. Rate limiting
10. Vista para "profesor" (capacitador — reportes de su propio contenido)

### Plan técnico

#### 1. Cambios en Supabase

```sql
create type support_category as enum (
  'acceso', 'error_tecnico', 'contenido_curso', 'certificado', 'cuenta', 'otro'
);
create type support_status as enum ('abierto', 'en_progreso', 'resuelto', 'cerrado');
create type support_priority as enum ('baja', 'media', 'alta');

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id),  -- null si es ticket anónimo (post-MVP)
  requester_email text,                              -- para tickets anónimos
  requester_name text,
  category support_category not null,
  priority support_priority not null default 'media',
  status support_status not null default 'abierto',
  subject text not null check (length(subject) between 6 and 160),
  description text not null check (length(description) between 12 and 5000),
  context jsonb not null default '{}'::jsonb,        -- { url, userAgent, timestamp, ... }
  assignee_id uuid references public.profiles(id),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index support_tickets_status_idx on public.support_tickets (status);
create index support_tickets_requester_idx on public.support_tickets (requester_id);

alter table public.support_tickets enable row level security;

-- Trabajadores/profesores ven solo sus propios tickets
create policy "user_reads_own_tickets" on public.support_tickets for select
  using (auth.uid() = requester_id);

-- Admin (via requireAdmin + adminClient) ve todos — no requiere policy

-- Cualquiera autenticado puede crear su propio ticket
create policy "user_creates_own_ticket" on public.support_tickets for insert
  with check (auth.uid() = requester_id);

-- set_updated_at trigger (reusar el existente)
create trigger set_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();
```

#### 2. Server actions

`src/lib/actions/support.ts`:

```typescript
'use server';

const CreateTicketSchema = z.object({
  category: z.enum(['acceso', 'error_tecnico', 'contenido_curso', 'certificado', 'cuenta', 'otro']),
  subject: z.string().min(6).max(160),
  description: z.string().min(12).max(5000),
  context: z.record(z.unknown()).optional(),
});

export async function createSupportTicketAction(input: unknown) {
  const parsed = CreateTicketSchema.parse(input);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autenticado' };

  const profile = await getProfile(user.id);
  const { data, error } = await supabase.from('support_tickets').insert({
    requester_id: user.id,
    requester_email: user.email,
    requester_name: profile.full_name,
    is_demo: profile.is_demo ?? false,
    ...parsed,
  }).select().single();

  if (data) {
    await sendEmail({
      template: 'ticket_created_notify_admin',
      to: process.env.SUPPORT_INBOX_EMAIL!,
      props: { ticket: data },
    });
  }
  return { success: !error, ticketId: data?.id, error: error?.message };
}

export async function updateTicketStatusAction(ticketId: string, status: SupportStatus) {
  await requireAdmin();
  // update + notificar al requester si el estado pasa a resuelto
}

export async function listTicketsAction(filters?: TicketFilters) {
  await requireAdmin();
  // consulta con filtros por status / category / requester
}
```

#### 3. UI

**Formulario compacto en sidebar/topbar** (visible para todos los autenticados):
- Botón "¿Necesitas ayuda?" que abre un `Sheet` de shadcn con el formulario
- Al enviar: toast de éxito + link a "Ver mis tickets"

**Rutas:**
- `src/app/soporte/mis-tickets/page.tsx` — trabajador/admin ve sus propios tickets
- `src/app/soporte/[id]/page.tsx` — detalle de un ticket propio
- `src/app/admin/soporte/page.tsx` — admin ve TODOS con filtros
- `src/app/admin/soporte/[id]/page.tsx` — detalle admin con acciones (cambiar estado, asignar)

**Componentes:**
- `src/components/alumco/support/SupportButton.tsx` — el botón + Sheet
- `src/components/alumco/support/TicketForm.tsx`
- `src/components/alumco/support/TicketList.tsx`
- `src/components/alumco/support/TicketStatusBadge.tsx`

#### 4. Captura de contexto

Al abrir el Sheet, capturar client-side:
```typescript
const context = {
  url: window.location.pathname,
  userAgent: navigator.userAgent,
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  timestamp: new Date().toISOString(),
};
```

Enviar como parte del payload — el admin verá esto en el detalle del ticket, muy útil para reproducir bugs.

#### 5. Variables de entorno

```
SUPPORT_INBOX_EMAIL=soporte@ongalumco.cl
```

### Archivos a crear/modificar

**Nuevos:**
- `supabase/migrations/YYYYMMDD_support_tickets.sql`
- `src/lib/actions/support.ts`
- `src/lib/types/database.ts` (agregar tipos `SupportTicket`, `SupportCategory`, `SupportStatus`, `SupportPriority`)
- `src/components/alumco/support/SupportButton.tsx`
- `src/components/alumco/support/TicketForm.tsx`
- `src/components/alumco/support/TicketList.tsx`
- `src/components/alumco/support/TicketStatusBadge.tsx`
- `src/app/soporte/mis-tickets/page.tsx`
- `src/app/soporte/[id]/page.tsx`
- `src/app/admin/soporte/page.tsx`
- `src/app/admin/soporte/[id]/page.tsx`
- `src/lib/email/templates/TicketCreatedNotify.tsx`
- `src/lib/email/templates/TicketStatusChanged.tsx`

**Modificar:**
- `src/components/AdminSidebar.tsx` — agregar item "Soporte"
- `src/components/BottomNav.tsx` (o topbar) — botón "¿Necesitas ayuda?"

### Estimación
**3 días-persona** para MVP (sin adjuntos ni hilo de mensajes ni ticket público).

### Criterios de aceptación
- [ ] Cualquier usuario autenticado puede crear un ticket desde cualquier página
- [ ] El contexto (URL, user agent, viewport) se captura automáticamente
- [ ] Admin ve TODOS los tickets con filtro por estado y categoría
- [ ] Admin puede cambiar estado; el requester recibe email cuando pasa a "resuelto"
- [ ] Trabajador ve solo sus propios tickets (RLS enforced)
- [ ] Tickets de usuarios `is_demo` marcados y filtrables
- [ ] Rate limiting básico (a nivel Vercel edge o Upstash — opcional en MVP pero deseable)

---

## Roadmap consolidado

### Precondición transversal
Antes de empezar los gaps 1 y 4: **decidir e integrar Resend** (o alternativa). El sistema de email es dependencia de ambos.

### Sprint 1 (semana 1-2) — Cierra los 2 gaps más visibles

| Días | Feature |
|:---:|---|
| 2.5 | **Gap 1** — Notificaciones email (MVP: deadline, welcome, cert) |
| 1.5 | **Gap 2** — Verificación pública de certificados con QR |
| 3.0 | **Gap 3** — BI ampliado (4 gráficos nuevos + tabs + settings) |

**Total Sprint 1: ~7 días-persona.**

### Sprint 2 (semana 3) — Soporte + refinamientos

| Días | Feature |
|:---:|---|
| 3.0 | **Gap 4** — Tickets de soporte (MVP sin adjuntos) |
| 1.5 | Ampliación de notificaciones email (Sprint 1 → tipos 4-6) |
| 1.0 | Ampliación de BI (pirámide etaria, tendencia de logins) |

**Total Sprint 2: ~5.5 días-persona.**

### Total del cierre completo: ~12.5 días-persona
(≈ 2.5 semanas de trabajo enfocado para 1 dev, o 1.5 semanas para 2 devs en paralelo aprovechando que los gaps son mayormente independientes).

---

## Riesgos y consideraciones transversales

### 1. Dominio de correo
Enviar desde `no-reply@ongalumco.cl` requiere configurar SPF/DKIM/DMARC en el DNS del dominio. **Coordinar con quien administra el dominio de ONG Alumco** con al menos 2-3 días de anticipación. Mientras se resuelve, usar el dominio de prueba de Resend.

### 2. Aislamiento demo
Todos los nuevos features deben respetar `is_demo`:
- Los tickets `is_demo` no ensucian el inbox de soporte real
- Los certificados de usuarios demo deben verificarse pero mostrar un badge "DEMO"
- Los emails a usuarios demo NO deben salir a bandejas reales — usar un flag `EMAIL_DEMO_MODE=redirect` que redirija a una bandeja de test

### 3. RLS en las nuevas tablas
Cada tabla nueva (`email_deliveries`, `support_tickets`, `platform_settings`) debe tener RLS **desde el momento cero**. Nada de "después lo apretamos" — es la disciplina que nos diferencia.

### 4. Verificación pública de certificados y privacidad
La ruta `/verificar/[codigo]` expone datos personales (nombre completo, RUT parcial, curso). Aunque el RUT esté enmascarado, **coordinar con la directora técnica** que este nivel de exposición es aceptable. Es estándar en certificados corporativos, pero conviene documentarlo.

### 5. Costos
- **Resend**: free tier 3.000 emails/mes cubre el volumen actual con holgura. Plan Pro $20/mes si se supera.
- **Upstash Redis** (para rate limiting): free tier suficiente.
- **Recharts**: gratis, open source.
- Todos los cambios son compatibles con nuestro plan actual de Vercel + Supabase Free/Pro.

### 6. Migración de datos existentes
- Certificados actuales necesitan backfill de `verification_code` (script SQL en la migración)
- No hay tickets ni email deliveries previos — tablas parten vacías

### 7. Impacto en el resto de la app
- Cambios NO breaking en tipos ni server actions existentes
- Los usuarios existentes NO ven cambios hasta que se rediseñe el dashboard admin (Gap 3)
- Rollback: cada migración SQL debe ser reversible (drop table / drop column condicionado)

### 8. Testing
Actualmente no hay framework de testing configurado en el repo. Al menos:
- **Manual QA scripts** documentados por cada gap (checklists de aceptación arriba)
- Considerar agregar Playwright para al menos los flows críticos de nuevas features (post-MVP)

### 9. Documentación
Cada gap cerrado debe:
- Actualizar `CLAUDE.md` con la nueva capa (email, verificación, BI, tickets)
- Registrar decisiones en `docs/superpowers/decisions/` si existiera, o en un nuevo `docs/HANDOFF-GAPS-CIERRE.md`
- Actualizar `FEATURES_RepoConce.md` (parte 2) marcando los checks que ya cubrimos

---

**Fin del documento.** Cada gap tiene plan concreto, estimación, y criterios de aceptación medibles.
Para arrancar: recomiendo abrir un branch por gap y trabajar en paralelo cuando el equipo lo permita, empezando por **Gap 2 (QR de certificados)** como quick win visible antes del jurado.
