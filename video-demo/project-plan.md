# Project Plan — KimünKo — video demo

## Creative Brief

| Field | Value |
|---|---|
| mode | promo |
| product_surface | ui |
| duration | 90s |
| theme | light |
| aspect_ratio | 16:9 1920x1080 |
| identity_strategy | screenshots |
| identity_choice | captured-screenshots |
| visual_ceiling | derived |
| voice | elevenlabs:Matilda:XrExE9yKIg1WjnnlVkGX |
| transition_style | zoom-through |
| transition_speed | medium |
| music_strategy | none |
| final_music_track | none |

Every field is a user-owned choice. The agent may mark a recommendation in an option's
label/description and explain why, but it never selects or infers an answer from Phase-0 research.

`final_music_track` remains a placeholder until Phase 5. Record either the exact value `none` or a
single-line JSON object with exactly `title`, `path`, `source` and `license` — no other keys, for
every strategy:

```json
{"license":"CC-BY-4.0","path":"background-music.mp3","source":"https://freesound.org/s/123/","title":"Uplifting Corporate Loop"}
```

`source` is the provenance record, and each strategy pins it differently:

| `music_strategy` | Required `source` |
|---|---|
| `freesound` | the exact `freesound.org` track URL carrying its numeric sound ID |
| `user-provided` | the literal value `user-provided` |
| `delegated` | a provenance URI (below) |
| `none` | not applicable — `final_music_track` is the exact value `none` |

**`delegated`** covers a bed another skill retrieved from a provider catalog or generated locally
— there is no public page to link, and a presigned download URL expires. What identifies such a
track later is *who produced it, by which route, from which request, and which bytes came out*, so
the source is a single-line URI carrying all four:

```
<skill-name>:<capability>?mode=<retrieve|generate>&query=<url-encoded request>#sha256=<64 hex>
```

```json
{"license":"HeyGen catalog terms","path":"background-music.mp3","source":"media-use:bgm?mode=retrieve&query=calm%20cinematic%20underscore#sha256=1ca03b74a4715b23ab399d6cac9c1a055b250ec91d4a266faede2c915ba9df5b","title":"Calm Cinematic Underscore"}
```

- `<skill-name>` and `<capability>` are lowercase kebab tokens naming the skill that produced the
  bytes and the capability it ran. A URL scheme — `http`, `https`, `file`, `data` — is rejected
  outright: a delegated track is not a fetchable page, and recording one as if it were is the
  failure this URI exists to prevent.
- `mode` records the route actually taken, not the route requested — `retrieve` from a catalog or
  `generate` locally. The two carry different licensing, which is exactly what an audit asks about.
  `auto` is a request, not provenance, and is rejected.
- `query` (or `prompt`, for a full generation prompt) is the request text that produced this
  track — exactly one of the two. Additional `key=value` parameters are allowed and ignored; a
  bare flag with no `=` is rejected, because a query string that does not parse is a record that
  was mangled by hand.
- `#sha256=` is the SHA-256 of the file at `path`, all 64 lowercase hex characters — a shortened or
  elided digest is rejected — taken from the bytes that will be mixed. It is what makes the record
  checkable years later, offline: `shasum -a 256 <path>`.
- `license` is still required and still user-stated. A generated bed is not automatically
  unencumbered; write the terms that actually apply.

Never record a delegated track as `user-provided`: that repurposes a Phase-1 answer the user gave
before any candidate existed and erases the only machine-checked provenance the brief carries.

Confirm the story fields before creating `storyboard.md`; confirm the exact final track (or `none`)
before mixing or rendering — the exact-track confirmation is required for every strategy, delegated
included. The installed skill's `scripts/validate_brief.py` stores confirmations and phase
fingerprints atomically in `.hve/brief-state.json`. It never deletes generated artifacts; changed
fingerprints make the affected phase stamps stale.

**Created:** 2026-08-16

## Phase Tracker

Use `skipped` when a phase is intentionally unnecessary (for example, Phase 2 when
`product_surface: none` and the storyboard's capture plan is `none`).

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| 0. Discovery | ✅ complete | 2026-08-16 | 2026-08-16 |
| 1. Storytelling | ✅ complete | 2026-08-16 | 2026-08-16 |
| 2. Capture | ✅ complete | 2026-08-16 | 2026-08-16 |
| 3. Design | ✅ complete | 2026-08-16 | 2026-08-16 |
| 4. Production | ✅ complete | 2026-08-16 | 2026-08-16 |
| 5. Audio & Render | ✅ complete (muda) | 2026-08-16 | 2026-08-16 |

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-16 | `mode: promo` | Pieza de presentación ante la profesora y la Product Owner, no tutorial ni demo técnico. Fijado en `docs/VIDEO_BRIEF.md` § 3 y confirmado por el usuario. |
| 2026-08-16 | `product_surface: ui` | Se filma la interfaz real de `kimunko.vercel.app`. La doble audiencia exige pantallas reales en uso. |
| 2026-08-16 | Grabar contra `kimunko.vercel.app`, nunca producción ni `alumcotest` | `VIDEO_BRIEF.md` § 7: producción tiene 58 personas reales con RUT. `alumcotest` sirve una rama de julio sin verificación pública de certificados. |
| 2026-08-16 | Se acepta filmar el evento `a260db2f…` pese a `is_demo = false` | Verificado con el usuario: lo creó el equipo para demostración y no contiene datos sensibles. Queda pendiente decidir la continuidad con el evento del beat 4, que tiene otro nombre y otro conteo de tareas. |
| 2026-08-16 | `python3.exe` creado por copia en `…\Programs\Python\Python314\` | El instalador de Windows no lo crea y `python3` caía en el stub de Microsoft Store, dejando bloqueadas las Fases 2 y 5. Reversible borrando ese archivo. |
| 2026-08-16 | Ángulo: jornada + dolor inicial. CTA: visitar el sitio | Confirmado por el usuario en la Fase 0. |
| 2026-08-16 | **La entrega es muda: el pipeline produce solo imagen** | Decisión del usuario. Él añade música y voz en off después, en su propio editor. Consecuencias: `music_strategy: none`, la Fase 5 no mezcla audio ni genera subtítulos, y **las duraciones del storyboard pasan a ser la única verdad del cronómetro** — la Fase 5 ya no re-ajusta las escenas contra la locución, así que la imagen debe caer exacta en las ventanas del guion o la voz no calzará al montarla. |
| 2026-08-16 | `voice` se declarará con un valor `elevenlabs:` de forma nominal | `validate_brief.py:354-360` impone un vocabulario cerrado sin opción "ninguna". Es un requisito del validador, no una decisión creativa: no se sintetizará ninguna voz. |
| 2026-08-16 | Brief creativo confirmado (revisión 1) | 90s · light · 16:9 1920x1080 · identidad derivada de capturas · techo `derived` · `zoom-through` medium · música `none`. |
| 2026-08-16 | `web_capture_source: navigate` contra `kimunko.vercel.app` | Fijado por `VIDEO_BRIEF.md` § 8, que además descarta la sesión adjunta (`--autoConnect`) por no abrir depuración remota. |
| 2026-08-16 | Se descartó sembrar datos demo; era un bug de código | El dashboard marcaba 0 % porque pedía `updated_at` a `course_progress`, columna inexistente → PostgREST 400 → `allProgress` null. Corregido en `src/app/admin/dashboard/page.tsx`. **Requiere deploy antes de capturar el beat 2.** |
| 2026-08-16 | Pendiente: "Cumplimiento por sede" seguirá en 0 % tras el fix | Agrupa por `sede_1`/`sede_2` y las cuentas demo son `sede_demo`. Decisión abierta para el encuadre del beat 2. |
| 2026-08-16 | Beat 2 capturado **antes** del beat 3, a propósito | El dashboard quedó registrado con 33 % y Camila en 2 pendientes. Rendir la evaluación lo movió a 67 % / 1 pendiente. Recapturar el beat 2 ahora ya no coincidiría con lo grabado. |
| 2026-08-16 | Beat 3 grabado: evaluación enviada, 100 %, aprobado | Consumió el intento 1 de 3 del quiz `aa2b6ffa` (quedan 2). Camila pasó a 2 cursos completados y se emitió un segundo certificado demo. Irreversible por diseño (`quiz_attempts` inmutable). |
| 2026-08-16 | Beat 6 capturado; ventana del certificado **abierta y cerrada** | `ventana-certificado.sql` PASO 1 → captura → PASO 2, en menos de un minuto. Cierre verificado: `is_demo = true` y `certificados_reales = 0`. **El ítem 1 del bloque A de reversión ya está saldado.** |
| 2026-08-16 | F1 y F5 dejan de necesitar cámara | F5 se compone con dos capturas reales (escritorio + PWA móvil a 390×844) y un rack-focus; F1 pasa a escena construida, que es lo que ya pedía su blueprint `overwhelm-surround`. Desbloquea la Fase 2 sin material inventado. |
| 2026-08-16 | Costuras: `inverse zoom-through`, corriente z− en todo el film | La escena 2 retrocede (3.45 → 1.0). Un zoom-through en sentido de empuje habría peleado con su propia entrada y el `z-sign-scan` lo habría marcado. Cuatro costuras verificadas, 0 fallos. |
| 2026-08-16 | Los dos límites internos (38s y 54s) son `crossfade` y **no se verifican** | Una disolución no puede ser fila del ledger: no tiene solapamiento cero ni portador. Es lo esperado para un corte conectivo dentro de una sección, pero conviene saber que pasan sin medir. |
| 2026-08-16 | Bloques `logo-outro` y `device-frame-stage` retirados | Instalados como referencia y no cableados. `logo-outro` es genérico (dice "figma.com") y rebrandearlo era reescribirlo; `device-frame-stage` aporta flotación en reposo, que este contrato prohíbe. |
| 2026-08-16 | Render entregado: `renders/video-demo_2026-08-16_15-18-48.mp4` | H.264 1920×1080 yuv420p, 30 fps, 2700 fotogramas, **90.000000 s exactos**, 21 MB, **sin pista de audio**. Verificado que el metraje de los dos clips avanza dentro del render. |
