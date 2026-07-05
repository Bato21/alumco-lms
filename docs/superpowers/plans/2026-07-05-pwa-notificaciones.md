# Plan PWA + Notificaciones Push — de web a app que vibra en el bolsillo

**Rama:** testandy · **Fecha:** 2026-07-05
**La historia que vendemos:** hoy la capacitación depende de que el trabajador se acuerde de entrar. Al final de este plan, Alumco vive en la pantalla de inicio de cada celular y avisa sola: *"la residencia asigna la tarea y al auxiliar le vibra el bolsillo"*.

---

## Fase 1 — App instalable ✅ HECHA (commit `5a75676`)

**Qué es:** la plataforma se instala como app en cualquier celular. Ícono de la gota oliva junto a WhatsApp, abre a pantalla completa sin barra del navegador, splash con marca.

**Lo que se construyó:**
- `src/app/manifest.ts` — manifest nativo de Next (`/manifest.webmanifest`): nombre, colores crema, `start_url /inicio`, display standalone. De paso arregló un `/manifest.json` colgante que el layout referenciaba y no existía.
- `public/icons/` — gota oliva sobre crema en 192/512 (Android, maskable) y 180 (apple-touch-icon).
- Meta tags iOS en `layout.tsx` (`appleWebApp`).

**Pendiente de esta fase:**
- [ ] Probar en celular (iPhone: Safari → compartir → "Agregar a pantalla de inicio"; Android necesita HTTPS → deploy Vercel).
- [ ] Push a origin pa que el preview de Vercel dé la URL https.

**Venta pal pitch:** "No hay que bajar nada de ninguna tienda. Escaneas un QR, un toque, y la residencia tiene su app." — instalación en vivo frente a la directora, 15 segundos.

---

## Fase 2 — Infraestructura de push (la base técnica)

**Qué es:** el celular queda suscrito para recibir avisos aunque la app esté cerrada. iOS 16.4+ lo soporta solo con la app instalada (por eso la Fase 1 es prerequisito); Android lo soporta directo.

### 2.1 SQL (se lo mandamos a Bato junto al de fotos)

```sql
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
create policy "push_select_own" on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid());
create policy "push_insert_own" on public.push_subscriptions
  for insert to authenticated with check (user_id = auth.uid());
create policy "push_delete_own" on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());
```

### 2.2 Piezas de código

| Pieza | Archivo | Qué hace |
|---|---|---|
| Llaves VAPID | `.env.local` + env de Vercel | `npx web-push generate-vapid-keys` una vez; pública al cliente, privada al server |
| Dependencia | `web-push` (npm) | Firma y envía los push desde el server |
| Service worker | `public/sw.js` | Recibe el push con la app cerrada → muestra la notificación; click → abre la URL del aviso |
| Registro + permiso | `src/components/alumco/shared/ActivarNotificaciones.tsx` | Botón en **Mi perfil** (nunca prompt al entrar — mala práctica): pide permiso, suscribe con la llave pública, guarda en `push_subscriptions` |
| Action de guardado | `savePushSubscriptionAction` en `src/lib/actions/push.ts` | Inserta/actualiza la suscripción del usuario |
| Helper de envío | `sendPushToUsers(userIds, { title, body, url })` en `push.ts` (server-only, no action) | Busca suscripciones, envía con web-push, borra las muertas (HTTP 410) |

**Criterio de cierre:** botón "Probar notificación" en perfil me manda un push de prueba al celu con la app cerrada.

---

## Fase 3 — Los avisos que importan (el wow)

Enganchar `sendPushToUsers` a lo que ya existe. Cero UI nueva — las actions ya saben a quién le pasó qué:

| Disparador | Dónde se engancha | Notificación |
|---|---|---|
| Te suman a una sección de evento | `addMemberAction` | "Te sumaron a **Cocina** — Fiestas Patrias 🎉" |
| Tarea nueva en tu sección | `upsertTaskAction` (rama create) | "Nueva tarea en Cocina: comprar carbón" |
| Deadline de curso a 7 días sin completar | **Cron Vercel** diario 9:00 (`vercel.json` crons → route handler) | "Te queda 1 semana para *Prevención de caídas*" |
| Evento a 3 días con tareas pendientes | mismo cron | "Quedan 3 días pal 18 y Cocina tiene 4 tareas abiertas" |

Regla de oro anti-spam: máximo 1 push por usuario por evento-disparador; el cron agrupa ("tienes 2 cursos con plazo esta semana"), no ametralla.

**Venta pal pitch:** demo en vivo — admin asigna tarea desde el notebook, el celular sobre la mesa vibra y muestra el aviso. Ese momento gana pitches solo.

---

## Fase 4 — Pulido de demo (pre-pitch)

- [ ] QR gigante que apunta a la URL de producción → slide "instálenla ahora".
- [ ] Verificar íconos/splash en iPhone y Android reales (foto pa las slides).
- [ ] Guion de 60 segundos: instalar por QR (15s) → asignar tarea desde admin (15s) → vibra el celu (5s) → marcar tarea hecha desde el celu y ver el avance actualizado en el proyector (25s).
- [ ] (Opcional V2) toggles por tipo de aviso en el perfil, si sobra tiempo.

---

## Orden y dependencias

```
Fase 1 ✅ → push a Vercel (HTTPS) → probar instalación en celu
                ↓
Fase 2: SQL a Bato (junto al de event_photos) + VAPID + sw.js + botón perfil
                ↓
Fase 3: enganches en actions de eventos + cron de deadlines
                ↓
Fase 4: QR + guion de demo
```

**Esfuerzos:** F2 una sesión buena · F3 media sesión (los hooks son ~5 líneas por action; el cron es lo nuevo) · F4 un rato.

**Riesgos conocidos:**
- iOS exige app instalada pa push — la demo con iPhone debe instalar primero (el guion ya lo hace en ese orden).
- Los push a localhost no funcionan (necesita HTTPS) — desarrollo se prueba contra el preview de Vercel.
- Bato debe correr el SQL antes de la F2 completa — mandárselo YA junto al de fotos pa no bloquear.
