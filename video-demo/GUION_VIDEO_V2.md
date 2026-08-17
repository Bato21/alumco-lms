# Guion de video — v2

> Completa las secciones 4 y 5 de `docs/VIDEO_BRIEF.md`, hoy marcadas PENDIENTE.
> Basado en el corte v1 (90 s, 1920×1080, 30 fps, **sin pista de audio**).

---

## 1. Diagnóstico del corte v1

### Reparto del tiempo

| Bloque | Tiempo | Duración | % |
| :--- | :--- | ---: | ---: |
| Animación abstracta (papeles y carpetas) | 00:00–00:10 | 10,0 s | 11 % |
| Dashboard admin (zoom in → zoom out) | 00:10–00:19 | 8,5 s | 9 % |
| Mis cursos → detalle del curso | 00:19–00:26 | 7,0 s | 8 % |
| Evaluación (responder + enviar) | 00:26–00:36 | 10,0 s | 11 % |
| Resultado «¡Aprobado!» | 00:36–00:38 | 2,0 s | 2 % |
| Eventos — Fiestas Patrias (scroll) | 00:38–00:55 | 16,5 s | 18 % |
| Teléfono compuesto + push | 00:55–01:10 | 15,0 s | 17 % |
| Verificación pública del certificado | 01:10–01:24 | 14,5 s | 16 % |
| Cierre de marca | 01:24–01:30 | 5,5 s | 6 % |

**Lectura:** el 35 % del video son dos bloques casi estáticos (eventos y
verificación) y un 11 % es una animación sin mensaje. El módulo de cursos —el
corazón del producto— tiene 19 s y el panel ejecutivo apenas 8,5 s.

### Lo que no aparece

Landing `/` · login · `/admin/reportes` (filtros + exportar CSV) ·
`/admin/trabajadores` (activos / suspendidos / solicitudes) · `/admin/sedes` ·
constructor de cursos · campana de notificaciones · búsqueda global ·
«Ver como colaborador».

El brief ya listaba la landing como captura obligatoria («establece marca y
contexto») y `/admin/reportes` como opcional. Ninguna de las dos entró.

### Defectos visibles en pantalla

| # | Qué se ve | Dónde | Causa raíz |
| :--- | :--- | :--- | :--- |
| D1 | «sede_demo» en crudo en *Requieren seguimiento* | 00:16–00:19 | `sedeLabel()` en `admin/dashboard/page.tsx` mapea `sede_1`/`sede_2` y **devuelve el valor crudo** para cualquier otro. La cuenta demo vive en Sede Demo |
| D2 | *Cumplimiento por sede*: Hualpén ⚠ 0 % (0 trabajadores), Coyhaique ⚠ 0 % (0 trabajadores) | 00:16–00:19 | Misma causa: `sedeRows` sólo cuenta `sede_1`/`sede_2`, y el mundo demo no tiene a nadie ahí. Dos barras rojas al 0 % junto al KPI de 33 % |
| D3 | Todo en cero: «Hay 0 vencimientos este mes», Cursos vencidos 0, Aprobaciones pendientes 0, «No hay vencimientos próximos» | 00:11–00:19 | Semilla demo demasiado delgada. Un producto de cumplimiento cuya demo no muestra ningún riesgo se queda sin problema que resolver |
| D4 | «1 TRABAJADORES» | 00:16 | Etiqueta fija en plural en `heroStats`. Desaparece al sembrar n > 1, pero conviene pluralizar igual |
| D5 | El panel dice `sede_demo`, el certificado dice «Sede Hualpén» | 00:16 vs 01:16 | Contradicción entre el perfil demo y el dato estampado en el certificado |
| D6 | Sin locución, sin subtítulos, sin rótulos | todo el video | El archivo no tiene pista de audio. Hoy son 90 s de UI en silencio: el argumento normativo no se enuncia en ningún momento |

**D1–D3 son bloqueantes.** Están en el único plano que sostiene el argumento
ejecutivo y lo que comunican es «nadie usa esto».

---

## 2. Arco narrativo — dos personas, una cadena de evidencia

El brief v1 fijó «una sola persona ficticia». Lo ajusto a **dos, encadenadas**:
Camila (colaboradora, Hualpén) genera la evidencia; Marcela (administración) la
consume. Es la forma más corta de mostrar el lado ejecutivo sin convertir el
video en un recorrido de menús, y sirve a las dos audiencias en el mismo plano:
la profesora ve la trazabilidad completa, Valentina se ve a sí misma y a su
equipo.

La cadena es: **acción → registro inmutable → certificado → reporte agregado →
verificación externa.**

### Los siete beats

| # | Beat | Tiempo | Módulo | Qué se ve |
| :--- | :--- | :--- | :--- | :--- |
| 1 | El contexto y el papel | 00:00–00:08 | Landing `/` | Hero de la landing, scroll suave hasta Valores; disolvencia a la animación de papeles (3 s, no 10) |
| 2 | El estado del cumplimiento | 00:08–00:18 | `/admin/dashboard` | Saludo con vencimientos del mes, KPI de cumplimiento, *Cumplimiento por sede* con Hualpén y Coyhaique poblados, *Requieren seguimiento* |
| 3 | La capacitación real | 00:18–00:31 | `/cursos/[id]` + quiz | Camila abre «Técnicas de movilización y traslado seguro», responde la evaluación, envía, aprueba |
| 4 | La prueba | 00:31–00:38 | Certificado | El PDF se emite solo, con la firma de la dirección y la de la trabajadora |
| 5 | El panel ejecutivo | 00:38–00:51 | `/admin/reportes` | Filtro por sede y por área, estados «En riesgo», clic en **Exportar CSV** y el archivo cayendo |
| 6 | La operación diaria | 00:51–01:07 | `/admin/eventos` + teléfono | Secciones y encargados de Fiestas Patrias, se asigna una tarea, corte al teléfono real: la notificación entra |
| 7 | La fiscalización | 01:07–01:23 | `/certificados/verificar/[codigo]` | Se **escribe** el folio, la página resuelve, aparece el verde «CERTIFICADO VÁLIDO» |
| — | Cierre | 01:23–01:30 | Marca | Logo Alumco + KimünKo + `kimunko.vercel.app` |

Notas de ritmo:

- El beat 7 vuelve a durar ~16 s, el más largo. El brief avisaba que un beat
  largo cerca del cierre pierde atención **si ahí no ocurre nada**. Por eso el
  folio ahora se teclea en cámara en vez de aparecer resuelto: el plano tiene
  acción durante los primeros 6 s y el verde llega como resolución.
- Eventos baja de 16,5 s a ~8 s (la mitad del beat 6). Hoy son tres scrolls
  sobre la misma vista.
- La animación de papeles baja de 10 s a 3 s y pasa a ser transición, no
  apertura. Abrir en la landing establece que ONG Alumco existe antes de que
  exista el software — que es justo lo que la profesora necesita para evaluar si
  la solución responde al problema.

---

## 3. Guion de narración

Ritmo objetivo: 2,2–2,5 palabras/segundo. Total **173 palabras** sobre 90 s
≈ 79 s de locución y ~11 s de silencio deliberado, concentrado en la llegada
del push y en el cierre. Queda bajo el techo de 200–225 que fija el brief
porque ese rango asume narración de pared a pared, y aquí dos momentos tienen
que respirar.

| Beat | Tiempo | Narración | Palabras |
| :--- | :--- | :--- | ---: |
| 1 | 00:00–00:08 | ONG Alumco cuida a personas mayores en dos residencias. Su capacitación vivía en papel. | 14 |
| 2 | 00:08–00:18 | KimünKo la convierte en un solo tablero: cumplimiento por sede, plazos que vencen y quién está atrasado. Todo al día de hoy. | 22 |
| 3 | 00:18–00:31 | Camila trabaja en Hualpén. Entra desde su turno, completa el módulo de movilización segura y rinde la evaluación. Cada intento queda registrado y no se puede editar. | 27 |
| 4 | 00:31–00:38 | Al aprobar, la plataforma emite el certificado firmado por la dirección y por la propia trabajadora. | 16 |
| 5 | 00:38–00:51 | Ese mismo dato sube al reporte de cumplimiento. La administración filtra por sede y por área, ve quién está en riesgo y exporta la planilla que pide el directorio. | 29 |
| 6 | 00:51–01:07 | La plataforma también coordina el trabajo del día: secciones, encargados y tareas para las Fiestas Patrias. Cuando se asigna una tarea, la notificación llega al teléfono del turno. | 28 |
| 7 | 01:07–01:23 | Y cuando llega la fiscalización, el folio del certificado se verifica desde cualquier navegador, sin cuenta y sin pedirle nada a la ONG. La trazabilidad es el producto. | 28 |
| — | 01:23–01:30 | KimünKo. Sabiduría del agua. Capacitación que se puede demostrar. | 9 |
| | | **Total** | **173** |

### Rótulos en pantalla

El video se va a proyectar en sala. Si el audio falla o se escucha bajo, hoy no
queda nada. Dos capas de texto, ambas quemadas en el render:

- **Subtítulos permanentes** con el texto exacto de la tabla de arriba.
- **Rótulo de beat** abajo a la izquierda, 2 s por beat, tipografía de la marca:
  `01 · El problema` — `02 · Cumplimiento` — `03 · Capacitación` —
  `04 · Certificación` — `05 · Reportes` — `06 · Operación diaria` —
  `07 · Fiscalización`.

Sobre el beat 6, un rótulo adicional al aparecer el teléfono:
`PWA instalada · Web Push` — porque en pantalla el teléfono se ve como una
imagen y hay que dejar claro que es la app corriendo, no un mockup.

---

## 4. Capturas

| Superficie | Tipo | Estado |
| :--- | :--- | :--- |
| Landing `/` — hero + scroll a Valores | `screencast` | **Nueva** |
| `/admin/dashboard` | `screenshot` + micro-scroll | **Re-grabar** tras corregir D1–D3 |
| `/cursos/[id]` + evaluación + aprobación | `screencast` | Reutilizable de v1 (00:19–00:38) |
| Certificado emitido | `screenshot` | **Nueva** — v1 nunca muestra el PDF, sólo la página de verificación |
| `/admin/reportes` — filtros + Exportar CSV | `screencast` | **Nueva** |
| `/admin/eventos` — secciones y asignación de tarea | `screencast` | Recortar v1 a ~8 s + grabar el clic de asignación |
| Teléfono con la notificación | `supplied` | **Re-grabar con equipo real.** En v1 es un marco compuesto. Grabar vertical: ícono de la PWA en el escritorio → abrir → la notificación entrando en la bandeja del sistema |
| `/certificados/verificar/[codigo]` | `screencast` | **Re-grabar** tecleando el folio |
| Cierre de marca | — | Reutilizable de v1 |

El plano de dos equipos (notebook + teléfono en el mismo cuadro, la
notificación llegando en vivo) es el único momento del video que no se puede
falsificar y el que más convence a Valentina. Vale la sesión de grabación.

---

## 5. Bloqueantes antes de filmar

### 5.1 El mundo demo no sirve para filmar el dashboard

La burbuja demo aísla por **Sede Demo** —necesario para que los eventos del
colaborador demo queden separados vía `user_sede()`—, pero el dashboard
argumenta justamente lo contrario: comparación Hualpén vs. Coyhaique con
volumen. Las dos cosas no pueden ser ciertas a la vez, y por eso salen las
barras en 0 %.

Tres caminos, hay que elegir uno antes de re-grabar:

| Camino | A favor | En contra |
| :--- | :--- | :--- |
| **A. Semilla de filmación** — perfiles `is_demo = true` repartidos entre `sede_1` y `sede_2`, más Camila | El dashboard se puebla sin tocar producción | Camila necesita Sede Demo para ver eventos → hay que decidir si aparece en el panel o no |
| **B. Filmar contra una branch de Supabase** con datos realistas | Libertad total, cero riesgo sobre el mundo demo compartido | Hay que provisionar la branch y sembrarla |
| **C. Mapear la etiqueta** — `sedeLabel()` devuelve «Hualpén» para la sede demo | Una línea de código | Corrige D1 pero no D2 ni D3; el dashboard sigue vacío |

Recomendación: **B**, y si no alcanza el tiempo, **A**. C sola no arregla el
plano.

Cualquiera que sea el camino: migración vía `apply_migration`, script de
rollback escrito **antes**, y `reset_demo_world()` actualizada si se toca la
semilla.

### 5.2 Cifras a sembrar

El dashboard necesita tensión, no perfección. Valores sugeridos:

- 12 trabajadores · cumplimiento global 71 %
- Hualpén 82 % (7 trabajadores) · Coyhaique 54 % (5 trabajadores)
- 3 cursos vencidos · 2 aprobaciones pendientes · 2 trabajadores bajo 50 %
- Al menos un vencimiento próximo con plazo a menos de 14 días

Con eso el titular pasa de «Hay 0 vencimientos este mes» —que le quita al
producto su razón de existir— a un número que justifica todo lo que viene
después.

### 5.3 Correcciones de código menores

- Pluralizar la etiqueta de `heroStats`: `trabajador${n !== 1 ? 'es' : ''}`.
- Revisar que el folio que se teclea en el beat 7 exista y resuelva en verde
  (en v1 hubo que forzar `is_demo = false` sobre el certificado filmado, con
  rollback obligatorio: repetir el procedimiento y **anotar el rollback antes**).

---

## 6. Checklist antes del render final

- [ ] Banner amarillo de modo demo oculto (`NEXT_PUBLIC_OCULTAR_BANNER_DEMO`)
- [ ] Ninguna cadena `sede_demo`, `sede_1` ni `sede_2` visible en pantalla
- [ ] Ninguna barra de cumplimiento en 0 % con 0 trabajadores
- [ ] Sedes escritas exactamente «Hualpén» y «Coyhaique» — no existe una tercera
- [ ] Fecha del evento: 18 de septiembre de 2026
- [ ] El folio del certificado verificado resuelve en verde
- [ ] La sede del certificado coincide con la sede del perfil en el dashboard
- [ ] Subtítulos quemados y legibles a 1920×1080 proyectado
- [ ] Locución resuelta (`espeak-ng` para kokoro, o `ELEVENLABS_API_KEY`)
- [ ] Música CC0 desde Freesound (`FREESOUND_API_KEY`)
- [ ] Duración final ≤ 90 s
- [ ] Rollback de cualquier cambio de datos ejecutado después de grabar

---

## 7. Fuera de este corte

No entran, y es deliberado: constructor de cursos, gestión de solicitudes,
búsqueda global, tema de alto contraste, agente de IA, módulo de cumplimiento
normativo. Son argumentos de la presentación oral y del roadmap, no del video.
Noventa segundos sostienen siete ideas; con doce no se recuerda ninguna.

El tema de alto contraste y la auditoría WCAG AA merecen una lámina propia en
la defensa: es un diferenciador real y en el video se perdería.
