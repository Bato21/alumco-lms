# Guía de grabación — video demo de KimünKo

Para Valentín y Andy. El documento de referencia de la producción es
[`VIDEO_BRIEF.md`](./VIDEO_BRIEF.md); esta guía es el manual de operación.

**Empieza por la sección 1.** No es burocracia: son las cuatro formas concretas de
arruinar tomas que ya están preparadas, y tres de ellas son irreversibles.

---

## § 1 — Reglas de coordinación (leer antes de tocar nada)

### El entorno demo es UNO SOLO y es COMPARTIDO

Las cuentas `demo-colab@kimunko.demo` y `demo-admin@kimunko.demo` son compartidas,
y la burbuja demo es un único mundo de datos. **Lo que uno hace, los demás lo
ven.** No hay una copia por persona. Si alguien entra a explorar mientras otro
graba, el que graba lo va a notar en pantalla.

**Avisar por el grupo antes de entrar a la cuenta demo.** Siempre. Aunque sea
"solo para mirar".

### 🔴 Nadie rinde quizzes fuera de una toma real

Esta es la regla que más caro cuesta romper.

- La tabla `quiz_attempts` es **inmutable por diseño**: tiene reglas de base de
  datos (`no_delete_attempts`, `no_update_attempts`) que hacen **imposible** borrar
  o corregir un intento. No es difícil: es imposible, incluso con acceso total a
  la base.
- El quiz del beat 20-38 s tiene **`max_attempts = 3`**.
- Cada vez que alguien rinde la evaluación con la cuenta de Camila **consume uno de
  esos tres intentos, para siempre**.

Con tres intentos gastados, la pantalla del quiz deja de mostrar la evaluación y
pasa a mostrar el bloqueo — y el beat central del video ya no se puede grabar
sin el rescate de más abajo, que tiene su propio costo.

**Si quieres ver cómo se ve el quiz, míralo en el video de referencia o pregunta.
No lo abras y lo respondas.**

### 🔴 Nadie marca tareas del evento como completadas

El tablero de "Fiestas Patrias 2026" está compuesto para el beat de 38-54 s: 4
secciones, 13 tareas, unas completadas y otras pendientes, con fechas y
encargados. Es una imagen calibrada.

Marcar una tarea cambia esa imagen y no hay "deshacer" en la interfaz. Si pasa,
avisa: se repara por SQL, pero hay que hacerlo antes de la toma.

### Rescate si se agotan los intentos

Existe, pero **no es gratis**. Cuando los tres intentos están consumidos, la
pantalla del quiz muestra el botón **"Reiniciar curso"**
(`QuizClient.tsx:182`), que llama a `resetCourseProgressAction`.

Lo hace **la propia cuenta de Camila**, desde la pantalla del quiz — no es una
acción de administrador, y no borra intentos: lo que hace es escribir
`last_quiz_reset_at`, y a partir de ese momento los intentos anteriores dejan de
contarse.

⚠️ **El costo:** esa misma acción hace `completed_modules = []`, `is_completed =
false` y `last_module_id = null`. Es decir, **borra todo el progreso del curso**,
no solo habilita el quiz. Después de usarla, el curso 2 queda en 0 de 3 y hay que
**volver a ver el video y el módulo de texto** para dejar a Camila otra vez parada
justo antes del quiz, que es la puesta en escena del beat.

Procedimiento completo, si hay que llegar a esto:

1. Entrar como Camila e ir al quiz del curso "Técnicas de movilización y traslado
   seguro".
2. Pulsar **"Reiniciar curso"**.
3. Volver a `/cursos/b0645620-d04f-4d0a-8fa1-483de5bf1207` y completar el módulo 1
   (video) y el módulo 2 (texto), sin entrar al quiz.
4. Confirmar en `/cursos` que el curso vuelve a verse como "2 de 3".

---

## § 2 — Instalación de la skill

> El documento `docs/PROMPTS_VIDEO_DEMO.md` al que apuntaba el encargo **no existe
> en el repositorio**. Lo que sigue son los comandos verificados en una
> instalación real sobre Windows + Git Bash, hecha para esta producción.

### Prerequisitos

| Requisito | Mínimo | Cómo verificar |
| :--- | :--- | :--- |
| Node.js | ≥ 22.12 | `node --version` |
| npx | viene con Node | `npx --version` |
| Python | ≥ 3.10 | `python --version` |
| ffmpeg + ffprobe | cualquiera | `ffmpeg -version` |

**En Windows, dos trampas conocidas:**

- `python3` suele resolver al alias de Microsoft Store, que no ejecuta nada y hace
  fallar los chequeos aunque Python esté instalado. Se apaga en
  *Configuración → Aplicaciones → Alias de ejecución de aplicaciones*.
- `ffmpeg` no viene con el sistema: `winget install Gyan.FFmpeg` y abrir una
  terminal nueva para que el PATH se refresque. **Sin ffmpeg no hay render**, el
  pipeline se detiene ahí.

### Instalación

```bash
# 1. Chequeo previo (no instala nada; --plan muestra qué falta)
curl -fsSL https://raw.githubusercontent.com/nebrass/hve-video-director/main/scripts/check_requirements.sh -o /tmp/check_requirements.sh
bash /tmp/check_requirements.sh --plan

# 2. La skill principal
npx skills add nebrass/hve-video-director --global

# 3. La familia de skills compañeras (instala ~24: hyperframes, motion-doctrine,
#    media-use, seam-craft y el resto)
npx skills add heygen-com/hyperframes --global

# 4. El navegador que rasteriza los frames
npx puppeteer browsers install chrome-headless-shell

# 5. Verificación
npx hyperframes doctor
npx skills list -g
```

> Al instalar, el CLI muestra una evaluación de riesgo de terceros. Para
> `nebrass/hve-video-director` marcaba **Snyk: Critical Risk** (con Gen: Safe y
> Socket: 0 alerts). Las skills corren con permisos completos del agente. Está
> instalada y en uso, pero conviene saberlo: detalle en
> `https://skills.sh/nebrass/hve-video-director`.

### Lo que queda pendiente en el entorno

Tres piezas de la Fase 5 (audio) siguen sin configurar. Ninguna bloquea grabar,
pero sí bloquean el render final con narración:

- **Voz**: sin decidir entre `kokoro` (local; para español necesita `espeak-ng`,
  que no está instalado) y `elevenlabs` (necesita `ELEVENLABS_API_KEY`).
- **Música**: `FREESOUND_API_KEY` sin definir.

---

## § 3 — Preparar el entorno de captura

### Navegador

- **Perfil de Chrome dedicado y desechable.** Sin extensiones, sin historial, sin
  gestor de contraseñas, sin sesiones personales.
- **Solo pestañas de KimünKo.** Ninguna otra pestaña ni ventana: se cuelan en los
  cambios de foco y en la barra de pestañas.
- Barra de marcadores oculta y notificaciones del sistema en silencio.

### Remote debugging

- Enlazar **siempre a `127.0.0.1`**, nunca a `0.0.0.0` ni a una IP de la red local.
  Un puerto de depuración abierto entrega control completo del navegador y de sus
  sesiones activas a cualquiera que lo alcance.
- Cerrarlo al terminar la captura.

### Credenciales

Están hardcodeadas en `src/components/alumco/auth/LoginForm.tsx:14-15`, y el login
tiene botones de acceso directo para las dos cuentas demo. No hace falta
escribirlas en cámara.

### ⚠️ `NEXT_PUBLIC_MODO_GRABACION` exige deploy

Esta variable es la que oculta la barra amarilla de MODO DEMO y la que hace que la
sede demo se rotule "Hualpén" en la verificación pública del certificado.

Es una variable `NEXT_PUBLIC_*`: **Next la incrusta en el build**. Definirla en
Vercel **no sirve de nada hasta que haya un deploy nuevo**. Recargar la página,
cerrar sesión o limpiar caché no cambia nada.

Lo mismo al revertirla: hay que borrarla **y volver a desplegar**.

### Dominio

Grabar en **`https://kimunko.vercel.app`**. **No** en `alumcotest.vercel.app`, que
sirve una rama de julio y ni siquiera tiene la verificación pública de
certificados (devuelve 307 a login).

---

## § 4 — Qué grabar y qué no

La tabla completa de rutas, con las URLs exactas y qué verificar en cada una, está
en **[`VIDEO_BRIEF.md` § 8 → "Rutas a revisar a ojo antes de grabar"](./VIDEO_BRIEF.md)**.

Resumen de lo que **no** se graba:

| Ruta | Motivo |
| :--- | :--- |
| `/admin/sedes` | BUG-71: la cuenta demo ve las sedes reales de ONG Alumco y las de prueba acumuladas |
| `/perfil` | Muestra `demo-colab@kimunko.demo` |
| `/admin/perfil` | Muestra `demo-admin@kimunko.demo` |

Y la verificación que **no se salta nunca**: abrir `/admin/trabajadores` antes de
la primera toma y confirmar que solo aparecen Camila Fuentes Ortega y Marcela
Aguirre Soto. **Si aparece un solo nombre real, se detiene la grabación.**

---

## § 5 — Después de grabar

Hay estado reversible pendiente: la bandera de grabación, el certificado volteado
y la sede renombrada. **No lo improvisen.**

El checklist completo, con qué revertir, cómo y en qué orden, está en
**[`VIDEO_BRIEF.md` § 8 → "Después de grabar — REVERTIR"](./VIDEO_BRIEF.md)**.

Los dos ítems que dejan rastro fuera del entorno demo —el certificado y la
bandera— se revisan primero.
