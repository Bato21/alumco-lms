import sanitizeHtmlLib from 'sanitize-html'

/**
 * Saneado de HTML para los módulos de tipo texto.
 *
 * Corre en el servidor, siempre. El editor del cliente puede limpiar lo que
 * quiera para dar buen feedback, pero eso es cosmético: quien manda la server
 * action puede enviar cualquier cosa, así que la única limpieza que cuenta es
 * esta. Se sanea al guardar Y no se vuelve a confiar al renderizar (el HTML
 * guardado ya pasó por acá, pero si alguna vez cambiara la lista de permitidos
 * el contenido viejo quedaría con etiquetas que hoy no aceptamos).
 *
 * Lista blanca, no lista negra: todo lo que no esté acá se va.
 */

const OPCIONES: sanitizeHtmlLib.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'h2', 'h3', 'h4',
    'strong', 'b', 'em', 'i', 'u', 's',
    'ul', 'ol', 'li',
    'blockquote',
    'a',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'code', 'pre',
    'span', 'div',
  ],

  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    // Sin `style`: es la vía clásica para meter position:fixed sobre la
    // interfaz y falsear un diálogo de la plataforma.
    '*': [],
  },

  // Ni javascript: ni data: — data: permite HTML embebido.
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href'],

  // Sin iframes: incrustar contenido de terceros en un módulo es otra
  // conversación (y hoy los videos ya tienen su propio tipo de módulo).
  allowedIframeHostnames: [],

  // Los enlaces salen a otra pestaña y sin pasar el referrer ni acceso a
  // window.opener.
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' },
    }),
    // El editor de contenido no debe competir con el h1 de la página.
    h1: 'h2',
  },

  // Comentarios fuera: son ruido y a veces filtran restos de otro editor.
  allowedClasses: {},
  disallowedTagsMode: 'discard',
  enforceHtmlBoundary: true,
}

/**
 * Límite de tamaño de la ENTRADA de un módulo de texto.
 *
 * La salida puede quedar unos pocos caracteres por encima: al recortar la
 * entrada se puede cortar una etiqueta a la mitad y el parser la cierra. Es
 * irrelevante — la columna es `text` sin tope y lo que se busca acá es no
 * pasarle megabytes al parser, no un largo exacto.
 */
export const MAX_HTML_LENGTH = 100_000

export function sanitizeModuleHtml(raw: string): string {
  return sanitizeHtmlLib(raw.slice(0, MAX_HTML_LENGTH), OPCIONES).trim()
}

/** ¿Queda algo después de sanear? Un módulo de texto vacío no sirve. */
export function hasVisibleText(html: string): boolean {
  return sanitizeHtmlLib(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .trim()
    .length > 0
}
