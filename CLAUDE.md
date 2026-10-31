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
- Fotos en **R2**, bucket `reporte-diario-polar-fotos` (binding `FILES`); en la compu van a `uploads/`.
- Secretos: `AI_API_KEY` es un *secret* del Worker (`npx wrangler secret put AI_API_KEY`); el resto de la configuración está en `vars` de `wrangler.jsonc`.
- Publicar: `npx wrangler deploy`. Cambios de esquema: editar `schema.sql` y aplicarlos a D1 con
  `npx wrangler d1 execute reporte-diario-polar --remote --command "ALTER TABLE ..."` (D1 no reaplica `schema.sql` solo).
- Probar antes de publicar: `npx wrangler d1 execute reporte-diario-polar --local --file schema.sql` y `npx wrangler dev --local`.

## Arquitectura
| Archivo | Qué es |
|---|---|
| `app.mjs` | Toda la lógica y la API (`/api/*`). Esquema del formulario `FORM`, validación, cálculos, IA. Recibe un adaptador de base async `{ get, all, run }` y uno de fotos `{ put, get }`. |
| `worker.mjs` | Arranque en Cloudflare: adaptadores D1 y R2 + archivos de `public/` (vía `ASSETS`). |
| `server.mjs` | Arranque local: Node + SQLite (`data.db`), puertos 3000 (app) y 3001 (admin). Útil para desarrollo. |
| `schema.sql` | Tablas: users, sessions (vencen a los 30 días), reports, weekly, trucks, settings, login_fails; Calidad: qrecords, lots, counters, alerts. |
| `test.mjs` | Prueba de la API y los cálculos con SQLite en memoria: `node test.mjs`. |
| `public/app.js` | Toda la interfaz (SPA con hash routing, Tailwind por CDN). La comparten `index.html` (app/teléfono) y `admin.html` (panel web). |

## Funcionalidad clave
- **Formulario PL-FOR-26** (13 secciones) definido en `FORM` (`app.mjs`). Campos `auto: true` los calcula el servidor:
  - Vehículos: km inicial = km final anterior de la unidad; recorrido = final − inicial. Solo se aceptan **camiones registrados de la planta**.
  - Gas: casillas N/A (tanque que no aplica / "no hubo carga") vía `disables`.
  - Material (sección 7): **recibido y entregado del día salen de Calidad** (REC y entregas de LIB, `movimientos()`), no se capturan;
    el encargado solo anota lo procesado. Saldo en planta = saldo anterior + recibido − entregado; pendientes por procesar =
    pendientes anteriores + recibido − procesado (se arrastran por planta + cliente + pieza). Los movimientos del día cuentan solo
    en el primer reporte de la planta ese día.
  - Mantenimiento: los pendientes abiertos del último reporte de la planta se copian solos.
  - Totales de hornos/ciclos, gastos y gas; químicos PT/A pasan a "químicos que hay que pedir".
  - Fotos (`type: 'photos'`, en gas, visitas, incidencias y gastos): el teléfono las reduce a JPEG ≤1600 px, se suben a `/api/upload`
    y el reporte guarda solo sus claves; el PL-FOR-26 las imprime como "Anexos".
- **Borrador**: el formulario se guarda en `localStorage` mientras se llena (uno por día) y se recupera si se cierra la página.
- **Corregir un reporte**: el encargado, el suyo de hoy; **el admin, cualquiera** (regla: todo reporte y formato nuevo debe poder
  corregirlo el admin). Se recalcula contra los reportes anteriores (`carry(plant, before)`) y después se vuelven a calcular los
  saldos de material de los siguientes de la planta (`saldar`); se vuelve a calificar. Check lists, plática y mantenimiento:
  el admin los corrige desde el registro (`#/fmtedit/FOLIO`, `POST /api/calidad/formato/editar`, mismo folio). REC y LIB no se
  corrigen (mueven lotes); el NC se actualiza mientras está abierto.
- **Reportes del admin**: filtros por planta y fechas (`GET /api/reports?planta=&desde=&hasta=&id=`) y exportar a CSV para Excel.
- **Personalización del formulario** (pestaña Formulario, solo admin, **control total**): renombrar, quitar (ocultar) cualquier sección o pregunta,
  hacerla obligatoria o no (`fields[k].required`), agregar preguntas propias (`x_...`) y **subpreguntas** (`padre` + `cuando` opcional: van
  adentro de otra pregunta de la sección y solo se ven/exigen con esa respuesta; `syncSubs` en la app, `clean` en el servidor). Los campos de
  `PROTECTED` los usa un cálculo: si se quitan, ese cálculo queda vacío. Solo la 1ª columna de una tabla fija no se quita (`canHide`). La config va en
  `settings.form` y se valida con `cleanConfig`. **Con IA**: la IA solo *propone* y el admin aplica o descarta.
- **IA** (proveedor compatible con OpenAI, `AI_BASE_URL`): califica cada reporte (resumen, calidad 0-100, retroalimentación), resumen semanal,
  propuestas del formulario. Modelo **claude-haiku-5.5** (más listo que deepseek-v4-flash y casi igual de barato; gpt-oss-120b tardaba ~1 min). Al reporte solo se le mandan las respuestas con valor (`formatAnswers`) para gastar menos tokens. Si la IA falla, el reporte se guarda
  igual como "Sin evaluar".
- **Cuentas**: autoregistro queda *pendiente* hasta que un admin lo aprueba con planta; el admin también crea cuentas, cambia roles
  (encargado ↔ admin; no el propio) y elimina (quita acceso, conserva reportes). `ADMIN_EMAIL` entra directo como admin.
  Roles en la base: `admin` y `colaborador` (se muestra como "Encargado").
  El admin pone contraseña nueva a otra cuenta; cada quien cambia la suya en "Mi cuenta" (`#/cuenta`, pide la actual).
  5 intentos fallidos de inicio de sesión bloquean ese correo 15 minutos.
- **Solo admin** ve el PL-FOR-26 armado (imprimible) — el encargado ve su calificación y retroalimentación.
- Vista de **computadora** (≥1024px): menú lateral y más columnas, con clases `lg:` + `WIDE` en `public/app.js`; teléfono sin cambios.

- **Nómina** (`#/nomina/<pestaña>`, antes el artefacto "Nómina POLAR"): tablas `nom_emps`, `nom_incs`, `nom_cierres`; config en `settings.nomina`.
  El admin ve todo (pestaña Nómina con totales, cierres, sueldos y parámetros). Todo encargado nuevo trae acceso; el admin lo quita o lo da con la casilla "Nómina" en Cuentas
  (`users.nomina`) y ve Capturar, Incidencias, Bonos, Vacaciones y Empleados **de su planta y sin montos**: el servidor quita sueldos y la cantidad
  de bonos/descuentos (`empOut` / `incOut`). Áreas: Querétaro, Silao y Administración. El cálculo de la semana lo hace el panel del admin.
  **Periodo de pago por planta** (Parámetros, `settings.nomina`): día de inicio de la semana (`inicio`) y `desfase` (−1 = semana en curso,
  0 = última completa, 1-2 = semanas de atraso; p. ej. Querétaro paga del 26 al 1 y Silao del 19 al 25 el mismo sábado) — `periodo()`.
  **Asistente IA** (pestaña solo admin, `POST /api/nomina/ai`): chat que acepta Excel .xlsx o CSV (se leen en el navegador sin librerías,
  `leerArchivo`) y **solo propone** altas/cambios de empleados e incidencias (`cleanNomCambios`); el admin edita o quita cada propuesta y
  "Aplicar" las guarda con las rutas normales (`nomAplicar`). Las pestañas de captura manual siguen igual Botón "Limpiar historial" del chat.
  **Tipo de empleado** (`contrato`, `CONTRATOS`): de planta, provisional (temporales: albañiles…) o de confianza (jefes). Los de confianza y sus
  incidencias solo los ve el admin: `nomEmp` / `GET /api/nomina` no se los dan a nadie más (tampoco salen en la plática PL-FOR-25).
  **Dar de baja / Reactivar** (todos los que capturan nómina): pone o quita la fecha de baja; los dados de baja van en su propia lista.
  **Borrar empleado**: cualquier admin; se borran también sus incidencias sin pagar.

- **Check list del líder de grupo PL-FOR-43 (MOD-009)**: rol `lider` (Cuentas, siempre con planta); el servidor solo le deja las rutas de
  `LIDER_OK` (se valida en `handleApi`, no solo en la interfaz). Pantalla `#/cll` (SÍ / NO / N/A; NO pide observación y foto en los puntos 📷;
  avance en `localStorage`). Uno por planta al día en `qrecords` (kind `CLL`, folio `CLL-QRO-AAAAMMDD-T1`, no se edita). Resultado automático
  (`CLL_RES`; NO en punto crítico → URGENTE + alerta). Catálogo editable por el admin en `settings.cll` (`cleanCll`, inicial `CLL_INI`, horas de aviso).
  Se ve arriba del reporte del encargado de esa planta y fecha (`cllPanel`), que marca cada NO / incidencia ATENDIDO o PENDIENTE (`/api/cll/atender`);
  lo no atendido sale como pendiente del día siguiente (`pendientesCll`); NO en puntos `mant` abre pendiente de mantenimiento (`pendientesAbiertos`);
  el PL-FOR-26 imprime el PL-FOR-43 como anexo. Avisos 19:00 / 20:00 y urgentes solo dentro de la app (`avisosCll`; sin notificaciones al celular).

## Cómo probar
`node test.mjs` (base en memoria, sin IA) cubre cálculos, permisos, edición, fotos, login y el flujo de Calidad (REC → LIB → NC). Además: scripts de Node contra la API
(`fetch`) usando cuentas temporales `tmp*@polar.test` que se borran al final, y el navegador. Nunca dejar datos de prueba en producción.

## Calidad ISO 9001 (etapa 1)
Especificación: `Modificaciones App Polar/MOD_APP_POLAR_SGC_ISO9001.md` (pedido de Rodrigo, con etapas 1-3 y criterios de aceptación).
- Formatos `QFORMS` en `app.mjs` (mismo esquema que `FORM`): **PL-FOR-28 Recepción (REC)**, **PL-FOR-29 Inspección y liberación (LIB)**,
  **PL-FOR-30 No conforme (NC)**. Folios `REC-0001`… consecutivos por tipo (`counters`, `INSERT … RETURNING`), no editables.
- Cada partida de REC crea un **lote POLAR** `QRO|SIL-AAAAMMDD-NN` (tabla `lots`): EN PLANTA → LIBERADO / RETENIDO → ENTREGADO.
- **Entregas parciales**: un lote se libera y se entrega por partes (cada PL-FOR-29 inspecciona una parte; no más de lo que queda).
  El lote sigue EN PLANTA mientras le falten piezas por liberar (`avanceLotes` / `estadoLote`). La recepción PL-FOR-28 queda
  **abierta** hasta entregar todo lo recibido (lo rechazado no cuenta): `recepcionesAbiertas`, lista "Piezas pendientes por entregar"
  en Calidad, chip "Abierta" en registros, renglón "Entrega" del documento y luz en el semáforo del admin. Lo entregado del día
  (sección 7) sale de cada PL-FOR-29 entregado (`movimientos`).
- Reglas: REC con diferencia o algún "No" → aviso + botón "Crear no conforme" precargado. LIB con algún NOK no permite LIBERADO;
  NOK o RETENIDO → lote RETENIDO y pide NC. No se entrega sin LIBERADO (`entregaDe`). NC abierto retiene sus lotes; al cerrarlo
  (con fecha) vuelven a EN PLANTA (`syncLots`). 8D sugerido: lo detectó el cliente, >1 lote, daño con costo, o mismo cliente + tipo en 90 días.
- Alertas dentro de la app (`alerts`, solo gerencia/admin, insignia en el menú "Calidad"): nuevo NC; además se calculan: lote > 7 días
  EN PLANTA (`LOT_DAYS`) y lote RETENIDO sin NC abierto.
- Catálogo de clientes por planta con especificación particular (criterio 7) y teléfono de gerencia (franja roja de emergencia):
  `settings.calidad`, se edita en Calidad (admin). Inicial: KH México y Mitchell (Querétaro), Summit Silao y Summit Guanajuato (Silao).
- Encargado: solo su planta; admin (= gerencia): todas. Documento imprimible de cada registro con pie "Documento controlado".
- Decisiones de las dudas del documento (sección 12), ajustables: lote `PLANTA-AAAAMMDD-consecutivo`, alerta a los 7 días, firma = usuario que guarda.
- **Formatos de operación** (`FORMATOS` en `app.mjs`, mismo motor y tabla `qrecords`): check lists PL-FOR-21 camión (CL21), 22 gas (CL22),
  23 horno (CL23), plática PL-FOR-25 (PLA, asistentes = empleados de Nómina) y mantenimiento PL-FOR-35 (MT: cierra el pendiente si queda
  FUNCIONANDO; un trabajo nuevo que NO FUNCIONA abre pendiente — ver `pendientesAbiertos`). **Obligatorios 1 vez por semana** (lunes a hoy)
  por planta; el PL-FOR-21 por cada unidad que no es montacargas (`GET /api/semana`, botones del inicio y semáforo del admin).
  El último check list de cada unidad sale solo del PL-FOR-21. Check list RECHAZADO → alerta a gerencia.
- **Documentos**: PDF vigentes en `public/docs` (de la carpeta de Drive "Modificaciones App Polar"); solo con sesión (`worker.mjs` / `server.mjs`).
- **Pendiente (etapas 2 y 3):** quejas PL-FOR-31, PL-FOR-24 (no está en los archivos), calibración PL-FOR-36, tablero de
  indicadores, lista maestra de documentos (consulta de PDF), formatos de gerencia (8D, auditorías, proveedores, revisión por la dirección),
  correo a gerencia, rol "administración".

## Pendientes conocidos
- No existe "olvidé mi contraseña" por correo (el admin pone una nueva).
- No hay firma digital.
- Las fotos subidas que no se envían en un reporte quedan huérfanas en R2.
- El dashboard en Stitch aún dice "Proyectos activos"/"Bloqueos"; la app usa "Material por cliente"/"Incidencias del día".
