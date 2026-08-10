import { describe, expect, it } from 'vitest'
import { hasVisibleText, sanitizeModuleHtml } from '@/lib/sanitizeHtml'

/**
 * El HTML de un módulo de texto se renderiza con dangerouslySetInnerHTML, así
 * que este saneador es lo único entre el editor y un XSS almacenado servido a
 * todo el equipo de Alumco.
 */
describe('sanitizeModuleHtml — lo que debe eliminar', () => {
  it('elimina <script>', () => {
    const out = sanitizeModuleHtml('<p>Hola</p><script>alert(1)</script>')
    expect(out).not.toContain('script')
    expect(out).not.toContain('alert')
    expect(out).toContain('<p>Hola</p>')
  })

  it('elimina manejadores de evento inline', () => {
    const out = sanitizeModuleHtml('<p onclick="alert(1)" onmouseover="x()">Texto</p>')
    expect(out).not.toContain('onclick')
    expect(out).not.toContain('onmouseover')
    expect(out).toContain('Texto')
  })

  it('elimina enlaces javascript:', () => {
    const out = sanitizeModuleHtml('<a href="javascript:alert(1)">clic</a>')
    expect(out).not.toContain('javascript:')
  })

  it('elimina enlaces data: (permiten HTML embebido)', () => {
    const out = sanitizeModuleHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>')
    expect(out).not.toContain('data:text/html')
  })

  it('elimina el atributo style — la vía para superponerse a la interfaz', () => {
    const out = sanitizeModuleHtml(
      '<div style="position:fixed;top:0;left:0;width:100vw">Falso diálogo</div>'
    )
    expect(out).not.toContain('style')
    expect(out).not.toContain('position:fixed')
  })

  it('elimina iframes', () => {
    const out = sanitizeModuleHtml('<iframe src="https://evil.example"></iframe>')
    expect(out).not.toContain('iframe')
  })

  it('elimina <img> con onerror', () => {
    const out = sanitizeModuleHtml('<img src=x onerror="alert(1)">')
    expect(out).not.toContain('onerror')
    expect(out).not.toContain('<img')
  })

  it('elimina <form> y campos de entrada — nadie pide credenciales desde un módulo', () => {
    const out = sanitizeModuleHtml(
      '<form action="https://evil.example"><input name="clave" type="password"></form>'
    )
    expect(out).not.toContain('<form')
    expect(out).not.toContain('<input')
  })

  it('elimina <style> y <link>', () => {
    const out = sanitizeModuleHtml('<style>body{display:none}</style><link rel="stylesheet" href="x">')
    expect(out).not.toContain('<style')
    expect(out).not.toContain('<link')
  })

  it('recorta la entrada para no pasarle megabytes al parser', () => {
    const gigante = '<p>' + 'a'.repeat(500_000) + '</p>'
    const out = sanitizeModuleHtml(gigante)
    // El tope es sobre la entrada; la salida puede llevar unos caracteres de
    // más porque el parser cierra la etiqueta que quedó cortada.
    expect(out.length).toBeLessThan(100_100)
    expect(out.length).toBeGreaterThan(99_000)
  })
})

describe('sanitizeModuleHtml — lo que debe conservar', () => {
  it('conserva el formato de texto que usa un procedimiento clínico', () => {
    const entrada =
      '<h2>Protocolo</h2><p>Paso <strong>uno</strong> y <em>dos</em>.</p>' +
      '<ul><li>Lavado de manos</li><li>Guantes</li></ul>' +
      '<blockquote>Ante duda, avisar.</blockquote>'
    const out = sanitizeModuleHtml(entrada)
    expect(out).toContain('<h2>Protocolo</h2>')
    expect(out).toContain('<strong>uno</strong>')
    expect(out).toContain('<em>dos</em>')
    expect(out).toContain('<li>Lavado de manos</li>')
    expect(out).toContain('<blockquote>')
  })

  it('conserva tablas', () => {
    const out = sanitizeModuleHtml(
      '<table><thead><tr><th>Signo</th></tr></thead><tbody><tr><td>Fiebre</td></tr></tbody></table>'
    )
    expect(out).toContain('<table>')
    expect(out).toContain('<th>Signo</th>')
    expect(out).toContain('<td>Fiebre</td>')
  })

  it('baja h1 a h2 para no competir con el título de la página', () => {
    const out = sanitizeModuleHtml('<h1>Título</h1>')
    expect(out).toContain('<h2>Título</h2>')
    expect(out).not.toContain('<h1>')
  })

  it('abre los enlaces externos en otra pestaña y sin filtrar el referrer', () => {
    const out = sanitizeModuleHtml('<a href="https://ongalumco.cl">Alumco</a>')
    expect(out).toContain('href="https://ongalumco.cl"')
    expect(out).toContain('target="_blank"')
    expect(out).toContain('noopener')
    expect(out).toContain('noreferrer')
  })

  it('conserva enlaces mailto', () => {
    expect(sanitizeModuleHtml('<a href="mailto:a@b.cl">correo</a>')).toContain('mailto:a@b.cl')
  })
})

describe('hasVisibleText', () => {
  it('reconoce contenido real', () => {
    expect(hasVisibleText('<p>Hola</p>')).toBe(true)
  })

  it('detecta el módulo vacío disfrazado de marcado', () => {
    expect(hasVisibleText('')).toBe(false)
    expect(hasVisibleText('<p></p><br><hr>')).toBe(false)
    expect(hasVisibleText('<p>&nbsp;&nbsp;</p>')).toBe(false)
  })

  it('un contenido que era solo script queda vacío tras sanear', () => {
    expect(hasVisibleText(sanitizeModuleHtml('<script>alert(1)</script>'))).toBe(false)
  })
})
