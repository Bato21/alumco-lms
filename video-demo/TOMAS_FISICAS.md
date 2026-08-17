# Tomas físicas — beats 1 y 5

Las otras cinco capturas del video salen del navegador. Estas dos no: el pipeline
controla Chrome de escritorio y no puede filmar una mesa. Hay que grabarlas con
cámara y dejarlas en la ruta exacta que espera el storyboard.

## Especificación común

| Requisito | Valor | Por qué |
| :--- | :--- | :--- |
| Relación de aspecto | **16:9** | El lienzo está bloqueado en 1920×1080 desde la Fase 1 |
| Resolución | 1920×1080 o superior | Menos obliga a escalar hacia arriba y se nota |
| Fotogramas | ≥ 30 fps | El control de calidad rechaza menos |
| Audio | irrelevante | La entrega es muda; la voz la pones tú después |
| Temperatura | luz cálida, ambiente claro | El tema confirmado es `light`; una toma fría choca en el corte |

> **Encuadrar pensando en 16:9 desde la toma.** Un plano físico no se puede
> recomponer después sin recortar y perder resolución.

Cuando estén grabadas, normalízalas con el ayudante ya copiado en el proyecto:

```bash
cd video-demo
python3 scripts/stitch_clip.py <archivo-camara> --width 1920 --height 1080 \
  -o public/clips/scene-00-papeleo.mp4
```

Acepta recorte con `archivo::INICIO::DURACION` (en segundos) si hay que quitar
cabeza o cola.

---

## Beat 1 — «El papeleo» · 10 s

**Destino:** `public/clips/scene-00-papeleo.mp4`

**Voz en off que va encima:** *"En un ELEAM, cada trabajador debe cumplir horas de
capacitación obligatoria al año. Hoy eso vive en planillas, correos y papeles
sueltos."*

**Qué tiene que pasar en cuadro.** Abre sobre **una sola carpeta abierta** y el
material va entrando por los bordes hasta tapar el centro. El orden importa y no
es decorativo: primero las **planillas impresas**, después los **correos**, al
final las **carpetas apiladas**. El ojo tiene que leer un documento, luego el
volumen — nunca los tres a la vez.

El encierro es el argumento: a los diez segundos el centro del cuadro está
tapado. Eso es lo que se siente al preparar una fiscalización con este método.

**Cómo resolverlo en la práctica.** Cámara fija cenital sobre una mesa y alguien
fuera de cuadro dejando material por tandas. No hace falta movimiento de cámara:
el empuje lo pone la Fase 3.

> 🔴 **Ningún papel real con datos de personas.** Es la regla que más caro sale
> romper en esta toma. Nada de planillas con nombres, RUT, fichas de personal ni
> documentación de residentes. Si se filma papelería real de Alumco, entra dato
> personal al video. Usa documentos preparados, texto genérico, o encuadra de
> forma que no se lea nada. Un solo fotograma con un nombre real obliga a
> recortar o regrabar.

---

## Beat 5 — «Del computador al bolsillo» · 16 s

**Destino:** `public/clips/scene-04-dos-dispositivos.mp4`

**Voz en off que va encima:** *"La administradora asigna desde el computador. A
Camila le llega al teléfono — es la misma plataforma, instalada como app, sin
bajar nada de ninguna tienda."*

**Qué tiene que pasar en cuadro.** Notebook y teléfono conviven en el **mismo
plano**, y el foco viaja de uno al otro **sin que la cámara se mueva**:

1. Notebook nítido al fondo, con la vista de administradora.
2. Teléfono esperando **desenfocado en primer plano**.
3. Llega la notificación → **el foco salta al teléfono**.

Ese salto de foco *es* el argumento del beat. Por eso no se resuelve con un
corte: un corte diría "otra escena", el foco dice "el mismo momento, el mismo
sitio". Es un *rack focus* clásico y hay que hacerlo en cámara, con apertura
abierta para que el desenfoque sea real.

**Preparación antes de rodar:**

- Las dos pantallas con las **cuentas demo**, nunca con datos reales.
- Notificaciones push **reactivadas** en el teléfono de grabación desde Mi perfil.
- La plataforma **instalada como PWA** en el teléfono — el argumento es que se ve
  como app, sin barra de navegador.
- Silenciar el resto de notificaciones del teléfono: una alerta ajena entrando en
  cuadro arruina la toma.

**Los dos enemigos habituales** de un plano con pantallas: el **reflejo** (bajar
brillo ambiente, angular ligeramente las pantallas) y el **moiré** o parpadeo
(subir la velocidad de obturación o cambiar levemente el ángulo).

---

## Estado del resto de la Fase 2

| Cuadro | Artefacto | Estado |
| :--- | :--- | :--- |
| F1 | `public/clips/scene-00-papeleo.mp4` | ⏳ esta guía |
| F2 | `public/screenshots/scene-01-dashboard.png` | ✅ |
| F3 | `public/clips/scene-02-camila.mp4` | ✅ 18,000 s |
| F4 | `public/clips/scene-03-evento.mp4` | ✅ 16,000 s |
| F5 | `public/clips/scene-04-dos-dispositivos.mp4` | ⏳ esta guía |
| F6 | `public/screenshots/scene-05-certificado-valido.png` | ✅ |
| F7 | — placa final, se compone en Fase 3 | — |

La Fase 2 no se sella hasta que existan los dos archivos de arriba.
