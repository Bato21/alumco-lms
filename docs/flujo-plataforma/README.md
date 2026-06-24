# docs/flujo-plataforma

Documentación del **flujo completo** de la plataforma KimünKo / ONG Alumco LMS, con
pantallazos de cada vista y la explicación de qué hace cada pantalla y cada botón.

## Contenido

- **[FLUJO.md](./FLUJO.md)** — documento maestro: mapa de flujo (diagrama) + pantalla por
  pantalla con sus botones y "flechas" (a dónde lleva cada acción) y qué mostrar en la demo.
- **[capturas/](./capturas)** — 22 pantallazos (1440×900 @2x) numerados por flujo:
  `0x` públicas · `1x` área trabajador · `2x` área admin.
- `_capturar.mjs` / `_patch.mjs` — scripts de captura (Playwright). No son parte del producto.

## De dónde salieron las capturas

- **Fuente:** deploy de producción `https://alumco-lms.vercel.app` (Vercel).
- **Fecha:** 2026-06-15.
- **Usuarios usados:** trabajador `Baptiste Vial` (Enfermería, Sede Hualpén) y admin
  `Valentina Garrido`.

> ⚠️ **El deploy puede ir por detrás del código local.** Las capturas reflejan lo que
> hay **publicado** (lo que verá quien entre a la demo), que en algunas pantallas difiere
> del working tree local (p. ej. el `/inicio` del trabajador). Si quieres documentar la
> versión local, primero hay que desplegar y volver a capturar.

## Regenerar las capturas

Requiere Playwright + Chromium (ya instalados como devDependency):

```bash
# todas las capturas (público + trabajador + admin)
node docs/flujo-plataforma/_capturar.mjs

# captura puntual (editar el script para la pantalla que toque)
node docs/flujo-plataforma/_patch.mjs
```

Si cambian la URL o las credenciales, edítalas al inicio de `_capturar.mjs`
(constantes `BASE`, `ADMIN`, `TRAB`).

## Pendiente opcional

- `/certificado/[certificateId]` (vista pública del certificado) — no capturada; requiere
  el ID de un certificado real.
