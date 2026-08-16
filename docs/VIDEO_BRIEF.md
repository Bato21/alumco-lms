# VIDEO_BRIEF — KimünKo

Documento de referencia para responder las **Fases 0 y 1** de `hve-video-director`.

**Qué es y qué no es.** Es un insumo: reúne el contexto de producto, la audiencia y
las decisiones ya tomadas, para que las preguntas del pipeline se respondan rápido y
sin improvisar. **No es un storyboard.** La skill escribe `storyboard.md` ella misma
después de que el brief se confirme, y cada decisión creativa la responde una persona,
no este archivo.

Última actualización: 2026-08-15

---

## 1. Contexto de producto (insumo para Fase 0)

### Qué es

**KimünKo** es la plataforma de capacitación asíncrona de **ONG Alumco**, organización
chilena dedicada al cuidado de personas mayores en ELEAM (Establecimientos de Larga
Estadía para Adultos Mayores). El repositorio es `alumco-lms`; KimünKo es el nombre de
producto de cara al usuario.

Stack: Next.js 16 (App Router), TypeScript estricto, Supabase (Auth + PostgreSQL +
Storage), desplegado en Vercel. Es una PWA instalable — `src/app/manifest.ts` y
`public/sw.js` — porque la mayoría del personal la usa desde el teléfono.

### Para quién

Dos perfiles reales, con rutas y navegación distintas en el código:

- **Trabajador de ELEAM.** Rango etario amplio, alfabetización digital variable, mayoría
  en móvil. Áreas: enfermería, auxiliar de enfermería, kinesiología, geriatría, nutrición,
  psicología, trabajo social, cuidado del adulto mayor, entre otras (13 áreas distintas
  registradas hoy).
- **Administrador / profesor.** Coordina la capacitación, aprueba solicitudes de acceso,
  construye cursos y audita el cumplimiento por sede y por área.

### Qué problema resuelve

Alumco opera en más de una sede y necesita **homologar conocimientos** entre ellas sin
sacar al personal de turno. La capacitación presencial choca con el trabajo por turnos en
un ELEAM: no se puede vaciar una sede para una charla. KimünKo desacopla la capacitación
del horario y, sobre todo, **deja evidencia auditable** de quién se capacitó, en qué y
cuándo.

### Contexto regulatorio

- **ELEAM**: Establecimiento de Larga Estadía para Adultos Mayores, la figura regulada
  bajo la que operan las sedes de Alumco.
- **SENAMA**: Servicio Nacional del Adulto Mayor, el organismo que fiscaliza.
- **Decreto 20/2022**: reglamento aplicable a los ELEAM, que fija un mínimo de
  **22 horas anuales de capacitación** para el personal.

> Nota para la defensa académica: el dato de las 22 horas anuales viene del brief del
> proyecto. Antes de la defensa conviene citar el artículo exacto del decreto, porque es
> el número que sostiene el argumento de por qué la plataforma existe y es previsible que
> la profesora pida la fuente.

El cumplimiento normativo es lo que convierte a KimünKo en una herramienta de gestión y
no en un repositorio de videos: el campo `deadline` y `deadline_description` en `courses`
existe precisamente para anclar cada curso a un plazo de fiscalización.

### Módulos que existen HOY

Inventario derivado del código (`src/app/**/page.tsx` y `src/components/alumco/nav/`).
**No incluye nada planificado ni a medio construir.**

#### Vista trabajador

| Módulo | Rutas | Qué hace |
| :--- | :--- | :--- |
| Inicio | `/inicio` | Portada del trabajador con su estado |
| Mis cursos | `/cursos`, `/cursos/[id]`, `/cursos/[id]/modulos/[moduleId]` | Listado, detalle y reproductor de módulos (video, PDF, slides) |
| Evaluaciones | `/cursos/[id]/modulos/[moduleId]/quiz` | Quiz con control de intentos |
| Certificados | `/mis-certificados`, `/certificado/[certificateId]` | Certificados obtenidos, generados en PDF |
| Eventos | `/eventos`, `/eventos/[id]` | Eventos por sede con secciones, encargados y tareas |
| Soporte | `/soporte`, `/soporte/[id]` | Tickets de soporte con hilo de mensajes |
| Días administrativos | `/dias-administrativos` | Solicitud de días administrativos (se entra desde Perfil) |
| Mi perfil | `/perfil` | Datos personales, firma, preferencias |

#### Vista administrador

| Módulo | Rutas | Qué hace |
| :--- | :--- | :--- |
| Dashboard | `/admin/dashboard` | Métricas y alertas de cumplimiento |
| Cursos | `/admin/cursos`, `/nuevo`, `/[id]/editar`, `/[id]/feedback` | CRUD y constructor de cursos por bloques (dnd-kit); feedback recibido |
| Eventos | `/admin/eventos`, `/nuevo`, `/[id]` | Creación y gestión de eventos, secciones y tareas |
| Trabajadores | `/admin/trabajadores`, `/[id]` | Listado unificado (activos / solicitudes) y ficha individual |
| Sedes | `/admin/sedes` | Administración de sedes |
| Reportes | `/admin/reportes` | Avance filtrable, exportable a CSV |
| Soporte | `/admin/soporte`, `/[id]` | Bandeja de tickets |
| Certificados | `/admin/certificados` | Certificados emitidos |
| Mi perfil | `/admin/perfil` | Perfil del administrador |

#### Transversal y público

| Función | Rutas / archivos | Qué hace |
| :--- | :--- | :--- |
| Landing pública | `/` | Sitio institucional de ONG Alumco |
| Autenticación | `/login`, `/registro`, `/reset-password` | Registro con aprobación asíncrona (`status = pendiente`) |
| Verificación de certificado | `/certificados/verificar/[codigo]` | Validación pública, sin sesión — pensada para el fiscalizador |
| Notificaciones push | `src/lib/push/send.ts`, `src/lib/actions/push.ts` | Web Push real vía VAPID (`web-push`) |
| PWA / offline | `src/app/manifest.ts`, `public/sw.js`, `/offline` | Instalable en el teléfono, con pantalla offline |

Tres módulos anclan el video: **Cursos**, **Eventos** y **Notificaciones push**.

---

## 2. Audiencia y objetivo

**Audiencia doble**, y las dos ven el mismo video:

1. **Defensa académica ante la profesora.** Evalúa rigor: que el problema esté bien
   planteado, que la solución sea coherente con él y que lo mostrado sea real y funcione.
   Le importa el *por qué* — la norma, la trazabilidad, las decisiones de diseño.
2. **Valentina Garrido, Product Owner de ONG Alumco.** Evalúa utilidad: si esto le sirve
   a su equipo, si el personal de turno lo va a usar desde el teléfono, si le resuelve la
   auditoría de SENAMA. Le importa el *qué* — qué se ve, qué se hace, cuánto cuesta
   operarlo.

**Objetivo:** que ambas entiendan **en 90 segundos** qué hace la plataforma y por qué
importa.

Esa doble audiencia impone una regla de tono: el video tiene que sostener el argumento
normativo (para la profesora) mostrando pantallas reales en uso (para la PO). Si se va a
lo abstracto pierde a Valentina; si se queda en el recorrido de UI pierde a la profesora.
Cada beat debería servir a las dos a la vez.

---

## 3. Respuestas al brief creativo (Fase 1)

| Pregunta del pipeline | Respuesta | Justificación |
| :--- | :--- | :--- |
| `mode` | `promo` | Es una pieza de presentación, no un tutorial ni un demo técnico |
| `product_surface` | `ui` | Se muestra la interfaz real de la plataforma |
| Duración | **90 s** | Techo duro: es el tiempo de atención de una defensa y de una reunión con la PO |
| Aspect ratio | **16:9, 1920×1080** | Proyección en sala y pantalla compartida |
| `theme` | Claro, derivado de la propia UI | La plataforma es de fondo claro (`#F5F5F5`) |
| Identidad visual | **Derivar desde screenshots. NO usar preset de marca ajena** | Ver nota abajo |
| `music_strategy` | `freesound`, **priorizando CC0** | CC0 evita la obligación de atribución en pantalla, que en 90 s cuesta caro. Requiere `FREESOUND_API_KEY`, hoy sin configurar |
| Voz | **PENDIENTE** | Ver nota abajo |

### Sobre la identidad visual

La paleta se deriva de las capturas, no de un preset. Razones concretas:

- La plataforma tiene **sus propios tokens** en `globals.css`, con la paleta Alumco
  (azul `#2B4FA0`, ámbar `#F5A623`, verde `#27AE60`, rojo `#E74C3C`).
- Existen **paletas con scope**: `.paleta-azul` (trabajador), `.paleta-oliva` (admin) y
  `.landing-page` redefinen tokens. La identidad no es única y plana: cambia según la
  vista que se esté grabando.
- Acaba de pasar por una **revisión de contraste WCAG 2.2 AA** con hallazgos cerrados.
  Importar un preset de marca ajena pisaría colores ya medidos y verificados, y podría
  reintroducir en el video justo lo que se corrigió en la plataforma.

### Sobre la voz — PENDIENTE

Decisión abierta entre dos rutas:

| Opción | A favor | En contra |
| :--- | :--- | :--- |
| **kokoro** (local) | Gratis, sin clave de API, sin enviar el guion a un tercero | Para español **requiere `espeak-ng`**, que hoy no está instalado. Calidad menor |
| **elevenlabs** | Calidad de voz superior | Requiere `ELEVENLABS_API_KEY` (hoy sin configurar) y envía el guion a un servicio externo |

Estado del entorno hoy: `espeak-ng` ausente, `ELEVENLABS_API_KEY` sin definir. **Ninguna
de las dos rutas está lista todavía**; hay que habilitar una antes de la Fase 5.

---

## 4. Arco narrativo propuesto

**Principio rector: una sola persona ficticia.** El video sigue a un único personaje a lo
largo de los tres módulos, en vez de recorrer pantalla por pantalla. Un catálogo de
funcionalidades no se recuerda; una persona haciendo su trabajo, sí. Además la doble
audiencia lo agradece: la profesora ve el flujo completo y coherente, y Valentina se ve a
sí misma y a su equipo en el personaje.

El arco encadena los tres módulos en una sola jornada verosímil:

1. **Completa un curso** — módulo Cursos, con su evaluación y su certificado.
2. **Recibe una tarea de un evento** — módulo Eventos, con secciones y encargados.
3. **Le llega la notificación al teléfono** — Web Push sobre la PWA instalada.

El cierre en el teléfono no es un adorno: es el argumento de que la plataforma alcanza al
personal donde efectivamente está, en turno y con el celular en el bolsillo.

### Los siete beats

> **PENDIENTE — a completar con el guion.** Los tiempos y el contenido exacto de cada
> beat salen de la sección 5, que todavía no tengo. Esta tabla queda lista para
> recibirlos; no la relleno con tiempos inventados porque el pipeline los usa como
> entrada real de la Fase 4 y un tiempo falso propaga error a las costuras.

| # | Beat | Tiempo | Módulo | Qué se ve |
| :--- | :--- | :--- | :--- | :--- |
| 1 | — | — | — | — |
| 2 | — | — | — | — |
| 3 | — | — | — | — |
| 4 | — | — | — | — |
| 5 | — | — | — | — |
| 6 | — | **70–84 s** | — | Ver advertencia en la sección 5 |
| 7 | — | — | Push / móvil | Notificación en el teléfono — captura `supplied` |

---

## 5. Guion de narración

> **PENDIENTE — falta el texto.** El guion se entrega aparte y aún no está en el
> repositorio. Al recibirlo se transcribe aquí beat por beat, literal, sin reescribir:
> el conteo de palabras depende de la redacción exacta y la Fase 5 lo usa para calzar la
> narración con los cortes.

| Beat | Tiempo | Narración | Palabras |
| :--- | :--- | :--- | :--- |
| 1 | — | — | — |
| 2 | — | — | — |
| 3 | — | — | — |
| 4 | — | — | — |
| 5 | — | — | — |
| 6 | 70–84 s | — | — |
| 7 | — | — | — |
| | | **Total** | **—** |

**Referencia de ritmo:** en español neutro, una locución cómoda va entre 2,2 y 2,5
palabras por segundo. Para 90 s el total debería caer aproximadamente entre **200 y 225
palabras**. Pasado ese techo la voz se acelera y el video se siente apurado — que es
justo el defecto que arruina una defensa.

### Advertencia sobre el beat 70–84 s

> **PENDIENTE — falta el contenido de la advertencia.** Se anota aquí en cuanto llegue
> junto con el guion.

Ese beat dura **14 segundos**, el tramo más largo del video si los otros seis se reparten
los 76 restantes. Un beat largo cerca del cierre es donde se pierde la atención, así que
conviene revisar que ahí ocurra algo — no solo que se diga algo.

---

## 6. Capturas necesarias

Tipos según el pipeline:

- **`screenshot`** — captura estática de una vista. Barata y nítida.
- **`screencast`** — grabación de una interacción real (clic, scroll, envío de formulario).
- **`supplied`** — material que el pipeline **no puede capturar** y que se entrega ya grabado.

| Superficie | Tipo | Por qué |
| :--- | :--- | :--- |
| Landing `/` | `screenshot` | Establece marca y contexto; es estática |
| `/cursos` — listado | `screenshot` | Vista de conjunto, sin interacción que aporte |
| `/cursos/[id]` — detalle | `screenshot` | Muestra estructura de módulos y plazo |
| `/cursos/[id]/modulos/[moduleId]` — reproductor | `screencast` | El avance del contenido solo se entiende en movimiento |
| Quiz — responder y aprobar | `screencast` | Es el momento de mayor tensión narrativa: selección, envío, resultado |
| `/mis-certificados` o `/certificado/[id]` | `screenshot` | El certificado es la prueba de cumplimiento; se lee mejor quieto |
| `/eventos/[id]` — secciones y tareas | `screencast` | Marcar una tarea como completada es la acción del beat |
| `/admin/dashboard` — cumplimiento | `screenshot` | Cierra el argumento normativo con datos |
| `/admin/reportes` (si entra en el corte final) | `screenshot` | Refuerza trazabilidad y exportación |
| **Notificación push en el teléfono** | **`supplied`** | **Grabación de pantalla de un celular real.** El pipeline controla Chrome de escritorio; no puede capturar ni la bandeja de notificaciones del sistema operativo móvil ni la PWA instalada. Hay que grabarlo a mano y entregarlo como archivo |

**Sobre el material `supplied`:** conviene grabarlo en vertical y decidir en Fase 4 cómo
entra en un lienzo 16:9 — dentro de un marco de teléfono, o con fondo desenfocado. Es una
decisión creativa y la responde una persona, no este documento.

La asignación definitiva de captura por número de beat se cierra cuando llegue el guion.

---

## 7. Restricciones de privacidad (reglas duras para Fase 2)

### Veredicto de datos — vinculante

La auditoría del entorno arrojó un **no**: la plataforma **no se puede grabar contra el
entorno actual**.

- El único proyecto Supabase activo de la organización es `eaodsaiwzhbgehhfnegj`, el de
  producción, y `alumcotest.vercel.app` apunta ahí (verificado indirectamente; queda
  pendiente confirmarlo con `vercel env ls`).
- Contiene **58 personas reales** con nombre completo y **RUT válido** (55 de 58 pasan la
  verificación de dígito verificador módulo 11), más 8 solicitudes pendientes de personas
  sin relación laboral confirmada.
- El dashboard y la vista de trabajadores **renderizan ese padrón completo**. Ambas están
  en el guion.

**Regla:** se graba contra un **entorno demo separado**, con datos ficticios, propio ref
de Supabase y propias llaves. Nunca contra producción.

**Verificación obligatoria antes de la primera captura:** abrir `/admin/trabajadores` y
confirmar que solo aparecen nombres ficticios. Si aparece **un solo nombre real**, el
entorno está mal apuntado y la grabación se detiene.

Datos de la auditoría que acotan el riesgo: no existe tabla de residentes ni datos de
salud de personas mayores en el esquema; el storage tiene un único objeto (una imagen de
prueba) y el bucket `event-documents` está vacío. La exposición es sobre el **personal**,
no sobre las personas mayores.

### Navegador de captura

- **Perfil de Chrome dedicado y desechable**, creado solo para esta grabación. Sin
  sesiones personales, sin extensiones, sin historial, sin gestor de contraseñas.
- **Solo pestañas de KimünKo abiertas.** Ninguna otra pestaña, ventana ni perfil. Una
  pestaña ajena puede colarse en un cambio de foco, en la barra de pestañas o en una
  miniatura.
- Limpiar antes de grabar: barra de marcadores oculta, notificaciones del sistema en
  silencio, sin banners de sesión de otras cuentas.

### Remote debugging

- El puerto de depuración remota **nunca se expone a la red**. Se enlaza a `127.0.0.1`
  exclusivamente; jamás a `0.0.0.0` ni a una IP de LAN.
- Un puerto de remote debugging abierto entrega **control total del navegador y de las
  sesiones activas** a cualquiera que lo alcance. En una red compartida es una puerta
  abierta a la sesión con la que se está grabando.
- Se cierra al terminar la captura. No queda levantado entre sesiones de trabajo.

### Higiene de la grabación

- Nada de claves, tokens ni `.env` en pantalla — tampoco en una terminal de fondo.
- La URL en la barra de direcciones delata el entorno: debe mostrar el dominio demo.
- Revisar el material antes de publicar. Un frame con un nombre real obliga a recortar o
  regrabar, y a esa altura sale caro.
