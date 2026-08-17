# Design Contract — KimünKo

Identidad **derivada de las capturas** (`identity_strategy: screenshots`), no de un preset ajeno.
Los colores no están estimados a ojo: salen de un muestreo de paleta dominante sobre
`public/screenshots/scene-01-dashboard.png`, `scene-05-certificado-valido.png` y
`scene-04-movil-tarea.png`. Las familias tipográficas salen de `src/app/layout.tsx`, no de una
suposición sobre lo que "parece" la captura.

> **Por qué importa que sea derivada.** La plataforma acaba de pasar una revisión de contraste
> WCAG 2.2 AA con hallazgos cerrados. Importar un sistema de marca ajeno pisaría colores ya
> medidos y podría reintroducir en el video justo lo que se corrigió en el producto.

## Confirmed Theme

**`light`.** Es el único tema del contrato: no hay alternativa oscura en este documento y no debe
aparecer ninguna en las escenas. Todo lienzo, superficie, texto, borde, sombra y cromo de
navegador o dispositivo usa los tokens de abajo.

| Rol | Token | Origen |
| :--- | :--- | :--- |
| Lienzo de página | `#FAF6ED` | fondo cálido del dashboard |
| Superficie elevada | `#FFFDF6` | tarjetas y barra lateral |
| Superficie hundida | `#F4F1EA` | separadores y zonas de reposo |
| Tinta principal | `#111728` | titulares y cuerpo |
| Tinta secundaria | `#4A647F` | subtítulos y etiquetas |
| Borde | `#E3E2E0` | contorno de tarjeta |
| Cromo de navegador | `#F4F1EA` sobre `#FFFDF6` | barra de la maqueta |

## Palette

```
Navy profundo   #182F6E   marca, banda hero, fondos de bloque
Navy medio      #1B347D   degradados y estados
Navy claro      #233C85   acentos sobre navy
Ámbar           #F5A623   acento de acción (botones, foco)  — SOLO como fondo
Ámbar suave     #D3A467   insignias y marcas de verificación
Verde válido    #1C5C40   certificado válido, éxito
Rojo alerta     #BB3A2E   incumplimiento, atrasos
Crema           #FFFDF6   superficie
Arena           #FAF6ED   lienzo
Tinta           #111728   texto
Tinta suave     #4A647F   texto secundario
```

> 🔴 **El ámbar `#F5A623` nunca se usa como color de texto.** Blanco sobre ámbar da 2.03:1. Va
> como relleno de botón o insignia, siempre con tinta oscura encima. Es la misma regla que rige en
> el producto (`CLAUDE.md` § Color y contraste) y romperla en el video contradiría la plataforma
> que el video presenta.

Ninguna información se transmite solo por color: si un estado se marca en verde o rojo, lleva
además texto o icono.

## Typography

Las cuatro familias son las del producto, cargadas con `next/font/google` en `src/app/layout.tsx`.

| Rol | Familia | Uso en el video |
| :--- | :--- | :--- |
| Display | **Fraunces** | Titulares grandes. Es la cara de "Buenas tardes, Marcela", "Mis cursos", "Fiestas Patrias 2026" |
| Serif alterna | **Playfair Display** | Solo si un cuadro cita el héroe de la landing |
| Cuerpo | **Geist** | Todo el texto corrido, etiquetas y pies |
| Etiqueta | **Archivo** | Mayúsculas con tracking, para rótulos tipo "PRÓXIMO EVENTO" |
| Mono | `ui-monospace, SFMono-Regular, Menlo` | Folio de verificación, URLs |

**Escala** (lienzo 1920×1080):

```
Display    Fraunces 600      96–120px
Titular    Fraunces 600      64–80px
Subtítulo  Geist 500         40–48px
Cuerpo     Geist 400         30–36px
Etiqueta   Archivo 700       22–26px, tracking .12em, mayúsculas
Mono       ui-monospace      28–34px
```

**Piso de legibilidad: 30px.** Nada por debajo en un lienzo de 1920 — se pierde en proyección,
que es uno de los dos usos reales del video.

## Shape

```
Radio tarjeta      16px
Radio maqueta      14px
Radio píldora      999px
Borde              1px #E3E2E0
Sombra tarjeta     0 2px 6px rgba(17,23,40,.05), 0 24px 60px rgba(17,23,40,.14)
Sombra maqueta     0 0 0 1px rgba(17,23,40,.06), 0 40px 90px rgba(17,23,40,.18)
Velo/viñeta        radial hacia #FAF6ED en los bordes del cuadro
```

## Motion Defaults

```
Entrada            power3.out  (asentado estándar)
Entrada suave      power2.out  (texto secundario)
Empuje de cámara   power1.inOut (lento, sin frenada brusca)
Stagger            0.08–0.12s
Transición         zoom-through a 0.7s   (transition_style + transition_speed confirmados)
Corte conectivo    crossfade a 0.7s      (dentro de una misma sección)
```

**Ninguna escena anima su propia salida.** La costura es dueña del traspaso; solo el cuadro de
cierre, que no tiene costura después, puede animarse hacia fuera.

**Nada de movimiento en vacío.** No hay flotación ambiental ni pulsos decorativos: en un video de
90 segundos cada movimiento tiene que significar algo. Un elemento en reposo se queda quieto.

## Aplicación por arquetipo

| Cuadro | Arquetipo | Tratamiento |
| :--- | :--- | :--- |
| 1 · papeleo | metáfora construida | Formas y tipografía en la paleta. Sin fotografía de archivo, que chocaría con las capturas reales de los cuadros siguientes |
| 2 · dashboard | captura enmarcada | Maqueta de navegador con sombra, retroceso de cámara sobre el envoltorio |
| 3 · Camila | clip enmarcado | Maqueta de navegador, viñeta hacia el lienzo, gradación hacia los tokens |
| 4 · evento | clip enmarcado | Igual que el 3, para que los dos beats de producto lean como un mismo mundo |
| 5 · dos dispositivos | composición | Escritorio al fondo + `device-frame-stage` con la captura móvil real en primer plano |
| 6 · certificado | captura enmarcada | Empuje lento hacia el folio, campos en cascada |
| 7 · placa | bloque `logo-outro` | Ensamblado del logo, tagline y píldora de URL |

## Anti-patrones

- **No redibujar una captura.** Las capturas son el sujeto del cuadro, no material de muestreo de
  paleta. Una maqueta inventada que imite la UI real es exactamente lo que el portón de cobertura
  existe para detectar.
- **Ninguna cifra que el storyboard no haya entregado.** Todo número en pantalla sale de una
  captura real. Nada de métricas de relleno.
- **Sin datos que parezcan reales.** En el cuadro 1 los papeles llevan texto genérico o ilegible:
  ni nombres, ni RUT, ni cifras que un espectador pueda leer como un dato verdadero.
- **Nada de giros completos ni sacudidas.** Inclinación de maqueta acotada: `rotateY` ≤ 8°,
  `rotateX` ≤ 4°, `rotateZ` ≤ 4°.
