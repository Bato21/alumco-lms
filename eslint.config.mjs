import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

/**
 * Eleva a "error" las reglas de un preset conservando sus opciones.
 * Las que el preset deja explícitamente en "off" se respetan: en el preset
 * `strict` eso es `label-has-for`, que el propio plugin marca como obsoleta
 * (exige nesting E id a la vez, cosa que ningún formulario moderno hace) y
 * cuyo reemplazo `label-has-associated-control` sí está activa.
 */
function aErrores(rules) {
  return Object.fromEntries(
    Object.entries(rules).map(([nombre, valor]) => {
      const nivel = Array.isArray(valor) ? valor[0] : valor;
      if (nivel === "off" || nivel === 0) return [nombre, valor];
      return [
        nombre,
        Array.isArray(valor) ? ["error", ...valor.slice(1)] : "error",
      ];
    }),
  );
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ──────────────────────────────────────────────────────────────────────
  // Accesibilidad — WCAG 2.2 AA
  //
  // `eslint-config-next` ya trae jsx-a11y, pero sólo activa 6 reglas
  // (alt-text, aria-props, aria-proptypes, aria-unsupported-elements,
  // role-has-required-aria-props, role-supports-aria-props). Eso deja fuera
  // justo los fallos que la auditoría encontró: `div` con `onClick`,
  // controles sin etiqueta, `<a>` sin destino, `aria-hidden` sobre elementos
  // enfocables.
  //
  // Aquí se aplica el preset `strict` del plugin y se elevan sus reglas a
  // `error`: la accesibilidad es un compromiso contractual (Matriz RACI,
  // actividad 9), así que un incumplimiento debe romper el build y no
  // quedarse como aviso que nadie lee.
  //
  // NOTA: se copian sólo las `rules` del preset, no el objeto entero. El
  // preset declara `plugins: { "jsx-a11y": … }` y eslint-config-next ya
  // registró ese mismo plugin; ESLint 9 aborta con «Cannot redefine plugin».
  //
  // Ver docs/AUDITORIA_A11Y.md y docs/CONFORMIDAD_A11Y.md.
  // ──────────────────────────────────────────────────────────────────────
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      ...aErrores(jsxA11y.flatConfigs.strict.rules),

      // `depth` por defecto es 2 y varias etiquetas del proyecto envuelven el
      // texto en dos <span> anidados (título + ayuda), p. ej. el panel de
      // preferencias de accesibilidad. Con 2 la regla no ve el texto y da
      // falso positivo sobre etiquetas que sí están bien construidas.
      "jsx-a11y/label-has-associated-control": ["error", { depth: 5 }],

      // `ignoreNonDOM` porque varios componentes del proyecto tienen una prop
      // de negocio llamada `role` (NotificationBell, AdminSidebar… reciben
      // 'admin' | 'profesor' | 'trabajador'). Sin esto la regla la confunde
      // con el atributo ARIA y reporta 4 falsos positivos. Sobre elementos
      // DOM reales el chequeo se mantiene.
      "jsx-a11y/aria-role": ["error", { ignoreNonDOM: true }],

      // ── prefer-tag-over-role: DESACTIVADA a conciencia ────────────────
      // No corresponde a ningún criterio WCAG; es una preferencia de estilo
      // «HTML nativo primero». En este código sus 26 avisos son, uno por
      // uno, indicaciones que no se pueden seguir sin romper algo:
      //
      //  · role="dialog" → <dialog>: los 8 modales del proyecto se abren y
      //    cierran por estado de React. <dialog> exige showModal()/close()
      //    imperativos, o sea cambiar comportamiento funcional — prohibido
      //    por las reglas del encargo. `role="dialog"` + `aria-modal="true"`
      //    es plenamente conforme con 4.1.2.
      //  · role="img" en <svg> inline → <img>: la recomendación del propio
      //    WAI para SVG inline con significado es justamente role="img" +
      //    aria-label. Pasar a <img> obligaría a externalizar los SVG.
      //  · role="progressbar" → <progress>: <progress> no admite el relleno
      //    a medida de la barra DIDASKO y pierde aria-valuetext.
      //  · role="status" → <output>: <output> se asocia a un formulario y su
      //    soporte en lectores de pantalla es peor que el de role="status".
      //
      // Los casos que SÍ eran corregibles (role="list"/"listitem" sobre
      // <div>) se arreglaron con <ul>/<li> reales antes de desactivarla.
      "jsx-a11y/prefer-tag-over-role": "off",

      // ── Reglas que el preset `strict` no incluye ──────────────────────
      // 4.1.2 — un elemento enfocable oculto al árbol de accesibilidad es un
      // control que el lector de pantalla no puede nombrar.
      "jsx-a11y/no-aria-hidden-on-focusable": "error",
      // 3.1.2 — `lang` bien formado en cualquier fragmento en otro idioma.
      "jsx-a11y/lang": "error",
      // 1.3.1 / 4.1.2 — controles sin nombre accesible. `strict` la trae en
      // "off"; se activa con las exclusiones del propio preset y con `depth`
      // ampliado por el mismo motivo que label-has-associated-control (el
      // texto suele estar dos o tres niveles dentro del control).
      "jsx-a11y/control-has-associated-label": [
        "error",
        {
          ...jsxA11y.flatConfigs.strict.rules[
            "jsx-a11y/control-has-associated-label"
          ][1],
          depth: 5,
        },
      ],

      // ── no-redundant-roles: DESACTIVADA a conciencia ──────────────────
      // Su único caso aquí es `<ul role="list">`, que NO es redundante: en
      // Safari/VoiceOver un <ul> con `list-style: none` pierde la semántica
      // de lista (WebKit #170179) y deja de anunciarse como «lista de N
      // elementos». Todas las listas del proyecto llevan `list-style: none`
      // por diseño, así que el rol explícito es necesario, no ruido.
      "jsx-a11y/no-redundant-roles": "off",
      // 2.4.4 — el texto del enlace debe describir el destino fuera de
      // contexto. La lista por defecto es en inglés; se traduce al español,
      // que es el único idioma de la interfaz.
      "jsx-a11y/anchor-ambiguous-text": [
        "error",
        {
          words: [
            "aquí",
            "clic aquí",
            "haz clic aquí",
            "pincha aquí",
            "leer más",
            "ver más",
            "más",
            "enlace",
            "link",
            "click here",
            "here",
            "learn more",
          ],
        },
      ],

      // `next/link` renderiza un <a>: sin declararlo, el plugin no ve el href
      // y produce falsos negativos en anchor-is-valid / anchor-has-content.
      "jsx-a11y/anchor-is-valid": [
        "error",
        { components: ["Link"], specialLink: ["href"] },
      ],
    },
    settings: {
      "jsx-a11y": {
        polymorphicPropName: "as",
        components: {
          // Componentes que renderizan un elemento nativo, para que el plugin
          // les aplique las mismas reglas que al elemento.
          Link: "a",
          Image: "img",
        },
      },
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
