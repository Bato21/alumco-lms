---
format: 1920x1080
duration: 90s
message: KimünKo convierte la capacitación obligatoria de un ELEAM en evidencia auditable, y alcanza al personal en el teléfono que ya lleva encima.
arc: Dolor → Plataforma → Jornada → Prueba → Cierre
audience: la profesora de la defensa académica (evalúa rigor y trazabilidad) y Valentina Garrido, Product Owner de ONG Alumco (evalúa utilidad para personal de turno)
content_mode: promo
theme: light
renderer: HyperFrames
product_surface: ui
emotional_journey: desorden → reconocimiento → alivio → confianza
capture_plan: 6 bound artifacts
web_capture_source: navigate
---

## Frame 1 — El papeleo

- status: outline
- src: scenes/00-papeleo.html
- duration: 10s
- scene: planillas, correos y carpetas físicas se cierran sobre el centro del cuadro
- voiceover: "En un ELEAM, cada trabajador debe cumplir horas de capacitación obligatoria al año. Hoy eso vive en planillas, correos y papeles sueltos."
- poster: 6s
- window: 0s → 10s
- screenshot: none — material físico suministrado
- capture: supplied
- clip: public/clips/scene-00-papeleo.mp4
- goal: el espectador reconoce su propio desorden administrativo antes de que aparezca ninguna plataforma
- abstraction: literal
- complexity: atomic
- tone: desorden
- energy: build
- density: dense
- camera: push-in
- metaphor: Pain / overwhelm
- blueprint: overwhelm-surround
- capabilities: timeline-choreography

Abre sobre una sola carpeta abierta y la cámara empuja hacia el centro mientras el resto del
material entra por los bordes: primero las planillas impresas, después los correos, al final las
carpetas apiladas. Ese es el orden de exposición que exige la densidad alta — el ojo lee un
documento, luego el volumen, nunca los tres a la vez. El encierro es el argumento: a los diez
segundos el centro del cuadro está tapado, que es exactamente lo que se siente al preparar una
fiscalización con este método. Sin gráficos ni cifras inventadas: solo el material real.

## Frame 2 — La plataforma

- status: outline
- src: scenes/01-plataforma.html
- duration: 10s
- transition_in: zoom-through
- transition_speed: medium
- scene: el logo se resuelve y la cámara retrocede hasta descubrir el dashboard completo
- voiceover: "KimünKo reúne todo en un solo lugar: capacitación, coordinación y seguimiento, para las dos sedes de ONG Alumco."
- poster: 6s
- window: 10s → 20s
- screenshot: public/screenshots/scene-01-dashboard.png
- capture: screenshot
- goal: el espectador entiende que existe un único lugar donde vive todo lo que acaba de ver disperso
- abstraction: literal
- complexity: compound
- tone: reconocimiento
- energy: peak
- density: composed
- camera: pull-out
- metaphor: none — real product
- blueprint: zoom-out-workspace-reveal
- capabilities: timeline-choreography

El zoom-through del beat anterior aterriza dentro del logotipo, que se sostiene un instante solo
en el cuadro. Desde ahí la cámara retrocede en un movimiento continuo y el logo resulta ser el
encabezado del dashboard real. El retroceso es la respuesta formal al empuje del beat 1: aquello
se cerraba, esto se abre. Al final del movimiento se sostienen tres elementos y nada más — el
título, el bloque de cumplimiento y el próximo evento. La captura es real; nada de lo que se lee
en pantalla se redibuja.

## Frame 3 — La jornada de Camila

- status: outline
- src: scenes/02-camila.html
- duration: 18s
- transition_in: zoom-through
- transition_speed: medium
- scene: Camila entra, abre su curso, rinde la evaluación y ve su avance actualizado
- voiceover: "Camila es auxiliar de enfermería en Hualpén. Entra y ve los cursos asignados a su rol. Revisa el material, responde la evaluación, y su avance queda registrado al instante. Sin planillas, sin recordatorios manuales."
- poster: 10s
- window: 20s → 38s
- screenshot: none — el beat es movimiento, va como clip
- capture: screencast
- clip: public/clips/scene-02-camila.mp4
- captions: auto
- goal: el espectador ve que el registro del cumplimiento es una consecuencia automática del trabajo de la persona, no una tarea aparte
- abstraction: literal
- complexity: compound
- tone: alivio
- energy: build
- density: composed
- camera: follow
- metaphor: none — real product
- motion: `camera-cursor-tracking`, `viewport-change`
- capabilities: timeline-choreography, ui-micro-motion

El beat más largo del video y el único que sigue una acción completa de principio a fin. La cámara
no recorre la pantalla: sigue al cursor, que es el actor. Un solo movimiento deliberado repartido
a lo largo de los dieciocho segundos — adelantarlo es el fallo de PowerPoint. El encuadre se cierra
un poco al llegar a la evaluación y se abre al aparecer el avance actualizado, que es el único
momento en que aparece un número, y es un número real leído de la plataforma.

⚠️ Esta toma consume uno de los **tres intentos** del quiz, y `quiz_attempts` es inmutable: no se
puede borrar ni corregir. Se graba **de una sola vez y la última** entre las tomas de Camila
(`GUIA_GRABACION.md` § 1).

## Frame 4 — La administradora arma el evento

- status: outline
- src: scenes/03-evento.html
- duration: 16s
- transition_in: crossfade
- transition_speed: medium
- scene: las cuatro secciones de Fiestas Patrias 2026, con encargados y tareas fechadas
- voiceover: "Llega septiembre. La administradora arma la celebración por sede: secciones, encargados y tareas con fecha. Las restricciones alimentarias quedan visibles antes de comprar."
- poster: 9s
- window: 38s → 54s
- screenshot: none — el beat es movimiento, va como clip
- capture: screencast
- clip: public/clips/scene-03-evento.mp4
- captions: auto
- goal: el espectador entiende que la plataforma coordina trabajo real entre personas, no solo entrega videos
- abstraction: literal
- complexity: compound
- tone: alivio
- energy: calm
- density: composed
- camera: pan
- metaphor: none — real product
- blueprint: spatial-pan-stations
- capabilities: timeline-choreography

Un recorrido lateral por las cuatro secciones, que existen una al lado de la otra en la misma
página: la cámara conserva un solo mapa mental en vez de cortar entre vistas. El ritmo es
procedimental a propósito — este beat es el descanso entre el pico del beat 3 y el del beat 6.
Se detiene una vez, sobre el documento de restricciones alimentarias, porque es el detalle que
convierte la coordinación en algo concreto: aparece antes de comprar, no después.

⚠️ Nadie marca tareas fuera de esta toma. El tablero está compuesto en 4/13 y no hay deshacer en
la interfaz.

## Frame 5 — Del computador al bolsillo

- status: outline
- src: scenes/04-dos-dispositivos.html
- duration: 16s
- transition_in: crossfade
- transition_speed: medium
- scene: plano físico de notebook y teléfono sobre la mesa; la misma tarea aparece en los dos
- voiceover: "La administradora asigna desde el computador. A Camila le llega al teléfono — es la misma plataforma, instalada como app, sin bajar nada de ninguna tienda."
- poster: 9s
- window: 54s → 70s
- screenshot: none — grabación física suministrada
- capture: supplied
- clip: public/clips/scene-04-dos-dispositivos.mp4
- goal: el espectador entiende que la plataforma alcanza al personal en turno, en el teléfono que ya lleva encima
- abstraction: literal
- complexity: atomic
- tone: confianza
- energy: build
- density: focal
- camera: rack-focus
- metaphor: none — real product
- motion: `depth-of-field-blur`, `viewport-change`
- capabilities: timeline-choreography, spatial-depth

Los dos dispositivos conviven en el mismo plano y el foco viaja del uno al otro sin que la cámara
se mueva: primero el notebook, nítido, mientras el teléfono espera desenfocado en primer plano;
cuando la notificación llega, el foco salta. Ese salto **es** el argumento del beat, y por eso no
se resuelve con un corte: un corte diría "otra escena", el rack-focus dice "el mismo momento, el
mismo sitio". Un solo elemento importa en cada mitad del beat.

⚠️ Plano físico con cámara — el pipeline controla Chrome de escritorio y no puede filmar una mesa.
Encuadrarlo pensado para 16:9 desde la toma: no se puede recomponer después.

## Frame 6 — El folio verificable

- status: outline
- src: scenes/05-certificado.html
- duration: 14s
- transition_in: zoom-through
- transition_speed: medium
- scene: la verificación pública del certificado; los campos se revelan escalonados sobre el folio
- voiceover: "Cuando completa un curso se emite un certificado con folio verificable. Un fiscalizador puede comprobarlo desde su propio teléfono, sin cuenta y sin pedirle nada a nadie."
- poster: 8s
- window: 70s → 84s
- screenshot: public/screenshots/scene-05-certificado-valido.png
- capture: supplied
- goal: el espectador entiende que la evidencia es comprobable por un tercero sin intermediarios, que es lo que la vuelve auditable
- abstraction: literal
- complexity: atomic
- tone: confianza
- energy: peak
- density: composed
- camera: push-in
- metaphor: none — real product
- motion: `coordinate-target-zoom`, `waterfall-entry`
- capabilities: timeline-choreography
- runtime_rejected: html-in-canvas — se consideró para dar peso monumental a un beat de página fija, pero la derivación no arroja `cinematic-hero` y GSAP sirve todas las capacidades del cuadro (prior 3a, GSAP-first)

Catorce segundos sobre una página que no se mueve sola: el movimiento hay que ponerlo, y sin
cambiar de página. La cámara empuja lentamente hacia el folio, que no está centrado, mientras los
campos aparecen en cascada en el orden en que un fiscalizador los leería — titular, curso, fecha,
sede — y el folio queda último, sostenido. La quietud previa al empuje es deliberada: es lo que
hace que el movimiento se note en un plano fijo.

⚠️ Exige la ventana de `scripts/ventana-certificado.sql`. Con `is_demo = true` la página muestra
"Certificado de demostración" en beige y no la de certificado válido. La ventana se abre justo
antes de esta captura y se cierra después (`VIDEO_BRIEF.md` § 8, bloque A).

## Frame 7 — Placa final

- status: outline
- src: scenes/06-cierre.html
- duration: 6s
- transition_in: zoom-through
- transition_speed: medium
- scene: las piezas de la marca convergen en el lockup, con la URL debajo
- voiceover: "KimünKo. Sabiduría del agua."
- poster: 3s
- window: 84s → 90s
- screenshot: none — connective tissue
- goal: el espectador se queda con el nombre, el significado y dónde comprobarlo por su cuenta
- abstraction: symbolic
- complexity: atomic
- tone: confianza
- energy: resolve
- density: focal
- camera: assembly
- metaphor: Brand close
- blueprint: logo-assemble-lockup
- capabilities: timeline-choreography, identity-morph

Las piezas del logotipo convergen desde el plano de la imagen —no desde la profundidad— y se
asientan en el lockup. Debajo aparecen `kimunko.vercel.app` y el equipo. La lentitud es
deliberada: seis segundos para cuatro palabras es la única parte del video donde el silencio
trabaja a favor. Es el cuadro de cierre, así que aquí sí hay movimiento de salida: el lockup se
sostiene hasta el final y el cuadro se apaga sobre él.
