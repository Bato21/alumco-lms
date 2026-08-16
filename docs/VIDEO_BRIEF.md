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

Guion definitivo. Los nombres coinciden con el seed aplicado el 2026-08-16
(Camila Fuentes Ortega, auxiliar de enfermería; sede "Hualpén").

| # | Tiempo | Imagen | Voz en off | Palabras |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 0-10 s | Planillas, correos, carpetas físicas | En un ELEAM, cada trabajador debe cumplir horas de capacitación obligatoria al año. Hoy eso vive en planillas, correos y papeles sueltos. | 22 |
| 2 | 10-20 s | Logo → dashboard → sede | KimünKo reúne todo en un solo lugar: capacitación, coordinación y seguimiento, para las dos sedes de ONG Alumco. | 18 |
| 3 | 20-38 s | Login Camila → cursos → "Técnicas de movilización" → quiz → avance actualizado | Camila es auxiliar de enfermería en Hualpén. Entra y ve los cursos asignados a su rol. Revisa el material, responde la evaluación, y su avance queda registrado al instante. Sin planillas, sin recordatorios manuales. | 34 |
| 4 | 38-54 s | Admin: Fiestas Patrias 2026, cuatro secciones, tareas con fecha | Llega septiembre. La administradora arma la celebración por sede: secciones, encargados y tareas con fecha. Las restricciones alimentarias quedan visibles antes de comprar. | 23 |
| 5 | 54-70 s | **PLANO FÍSICO**: notebook + teléfono sobre la mesa, misma tarea | La administradora asigna desde el computador. A Camila le llega al teléfono — es la misma plataforma, instalada como app, sin bajar nada de ninguna tienda. | 25 |
| 6 | 70-84 s | `/certificados/verificar/D3N9MPFVPEXC` | Cuando completa un curso se emite un certificado con folio verificable. Un fiscalizador puede comprobarlo desde su propio teléfono, sin cuenta y sin pedirle nada a nadie. | 27 |
| 7 | 84-90 s | Placa final: logo, URL, equipo | KimünKo. Sabiduría del agua. | 4 |
| | **90 s** | | **Total** | **153** |

### Ritmo — hay aire de sobra

**153 palabras en 90 s = 1,70 palabras por segundo.** En español neutro una locución
cómoda va entre 2,2 y 2,5 pal/s, así que el guion queda **por debajo del rango**: no hay
riesgo de que la voz suene apurada, y sobra margen para pausas y para que la imagen
respire. Desglose:

| Beat | pal/s | Lectura |
| :--- | :--- | :--- |
| 1 | 2,20 | El más apretado. Es el único que roza el límite cómodo |
| 3 | 1,89 | Holgado pese a ser el beat más largo de texto |
| 6 | 1,93 | Holgado |
| 2 · 4 · 5 | 1,80 · 1,44 · 1,56 | Muy holgados |
| 7 | 0,67 | Placa final: la lentitud es deliberada |

Solo el beat 1 exige dicción firme. El resto admite pausas sin recortar nada.

### Advertencia sobre el beat 70-84 s

Son **14 segundos sobre una página estática** — la verificación pública del certificado.
Es el tramo más largo del video después del beat 3, y el único en el que **no pasa nada
en pantalla**: no hay clic, ni scroll, ni transición de vista.

A 14 segundos, un plano fijo se siente muerto y es donde se pierde la atención justo
antes del cierre. Hay que darle movimiento en Fase 4 sin cambiar de página: un zoom lento
sobre el folio, la aparición escalonada de los campos (titular, curso, fecha, sede), o el
plano del teléfono escaneando el QR y la página resolviéndose. **La decisión es creativa y
la responde una persona**, pero el beat no puede quedarse quieto los 14 segundos.

Además, este beat es el que exige la ventana del certificado
(`scripts/ventana-certificado.sql`): sin voltear `is_demo` la página muestra "Certificado
de demostración" en beige, no la de certificado válido.

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
| **Beat 5 (54-70 s) — notebook + teléfono sobre la mesa** | **`supplied`** | **Grabación física con cámara**, no captura de pantalla. Es un plano de dos dispositivos a la vez: el pipeline controla Chrome de escritorio y no puede filmar una mesa. Hay que grabarlo y entregarlo como archivo |
| **Beat 6 (70-84 s) — `/certificados/verificar/D3N9MPFVPEXC`** | **`supplied`** | Se captura **fuera del pipeline**, durante la ventana de `scripts/ventana-certificado.sql`: la UI de "Certificado válido" solo existe mientras `is_demo = false`, y esa ventana dura minutos. Automatizarlo dentro del pipeline obligaría a mantener la bandera volteada toda la producción |

### Asignación por beat

| Beat | Tiempo | Tipo |
| :--- | :--- | :--- |
| 1 | 0-10 s | `supplied` o material de archivo (planillas, carpetas físicas) |
| 2 | 10-20 s | `screenshot` (logo, dashboard, sede) |
| 3 | 20-38 s | `screencast` — login, listado, módulo, quiz, avance |
| 4 | 38-54 s | `screencast` — evento con sus cuatro secciones |
| 5 | 54-70 s | **`supplied`** — grabación física |
| 6 | 70-84 s | **`supplied`** — ventana del certificado |
| 7 | 84-90 s | Composición en Fase 4, sin captura |

**Sobre el material `supplied`:** el del beat 5 conviene grabarlo con el encuadre ya
pensado para 16:9, porque es un plano físico y no se puede recomponer después. El del beat
6 es una página de escritorio y entra directo. Cómo se integran —marco de teléfono, fondo
desenfocado, zoom— es decisión creativa y la responde una persona, no este documento.

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

---

## 8. Checklist de producción y reversión

Estado del ambiente demo durante la grabación. **Todo lo marcado como REVERTIR
vuelve a su estado normal al terminar**; mientras no se revierta, la plataforma
está en un estado preparado para cámara, no en su estado real.

### Antes de grabar

- [x] Cron `reset-demo-world` **desactivado** (hecho el 2026-08-16). Si estuviera
      activo borraría el contenido de cámara en menos de 6 horas (`0 */6 * * *`).
- [ ] `NEXT_PUBLIC_MODO_GRABACION='true'` **y deploy hecho** (ver aviso abajo).
- [ ] Verificar en `/admin/trabajadores` que solo aparecen nombres ficticios. Si
      aparece un solo nombre real, el entorno está mal apuntado: detener.
- [ ] Notificaciones push reactivadas en el dispositivo de grabación desde
      Mi perfil (el cron las borra; hay que volver a activarlas tras desactivarlo).

### Dominio de grabación: `kimunko.vercel.app`

**No grabar en `alumcotest.vercel.app`.** Ese deploy sirve una rama de julio
(`testandy` / `deploytestvercel`): devuelve `307 → /login` tanto en
`/certificados/verificar/…` como en `/reset-password`, porque le faltan los
commits que abrieron esas rutas. Filmar ahí significa filmar una versión sin la
verificación pública de certificados, sin restablecimiento de contraseña, sin las
correcciones de accesibilidad y **sin la bandera `NEXT_PUBLIC_MODO_GRABACION`**.

`kimunko.vercel.app` sirve `main` y está verificado: resuelve
`/certificados/verificar/D3N9MPFVPEXC` con los datos del seed (Camila Fuentes
Ortega, "Prevención y manejo de caídas en adultos mayores"), lo que confirma
además que apunta al proyecto Supabase `eaodsaiwzhbgehhfnegj`.

> **Pendiente de confirmar a mano:** a qué apunta `NEXT_PUBLIC_SITE_URL` en el
> proyecto Vercel. Importa porque `verificationUrl()`
> (`src/lib/certificates/verify.ts:98-103`) construye con esa variable **la URL que
> va dentro del QR del PDF del certificado**, con fallback a
> `https://kimunko.vercel.app`. Si apunta a `alumcotest`, el QR del certificado
> lleva a un deploy que redirige a login. Comprobar con `vercel env ls`.

### Rutas a revisar a ojo antes de grabar

Base: `https://kimunko.vercel.app`. Credenciales demo en
`src/components/alumco/auth/LoginForm.tsx:14-15` (botones de acceso directo en el
login).

**Vista trabajadora — sesión de Camila**

| Beat | URL | Qué verificar |
| :--- | :--- | :--- |
| 3 | `/login` | Los dos botones de acceso demo funcionan |
| 2-3 | `/inicio` | Portada con su nombre y sede "Hualpén" |
| 3 | `/cursos` | **Tres** cursos: uno completo, uno al 2/3, uno sin iniciar |
| 3 | `/cursos/b0645620-d04f-4d0a-8fa1-483de5bf1207` | Detalle del curso 2: video ✓, texto ✓, quiz pendiente |
| 3 | `/cursos/b0645620-d04f-4d0a-8fa1-483de5bf1207/modulos/0a5ff306-9bc2-4126-a28c-29a891a7f4c4` | Video de movilización carga (no el rickroll) |
| 3 | `/cursos/b0645620-d04f-4d0a-8fa1-483de5bf1207/modulos/e350542e-3641-436b-8f57-5da3fb873d87` | Módulo de texto renderiza el protocolo |
| 3 | `/cursos/b0645620-d04f-4d0a-8fa1-483de5bf1207/modulos/08e7998b-2229-435d-935d-a603dd22c1de/quiz` | **El quiz por rendir.** No tocar hasta la toma real |
| — | `/mis-certificados` | Un certificado, del curso de caídas |
| 4-5 | `/eventos/7cb8c686-eafb-4653-a6a2-ecac7823ef33` | Cuatro secciones, tareas asignadas a Camila |

**Vista administradora — sesión de Marcela**

| Beat | URL | Qué verificar |
| :--- | :--- | :--- |
| 2 | `/admin/dashboard` | Métricas del mundo demo, sin nombres reales |
| 4 | `/admin/eventos/7cb8c686-eafb-4653-a6a2-ecac7823ef33` | Cuatro secciones, 13 tareas, documento de restricciones visible y descargable |
| — | `/admin/cursos` | Tres cursos demo |
| **⚠️** | `/admin/trabajadores` | **Verificación obligatoria previa: solo deben aparecer Camila y Marcela.** Un solo nombre real → detener la grabación |
| — | `/admin/reportes` | Solo si entra en el corte final |

**Público, sin sesión**

| Beat | URL | Qué verificar |
| :--- | :--- | :--- |
| 6 | `/certificados/verificar/D3N9MPFVPEXC` | Con la ventana abierta: "Certificado válido" en verde y sede "Hualpén" |

#### Rutas que NO se graban

| Ruta | Motivo |
| :--- | :--- |
| `/admin/sedes` | **BUG-71.** No filtra por `is_demo`: la cuenta demo ve las sedes reales de ONG Alumco y además las de prueba acumuladas ("Hua", "Nueva sede", "Sede de prueba", "Sede Concepción"). Delata el entorno y se ve descuidado |
| `/perfil` | Muestra el correo `demo-colab@kimunko.demo`, que revela que la cuenta es de demostración |
| `/admin/perfil` | Igual, con `demo-admin@kimunko.demo` |

> **Nota sobre el PDF de restricciones alimentarias.** El archivo vive en
> `public/demo/restricciones-alimentarias.pdf` y **requiere sesión**: el matcher
> del middleware (`src/proxy.ts:13`) excluye `svg|png|jpg|…` pero **no `pdf`**, así
> que un `.pdf` sin sesión recibe `307 → /login`. Dentro de la app, con la cuenta
> demo iniciada, descarga normalmente. Verificarlo en el paso previo a grabar el
> beat 4.

### ⚠️ La bandera de grabación necesita deploy, no basta con recargar

`NEXT_PUBLIC_MODO_GRABACION` es una variable `NEXT_PUBLIC_*`: Next.js la
**incrusta en el bundle durante el build**, no la lee en cada request. Por lo
tanto:

- **Al activarla**: definirla en Vercel y **redesplegar**. Refrescar la página,
  cerrar sesión o limpiar caché **no cambia nada** — el valor viejo sigue
  compilado en el JS servido.
- **Al revertirla**: borrarla (o dejarla en cualquier valor distinto de `'true'`)
  y **redesplegar otra vez**. Quitarla del panel de Vercel sin redeploy deja el
  banner oculto en producción por tiempo indefinido, que es exactamente el estado
  peligroso: una persona con cuenta demo creyendo que trabaja sobre datos
  permanentes.
- En local, reiniciar `npm run dev`.

Regla práctica: **la reversión no está hecha hasta que el deploy termina y se
verifica el banner en pantalla con una cuenta demo.**

### Después de grabar — REVERTIR

#### Bloque A — Revisar primero: dejan rastro **fuera** de la burbuja demo

| # | Qué | Cómo | Por qué importa |
| :--- | :--- | :--- | :--- |
| 1 | Certificado filmado en `is_demo = false` | `scripts/ventana-certificado.sql` PASO 2 | Aparece en `/admin/certificados` y en el gráfico del dashboard del admin **real**, y el cron no lo limpia nunca |
| 2 | `NEXT_PUBLIC_MODO_GRABACION` | Borrar la variable **+ redeploy** | Devuelve dos cosas a la vez: el banner de MODO DEMO y el rótulo "Demostración" de la sede en la verificación pública |
| 3 | Sede Demo renombrada a "Hualpén" | `scripts/rollback-seed-demo.sql` § 3 | Ver aviso abajo |

**Por qué la sede va en este bloque y no con el resto.** Mientras se llame
"Hualpén" convive con la sede real "Sede Hualpén" (`sede_1`), y lo único que
impide que aparezca como opción asignable en el desplegable de
`/admin/trabajadores` es que tenga `activa = false` — no un filtro de scope
(BUG-72). Esa bandera la puede cambiar cualquier admin desde `SedesClient`, sin
advertencia y con una acción perfectamente legítima. Si eso pasa mientras el
nombre sigue cambiado, un admin real puede asignar a un trabajador real a la sede
demo. Es rastro fuera de la burbuja, no dentro.

#### Bloque B — Lo cubre `scripts/rollback-seed-demo.sql` en una sola pasada

| # | Qué | Sección del archivo |
| :--- | :--- | :--- |
| 4 | Contenido demo de cámara → set original con sus UUID | § 4 |
| 5 | `reset_demo_world()` → definición previa (**no se modificó**, ver abajo) | § 5 |

#### El cron NO se reactiva

`reset-demo-world` **queda desactivado a propósito y así se deja.** No es un paso
pendiente del checklist: es el estado correcto hasta que se resuelva **BUG-73**.

La función `reset_demo_world()` está rota desde el 2026-07-23: su
`delete from quiz_attempts where is_demo` es un no-op silencioso —la regla
`no_delete_attempts` lo anula— y el `delete from courses` posterior choca contra
la FK del intento que sobrevive. **93 corridas fallidas consecutivas** entre el
2026-07-24 y el 2026-08-16, todas con rollback completo. Reactivar el cron hoy no
repone nada: solo vuelve a fallar cada 6 horas.

Por eso esta producción **no modificó la función** (se descartó el Ajuste B: su
premisa era poder reactivar el cron después de grabar, y esa premisa no se
sostiene). La sección § 5 del rollback existe solo como red de seguridad; si la
función no se tocó, restaurarla es un no-op inofensivo.

> Consecuencia colateral favorable: mientras el cron siga apagado, **las
> suscripciones push de las cuentas demo no se borran**. Es lo que hace que el
> beat de la notificación se pueda grabar. Cuando BUG-73 se resuelva y el cron
> vuelva, el primer ciclo borrará esas suscripciones — comportamiento esperado, no
> un bug.
