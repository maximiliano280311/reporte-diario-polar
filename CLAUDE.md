# Reporte Diario Polar — contexto del proyecto

App web para **Retrabajos Industriales y Limpiezas Especializadas Polar**: los encargados de planta llenan el reporte diario
**PL-FOR-26 (rev. 06) "Reporte diario de operación e incidencias"** y los administradores lo revisan, lo imprimen y ven un resumen semanal.

## Reglas que siempre aplican
- **Todo el texto de la app va en español (es-MX).** Fechas en hora de México (`America/Mexico_City`).
- Solo hay **dos plantas: Querétaro y Silao** (constante `PLANTS` en `app.mjs` y en `public/app.js`; si cambian, cambiar ambas).
- Diseño: proyecto de Google Stitch **"Remix of Daily Form Dashboard"** (id `12341384296751765826`, design system "Sapphire Pulse").
  Usar solo ese proyecto. El dashboard (`views.inicio` en `public/app.js`) viene de su pantalla "Dashboard Principal";
  los tokens de Tailwind de `public/app.js` son los de ese design system.
- Estilo de código: mínimo y directo, sin dependencias nuevas (no hay `package.json`; solo Node 24 y `npx wrangler`).

## Producción
- **URL:** https://reporte-diario-polar.maxelpiloto3.workers.dev (panel admin en `/admin`).
- Corre en **Cloudflare Workers** (`worker.mjs`) con base **Cloudflare D1** `reporte-diario-polar`
  (id `78c10631-073e-452f-9170-d3cef3c9484d`). **Los datos reales viven en D1**, no en `data.db`.
- Plan: Workers Paid ($5/mes) — el hash de contraseñas (scrypt) necesita más CPU que el plan gratis.
- Secretos: `AI_API_KEY` es un *secret* del Worker (`npx wrangler secret put AI_API_KEY`); el resto de la configuración está en `vars` de `wrangler.jsonc`.
- Publicar: `npx wrangler deploy`. Cambios de esquema: editar `schema.sql` y aplicarlos a D1 con
  `npx wrangler d1 execute reporte-diario-polar --remote --command "ALTER TABLE ..."` (D1 no reaplica `schema.sql` solo).
- Probar antes de publicar: `npx wrangler d1 execute reporte-diario-polar --local --file schema.sql` y `npx wrangler dev --local`.

## Arquitectura
| Archivo | Qué es |
|---|---|
| `app.mjs` | Toda la lógica y la API (`/api/*`). Esquema del formulario `FORM`, validación, cálculos, IA. Recibe un adaptador de base async `{ get, all, run }`. |
| `worker.mjs` | Arranque en Cloudflare: adaptador D1 + archivos de `public/` (vía `ASSETS`). |
| `server.mjs` | Arranque local: Node + SQLite (`data.db`), puertos 3000 (app) y 3001 (admin). Útil para desarrollo. |
| `schema.sql` | Tablas: users, sessions, reports, weekly, trucks, settings. |
| `public/app.js` | Toda la interfaz (SPA con hash routing, Tailwind por CDN). La comparten `index.html` (app/teléfono) y `admin.html` (panel web). |

## Funcionalidad clave
- **Formulario PL-FOR-26** (13 secciones) definido en `FORM` (`app.mjs`). Campos `auto: true` los calcula el servidor:
  - Vehículos: km inicial = km final anterior de la unidad; recorrido = final − inicial. Solo se aceptan **camiones registrados de la planta**.
  - Gas: casillas N/A (tanque que no aplica / "no hubo carga") vía `disables`.
  - Material (sección 7, diseño del boceto "[33] piezas modelo/No. Parte [r6gk]"): saldo en planta = saldo anterior + piezas − entregado;
    pendientes por procesar = pendientes anteriores + piezas − procesado. Ambos se arrastran por planta + cliente + pieza.
  - Mantenimiento: los pendientes abiertos del último reporte de la planta se copian solos.
  - Totales de hornos/ciclos, gastos y gas; químicos PT/A pasan a "químicos que hay que pedir".
- **Personalización del formulario** (pestaña Formulario, solo admin): renombrar secciones/preguntas, ocultar las no protegidas,
  agregar preguntas propias (`x_...`). Los campos en `PROTECTED` los usan los cálculos: se renombran pero no se ocultan. La config va en
  `settings.form` y se valida con `cleanConfig`. **Con IA**: la IA solo *propone* y el admin aplica o descarta.
- **IA** (proveedor compatible con OpenAI, `AI_BASE_URL`): califica cada reporte (resumen, calidad 0-100, retroalimentación), resumen semanal,
  propuestas del formulario. Modelo **gpt-6-luna**: el más barato que pasó las pruebas reales (calificar un reporte malo con nota baja y
  no ocultar campos protegidos). Si la IA falla, el reporte se guarda igual como "Sin evaluar".
- **Cuentas**: autoregistro queda *pendiente* hasta que un admin lo aprueba con planta; el admin también crea cuentas, cambia roles
  (encargado ↔ admin; no el propio) y elimina (quita acceso, conserva reportes). `ADMIN_EMAIL` entra directo como admin.
  Roles en la base: `admin` y `colaborador` (se muestra como "Encargado").
- **Solo admin** ve el PL-FOR-26 armado (imprimible) — el encargado ve su calificación y retroalimentación.
- Vista de **computadora** (≥1024px): menú lateral y más columnas, con clases `lg:` + `WIDE` en `public/app.js`; teléfono sin cambios.

## Cómo probar
No hay framework de pruebas: se prueba con scripts de Node contra la API (`fetch`) usando cuentas temporales `tmp*@polar.test`
que se borran al final, y con el navegador. Nunca dejar datos de prueba en producción.

## Pendientes conocidos
- No existe "olvidé mi contraseña" ni que el admin restablezca contraseñas.
- No se pueden adjuntar fotos/tickets (el formato en papel los pide) ni firma digital.
- El dashboard en Stitch aún dice "Proyectos activos"/"Bloqueos"; la app usa "Material por cliente"/"Incidencias del día".
