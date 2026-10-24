-- Esquema de la base: lo usa server.mjs (SQLite en la compu) y se aplica a Cloudflare D1 con wrangler.
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, pass TEXT NOT NULL, nomina INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'colaborador', plant TEXT, status TEXT NOT NULL DEFAULT 'activo');
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created INTEGER NOT NULL DEFAULT 0); -- created: ms (vence a los 30 días)
CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, date TEXT NOT NULL, answers TEXT NOT NULL,
  summary TEXT, score INTEGER, feedback TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, plant TEXT, UNIQUE(user_id, date));
CREATE TABLE IF NOT EXISTS weekly(id INTEGER PRIMARY KEY, start TEXT NOT NULL, end TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS trucks(id INTEGER PRIMARY KEY, plant TEXT NOT NULL, name TEXT NOT NULL, horometro INTEGER NOT NULL DEFAULT 0, UNIQUE(plant, name));
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
-- Intentos fallidos de inicio de sesión por correo: al 5º se bloquea 15 minutos (until, en ms).
CREATE TABLE IF NOT EXISTS login_fails(email TEXT PRIMARY KEY, n INTEGER NOT NULL, until INTEGER NOT NULL DEFAULT 0);
-- Calidad ISO 9001 (etapa 1): PL-FOR-28 recepción (REC), PL-FOR-29 liberación (LIB), PL-FOR-30 no conforme (NC).
-- Folio consecutivo por tipo (no se edita); data = respuestas en JSON; status: REC CONFORME/CON OBSERVACIONES,
-- LIB LIBERADO/ENTREGADO/RETENIDO/RETRABAJO, NC ABIERTO/CERRADO.
CREATE TABLE IF NOT EXISTS qrecords(folio TEXT PRIMARY KEY, kind TEXT NOT NULL, plant TEXT NOT NULL, date TEXT NOT NULL, user_id INTEGER NOT NULL,
  status TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
-- Lote POLAR (QRO-20261007-01): uno por partida de recepción. status: EN PLANTA → LIBERADO / RETENIDO → ENTREGADO.
CREATE TABLE IF NOT EXISTS lots(code TEXT PRIMARY KEY, plant TEXT NOT NULL, client TEXT NOT NULL, part TEXT NOT NULL, qty INTEGER NOT NULL,
  proceso TEXT, rec TEXT NOT NULL, status TEXT NOT NULL, received TEXT NOT NULL, due TEXT, lib TEXT, delivered TEXT, delivered_qty INTEGER);
-- Consecutivos de folios (REC, LIB, NC) y de lotes por planta y día.
CREATE TABLE IF NOT EXISTS counters(key TEXT PRIMARY KEY, n INTEGER NOT NULL);
-- Alertas a gerencia dentro de la app (p. ej. nuevo no conforme). seen = ya la vio un admin.
CREATE TABLE IF NOT EXISTS alerts(id INTEGER PRIMARY KEY, plant TEXT, folio TEXT, text TEXT NOT NULL, seen INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
-- Nómina (antes artefacto "Nómina POLAR"). users.nomina = 1: el encargado tiene acceso (sin montos); el admin ve todo.
-- area: Querétaro, Silao o Administración. data = JSON (nombre, sueldo, bono, ingreso, …).
CREATE TABLE IF NOT EXISTS nom_emps(id INTEGER PRIMARY KEY, area TEXT NOT NULL, data TEXT NOT NULL);
-- Incidencia (falta, tiempo extra, vacación, bono…). aplicado = ya se pagó en un cierre; data = cantidad, nota, diferido, efectivo, mes, aplicadoEn.
CREATE TABLE IF NOT EXISTS nom_incs(id INTEGER PRIMARY KEY, emp_id INTEGER NOT NULL, tipo TEXT NOT NULL, fecha TEXT NOT NULL,
  aplicado INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL, user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
-- Semana cerrada (sábado de pago): renglones pagados e ids de las incidencias que se marcaron como pagadas.
CREATE TABLE IF NOT EXISTS nom_cierres(payday TEXT PRIMARY KEY, data TEXT NOT NULL);
