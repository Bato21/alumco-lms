# Miro — CONTINUAR build (board nuevo, login centro)

**Board:** https://miro.com/app/board/uXjVHEiXcBM=/  (team Bootcamp)
Tarjeta: width=520 (alto auto ~263). Login centro, colaborador ARRIBA (y−), admin ABAJO (y+).

## YA HECHO (5 img + 3 flechas)
- login (0,0), register (−820,0), olvido (820,0), dashboardUsuario (0,−560), cursosUsuario (−1440,−980).
- Flechas: login→register "Solicitar acceso", login→olvido "¿Olvidó su clave?", login→dashboardUsuario "Entrar como usuario".

## MÉTODO por imagen (lotes de 5)
1. `image_get_upload_url(miro_url=board, content_type=image/png, x, y, width=520, title)` → da upload_url+token.
2. `curl -X PUT -H 'Content-Type: image/png' --data-binary @ARCHIVO 'upload_url'`.
3. `image_create(miro_url=board, image_token=token)`.
NO ráfagas grandes (Miro throttlea "try again later"); de 5 en 5.
Para flechas luego: `board_list_items(item_type=image)` → mapear id por posición → `connector_create(start_item, end_item, caption, stroke_color, end_stroke_cap=stealth)`. Salmón `#d98b7d` flujo principal, gris `#9aa0ad` menú/filtros.

## FALTAN — coordenadas exactas (archivo en capturas/<carpeta>/<file>.png)

### TRABAJADOR (arriba)
- cursosProgreso (−720,−980) · cursosCompletados (0,−980) · cursosSinIniciar (720,−980) · iniciarCurso (1440,−980)
- iniciarModulo (1440,−1400) · videoTerminado (720,−1400) · siguienteModuloPdf (0,−1400) · pdfLeido (−720,−1400) · descargarPdf (−1440,−1400)
- contactarAdmin (−1440,−1820) · comenzarQuiz (−720,−1820) · responderQuiz (0,−1820) · cursoAprobado (720,−1820) · reintentarQuiz (1440,−1820)
- siguienteModuloQuiz (1440,−2240) · cursoFinalizado (720,−2240) · misCertificados (0,−2240) · verCertificado (−720,−2240) · miPerfil (−1440,−2240)
- alertasUsuario (−1440,−2660) · busquedaUsuario (−720,−2660)
(carpeta: Usuario/)

### ADMIN (abajo)
- dashboardAdmin (0,560)  ← flecha login→dashboardAdmin "Entrar como admin"
- cursosAdmin (−1440,980) · cursosPublciados (−720,980) · cursosBorradores (0,980) · nuevoCurso (720,980) · seleccionarAreas (1440,980)
- creacionModulos (1440,1400) · crearVideo (720,1400) · crearPdf (0,1400) · crearQuiz (−720,1400) · eliminarCurso (−1440,1400)
- trabajadores (−1440,1820) · solicitudesPendientes (−720,1820) · trabajadoresSuspendidos (0,1820) · filtroAreaTrab (720,1820) · filtroSede (1440,1820)
- detalleTrabajador (1440,2240) · editarTrabajador (720,2240) · suspenderTrabajador (0,2240) · sedes (−720,2240) · desactivarSede (−1440,2240)
- sedePrueba (−1440,2660) · reportes (−720,2660) · detalleReporte (0,2660) · filtroAreaRep (720,2660) · filtroEstadoRep (1440,2660)
- filtroSedeRep (1440,3080) · exportarCSVRep (720,3080) · Certificados (0,3080) · verCert (−720,3080) · descargarCert (−1440,3080)
- filtroNombreCert (−1440,3500) · filtroInicioCert (−720,3500) · filtroFinCert (0,3500) · exportarCSVCert (720,3500) · miPerfilAdmin (1440,3500)
- subirFirma (1440,3920) · alertas (720,3920) · busqueda (0,3920)
(carpeta: Admin/, ojo: Certificados.png mayúscula, cursosPublciados sin 'i')

## FLECHAS principales a crear (tras subir todo)
login→dashboardAdmin "Entrar como admin"
dashboardUsuario→cursosUsuario "Ver mis cursos" · cursosUsuario→iniciarCurso "Abrir curso" · iniciarCurso→iniciarModulo "Abrir módulo" · iniciarModulo→comenzarQuiz "Evaluación" · comenzarQuiz→responderQuiz "Comenzar" · responderQuiz→cursoAprobado "Aprobar" · cursoAprobado→misCertificados "Certificado" · misCertificados→verCertificado "Ver"
dashboardAdmin→cursosAdmin "Cursos" · cursosAdmin→nuevoCurso "Nueva capacitación" · nuevoCurso→creacionModulos "Agregar módulos" · dashboardAdmin→trabajadores "Trabajadores" · trabajadores→detalleTrabajador "Ver" · dashboardAdmin→sedes "Sedes" · dashboardAdmin→reportes "Reportes" · dashboardAdmin→Certificados "Certificados" · miPerfilAdmin→subirFirma "Firma"
(filtros/variantes: flechas gris #9aa0ad desde su pantalla padre, opcional)
