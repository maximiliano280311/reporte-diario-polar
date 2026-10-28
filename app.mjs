// Lógica de la app (API). La usan server.mjs (Node + SQLite en la compu) y worker.mjs (Cloudflare Workers + D1).
// db: { get(sql, ...params), all(sql, ...params), run(sql, ...params) → { changes, lastInsertRowid } } — todos async.
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

// Cuestionario = formato PL-FOR-26 rev. 06 (Reporte diario de operación e incidencias).
// Sección 1: fecha, planta y elaboró se llenan solos; solo se pregunta el turno.
// Campo: { id, label, type: text|textarea|number|select|date|time|checks|photos, options, required, list (sugerencias), wide, after (va después de la tabla) }
// Tabla: renglones repetibles. Columnas con auto: true las calcula el servidor (no se preguntan).
const SN = ['Sí', 'No'];
const PLANTS = ['Querétaro', 'Silao']; // únicas plantas (también en public/app.js)
const badPlant = () => Object.assign(new Error('Elige una planta: Querétaro o Silao'), { code: 400 });
const FORM = [
  { n: 1, title: 'Datos generales', fields: [{ id: 'turno', label: 'Turno', type: 'select', options: ['Matutino', 'Vespertino', 'Nocturno'], required: true }] },
  { n: 2, title: 'Personal', hint: 'Tipo: F = falta, P = permiso, V = vacaciones, R = reporte (llamada de atención o acta administrativa). Una persona por renglón.',
    fields: [{ id: 'presentes', label: 'Presentes', type: 'number', required: true }, { id: 'faltas', label: 'Faltas', type: 'number' },
      { id: 'permisos', label: 'Permisos', type: 'number' }, { id: 'vacaciones', label: 'Vacaciones', type: 'number' },
      { id: 'hubo_reportes', label: '¿Hubo reportes de personal? (llamada de atención / acta)', type: 'select', options: SN, required: true, wide: true },
      { id: 'reportes_n', label: '¿Cuántos?', type: 'number' }],
    table: { id: 'personal', item: 'persona', cols: [{ id: 'nombre', label: 'Nombre', wide: true }, { id: 'tipo', label: 'Tipo', type: 'select', options: ['F', 'P', 'V', 'R'] },
      { id: 'justif', label: '¿Justif.? (faltas)', type: 'select', options: SN }, { id: 'motivo', label: 'Motivo / detalle', wide: true }, { id: 'autorizo', label: '¿Quién autorizó?', wide: true }] } },
  { n: 3, title: 'Vehículos (cada unidad que se movió hoy)', hint: 'El km / horómetro inicial se llena solo con el final de la última vez que se usó la unidad. Montacargas: anotar horómetro. Check list con más de 7 días: hacerlo antes de mover la unidad.',
    // Vehículo: sus opciones son los camiones de la planta (los registra el admin); el cliente las llena.
    table: { id: 'vehiculos', item: 'vehículo', cols: [{ id: 'vehiculo', label: 'Vehículo', type: 'select', options: [], wide: true }, { id: 'km_ini', label: 'Km / horómetro inicial', type: 'number' },
      { id: 'km_fin', label: 'Km / horóm. final', type: 'number' }, { id: 'recorrido', label: 'Recorrido', auto: true }, { id: 'checklist', label: 'Último check list', type: 'date' },
      { id: 'obs', label: 'Observaciones (fallas, golpes, llantas)', wide: true }] } },
  { n: 4, title: 'Gas', hint: 'Leer el medidor al iniciar y al terminar el día. Si hubo carga de gas, anotar litros e importe y anexar el ticket.',
    table: { id: 'gas', fixed: ['Gas bodega / hornos', 'Gas montacargas', 'Otro: '], cols: [{ id: 'tanque', label: 'Tanque' }, { id: 'na', label: 'N/A', type: 'check', disables: ['pct_ini', 'pct_fin', 'sin_carga', 'litros', 'importe'] },
      { id: 'pct_ini', label: '% inicial', type: 'number' }, { id: 'pct_fin', label: '% final', type: 'number' },
      { id: 'sin_carga', label: 'Litros cargados: N/A (no hubo carga)', type: 'check', wide: true, disables: ['litros', 'importe'] },
      { id: 'litros', label: 'Litros cargados', type: 'number' }, { id: 'importe', label: 'Importe carga ($)', type: 'number' }] },
    fields: [{ id: 'fotos_gas', label: 'Fotos de tickets', type: 'photos', wide: true, after: true }] },
  { n: 5, title: 'Hornos', hint: 'El total de hornos y de ciclos se calcula solo.', table: { id: 'hornos', item: 'horno', cols: [{ id: 'horno', label: 'Horno (Pirólisis #)' }, { id: 'ciclos', label: 'No. de ciclos', type: 'number' },
    { id: 'cliente', label: 'Cliente / material', list: 'clientes', wide: true }, { id: 'hora_ini', label: 'Hora inicio', type: 'time' }, { id: 'hora_fin', label: 'Hora fin', type: 'time' },
    { id: 'obs', label: 'Observaciones', wide: true }] } },
  { n: 6, title: 'Químicos', hint: 'Existencia: S = suficiente, PT = por terminarse, A = agotado. Si alguno está por terminarse o agotado, avisar a gerencia ese mismo día. Unidad: barril, L o kg.',
    table: { id: 'quimicos', item: 'químico', cols: [{ id: 'quimico', label: 'Químico (nombre / tipo)', wide: true }, { id: 'proceso', label: 'Proceso en que se usó', wide: true },
      { id: 'cantidad', label: 'Cantidad usada', type: 'number' }, { id: 'unidad', label: 'Unidad', type: 'select', options: ['Barril', 'L', 'Kg'] },
      { id: 'existencia', label: 'Existencia', type: 'select', options: ['S', 'PT', 'A'] }, { id: 'queda', label: '¿Cuánto queda?' }] },
    fields: [{ id: 'pedir', label: 'Otros químicos que hay que pedir (los PT y A se agregan solos)', wide: true }] },
  // Recibido y entregado salen de Calidad (PL-FOR-28 recepción / PL-FOR-29 entrega) del día: aquí solo se captura lo procesado.
  { n: 7, title: 'Material por cliente (piezas)', hint: 'Lo recibido y lo entregado hoy salen solos de las recepciones (PL-FOR-28) y entregas (PL-FOR-29) del día; aquí solo anota lo procesado. Si es puntie anotar (P) junto a la pieza. Se calculan solos: saldo en planta = saldo anterior + recibido − entregado; pendientes por procesar = pendientes anteriores + recibido − procesado.',
    table: { id: 'material', item: 'pieza', cols: [{ id: 'cliente', label: 'Cliente', list: 'clientes' }, { id: 'pieza', label: 'Modelo/No. Parte', list: 'piezas' },
      { id: 'folio', label: 'Folios REC / LIB', auto: true }, { id: 'cantidad', label: 'Recibido hoy (PL-FOR-28)', auto: true },
      { id: 'saldo_ant', label: 'Saldo anterior', auto: true },
      { id: 'procesado', label: 'Procesado hoy', type: 'number' },
      { id: 'entregado', label: 'Entregado hoy (PL-FOR-29)', auto: true }, { id: 'saldo', label: 'Saldo en planta', auto: true },
      { id: 'pendientes', label: 'Pendientes por procesar', auto: true }] },
    fields: [{ id: 'sin_material', label: 'Clientes que no enviaron material', wide: true, after: true }] },
  { n: 8, title: 'Actividades realizadas', hint: 'Otras actividades — Tipo: R = rutinaria (se hace seguido pero no está en la lista), E = extraordinaria (trabajo especial o fuera de lo normal).',
    fields: [{ id: 'actividades', label: 'Marca las que se hicieron', type: 'checks', options: ['Recolección de material', 'Entrega de material', 'Lavado de material',
      'Proceso en pirólisis', 'Armado de carritos / pallets', 'Limpieza de hornos', 'Limpieza de bodega / áreas', 'Limpieza de baños', 'Áreas verdes (pasto / ramas)',
      'Revisión de fugas de gas', 'Nivel de aceite hidrolavadora', 'Plática de seguridad (registrar en PL-FOR-25)'] }],
    table: { id: 'otras', item: 'actividad', cols: [{ id: 'descripcion', label: 'Otra actividad / extraordinaria', wide: true }, { id: 'tipo', label: 'Tipo', type: 'select', options: ['R', 'E'] },
      { id: 'horas', label: 'Tiempo (hrs)', type: 'number' }, { id: 'quien', label: '¿Quién la hizo?', wide: true }] } },
  { n: 9, title: 'Visitas a la planta', hint: 'Tipo: PR = proveedor, CL = cliente, GO = dependencia de gobierno, EM = solicitud de empleo, IN = informes / pregunta, OT = otro. Si es dependencia de gobierno avisar a gerencia de inmediato y tomar foto de cualquier documento que deje.',
    table: { id: 'visitas', item: 'visita', cols: [{ id: 'nombre', label: 'Nombre y teléfono', wide: true }, { id: 'empresa', label: 'Empresa / dependencia' },
      { id: 'tipo', label: 'Tipo', type: 'select', options: ['PR', 'CL', 'GO', 'EM', 'IN', 'OT'] }, { id: 'motivo', label: 'Motivo de la visita', wide: true },
      { id: 'atendio', label: 'Atendió y hora' }, { id: 'seguimiento', label: '¿Requiere seguimiento?', type: 'select', options: SN }] },
    fields: [{ id: 'fotos_visitas', label: 'Fotos de documentos', type: 'photos', wide: true, after: true }] },
  { n: 10, title: 'Incidencias del día', hint: 'Tipo: GA = gas, EL = eléctrica, EQ = equipo / herramienta, SE = seguridad / accidente, CA = calidad / rechazo, CL = cliente, PE = personal. Toda falla de equipo que no se resuelva hoy se pasa a mantenimiento. Fuga de gas, falla eléctrica, incendio o accidente: avisar por teléfono a gerencia de inmediato.',
    table: { id: 'incidencias', item: 'incidencia', empty: 'SIN INCIDENCIAS', cols: [{ id: 'tipo', label: 'Tipo', type: 'select', options: ['GA', 'EL', 'EQ', 'SE', 'CA', 'CL', 'PE'] },
      { id: 'hora', label: 'Hora', type: 'time' }, { id: 'que_paso', label: 'Qué pasó', type: 'textarea', wide: true },
      { id: 'impacto', label: 'Impacto (qué se dejó de hacer / atrasos)', wide: true }, { id: 'que_se_hizo', label: 'Qué se hizo / quién autorizó', wide: true },
      { id: 'aviso', label: '¿Se avisó?', type: 'select', options: SN }] },
    fields: [{ id: 'fotos_incidencias', label: 'Fotos', type: 'photos', wide: true, after: true }] },
  { n: 11, title: 'Mantenimiento — lista de pendientes', hint: 'Los pendientes ABIERTOS del día anterior se copian solos. Un pendiente solo deja de copiarse cuando se marca CERRADO con su fecha de cierre.',
    table: { id: 'mantenimiento', item: 'pendiente', cols: [{ id: 'detectado', label: 'Fecha en que se detectó', type: 'date' }, { id: 'equipo', label: 'Equipo' },
      { id: 'falla', label: 'Falla / qué se necesita', wide: true }, { id: 'responsable', label: 'Responsable' }, { id: 'compromiso', label: 'Fecha compromiso', type: 'date' },
      { id: 'costo', label: 'Costo ($)', type: 'number' }, { id: 'estatus', label: 'Estatus', type: 'select', options: ['Abierto', 'Cerrado'] },
      { id: 'cierre', label: 'Fecha de cierre', type: 'date' }] } },
  { n: 12, title: 'Gastos del día', hint: 'Anotar TODO lo que se compre o se pague, incluyendo reparaciones, refacciones y equipo nuevo. Anexar tickets o facturas.',
    table: { id: 'gastos', item: 'gasto', cols: [{ id: 'cant', label: 'Cant.', type: 'number' }, { id: 'importe', label: 'Importe ($)', type: 'number' },
      { id: 'concepto', label: 'Concepto', wide: true }, { id: 'pago', label: 'Forma de pago', type: 'select', options: ['T. Polar', 'Efectivo'] },
      { id: 'factura', label: '¿Factura?', type: 'select', options: SN }] },
    fields: [{ id: 'fotos_gastos', label: 'Fotos de tickets / facturas', type: 'photos', wide: true, after: true }] },
  { n: 13, title: 'Pendientes para mañana', fields: [{ id: 'manana', label: 'Pendientes para mañana', type: 'textarea', required: true, wide: true }] },
];
const num = v => Number(v) || 0;
const PHOTO = /^[a-f0-9]{32}\.jpg$/; // clave de una foto subida (R2 en Cloudflare, uploads/ en la compu)
const DAY = 86_400_000, SESSION_MS = 30 * DAY;
const matKey = m => `${m.cliente}|${m.pieza}`.trim().toLowerCase();

// ---------- Calidad ISO 9001, etapa 1 (ver "Modificaciones App Polar/MOD_APP_POLAR_SGC_ISO9001.md") ----------
// Cadena: REC (recepción, crea lotes) → LIB (inspección y liberación, entrega) / NC (no conforme). Folios consecutivos por tipo.
// Campos con src: sus opciones se llenan por planta (clientes del catálogo, lotes) — ver qform() en createApp.
const PLANT_CODE = { Querétaro: 'QRO', Silao: 'SIL' };
const PROCESOS = ['Pirólisis', 'Decapado', 'Lavado', 'Otro'];
// Catálogo inicial (CONTEXTO_SISTEMA_REPORTES_POLAR.md); el admin lo edita en Calidad. spec = criterio 7 de liberación.
const CLIENTES_INI = [{ name: 'KH México', plant: 'Querétaro', spec: '' }, { name: 'Mitchell', plant: 'Querétaro', spec: '' },
  { name: 'Summit Silao', plant: 'Silao', spec: '' }, { name: 'Summit Guanajuato', plant: 'Silao', spec: '' }];
const LOT_DAYS = 7; // alerta si un lote lleva más días EN PLANTA sin liberar (propuesta del documento; ajustable)
const CRITERIOS = ['Recubrimiento 100 % removido', 'Sin residuos de proceso', 'Sin residuo químico', 'Sin daño por temperatura',
  'Sin daño mecánico', 'Roscas y barrenos limpios', 'Especificación particular del cliente', 'Identificación conservada'];
const DISPOS = ['LIBERADO', 'LIBERADO CON DESVIACIÓN', 'RETENIDO / NO CONFORME', 'RETRABAJO INTERNO'];
const NC_TIPOS = ['Proceso incompleto', 'Daño por temperatura', 'Daño mecánico', 'Residuo químico', 'Faltante / pérdida', 'Pieza mezclada', 'Otro'];
const ESTADO_REC = [['empaque', 'Empaque OK'], ['sin_danos', 'Piezas sin golpes / óxido'], ['identificacion', 'Identificación legible'],
  ['cantidad_ok', 'Cantidad coincide'], ['fotos_ok', 'Fotos tomadas'], ['separado', 'Material separado']];
const ENTREGA = [{ id: 'entrega_fecha', label: 'Fecha de entrega', type: 'date' }, { id: 'remision_polar', label: 'Remisión POLAR' },
  { id: 'recibio', label: 'Recibió (cliente)' }, { id: 'foto_remision', label: 'Foto de la remisión firmada', type: 'photos', wide: true }];
const QFORMS = {
  REC: { code: 'PL-FOR-28', title: 'Recepción de material del cliente y trazabilidad', sections: [
    { n: 1, title: 'Encabezado', fields: [{ id: 'fecha', label: 'Fecha', type: 'date', required: true }, { id: 'hora', label: 'Hora', type: 'time', required: true },
      { id: 'cliente', label: 'Cliente', type: 'select', options: [], src: 'clientes', required: true, wide: true },
      { id: 'remision', label: 'Remisión / folio del cliente', required: true, wide: true },
      { id: 'transporte', label: 'Transporte', type: 'select', options: ['POLAR', 'Cliente', 'Fletera'] }, { id: 'placas', label: 'Placas' }] },
    { n: 2, title: 'Partidas', hint: 'Una por cada no. de parte. Diferencia = contada − remisión. El lote POLAR se asigna solo al guardar.',
      table: { id: 'partidas', item: 'partida', cols: [{ id: 'parte', label: 'No. de parte / pieza', required: true, list: 'piezas', wide: true },
        { id: 'descripcion', label: 'Descripción', wide: true }, { id: 'remision', label: 'Cantidad según remisión', type: 'number', required: true },
        { id: 'contada', label: 'Cantidad contada', type: 'number', required: true }, { id: 'diferencia', label: 'Diferencia', auto: true },
        { id: 'proceso', label: 'Proceso requerido', type: 'select', options: PROCESOS, required: true }, { id: 'lote', label: 'Lote POLAR', auto: true }] } },
    { n: 3, title: 'Estado al recibir', hint: 'Si algo es "No" o hay diferencia: anotarlo en la remisión antes de firmar y levantar el no conforme.',
      fields: ESTADO_REC.map(([id, label]) => ({ id, label, type: 'select', options: SN, required: true })) },
    { n: 4, title: 'Fotos y observaciones', fields: [{ id: 'fotos', label: 'Fotos (mínimo 1)', type: 'photos', required: true, wide: true },
      { id: 'danos', label: 'Daños / observaciones', type: 'textarea', wide: true }, { id: 'ubicacion', label: 'Ubicación en planta' },
      { id: 'compromiso', label: 'Fecha compromiso de entrega', type: 'date' }, { id: 'aviso', label: '¿Se avisó al cliente?', type: 'select', options: SN }] }] },
  LIB: { code: 'PL-FOR-29', title: 'Inspección y liberación de producto', sections: [
    { n: 1, title: 'Lote', hint: 'Solo aparecen los lotes EN PLANTA. Cliente, no. de parte y folio REC se llenan solos.',
      fields: [{ id: 'lote', label: 'Lote POLAR', type: 'select', options: [], src: 'lotes', required: true, wide: true },
        { id: 'fecha', label: 'Fecha', type: 'date', required: true }, { id: 'proceso', label: 'Proceso', type: 'select', options: PROCESOS, required: true },
        { id: 'horno', label: 'Horno #' }] },
    { n: 2, title: 'Criterios de inspección', hint: 'Con un criterio NOK no se puede liberar: el lote queda RETENIDO y hay que levantar el no conforme (PL-FOR-30).',
      table: { id: 'criterios', fixed: CRITERIOS, cols: [{ id: 'criterio', label: 'Criterio', readonly: true, wide: true },
        { id: 'resultado', label: 'Resultado', type: 'select', options: ['OK', 'NOK'], required: true }, { id: 'piezas_nok', label: 'Piezas NOK', type: 'number' }] } },
    { n: 3, title: 'Cantidades', hint: '% de aceptación = aceptadas ÷ inspeccionadas (se calcula solo).',
      fields: [{ id: 'inspeccionadas', label: 'Inspeccionadas', type: 'number', required: true }, { id: 'aceptadas', label: 'Aceptadas', type: 'number', required: true },
        { id: 'rechazadas', label: 'Rechazadas', type: 'number' }, { id: 'retrabajo', label: 'A retrabajo', type: 'number' }] },
    { n: 4, title: 'Disposición', fields: [{ id: 'disposicion', label: 'Disposición', type: 'select', options: DISPOS, required: true, wide: true },
      { id: 'autorizo_cliente', label: 'Quién autorizó la desviación (cliente)', wide: true }] },
    { n: 5, title: 'Entrega', hint: 'Llénala cuando las piezas salgan de planta (también se puede registrar después). Al guardarla el lote pasa a ENTREGADO.', fields: ENTREGA }] },
  NC: { code: 'PL-FOR-30', title: 'Producto no conforme y daño a propiedad del cliente', sections: [
    { n: 1, title: 'Identificación', fields: [{ id: 'fecha', label: 'Fecha', type: 'date', required: true },
      { id: 'cliente', label: 'Cliente', type: 'select', options: [], src: 'clientes', required: true, wide: true }, { id: 'parte', label: 'No. de parte' },
      { id: 'cantidad', label: 'Cantidad afectada', type: 'number', required: true },
      { id: 'lotes', label: 'Lote(s) afectado(s)', type: 'checks', options: [], src: 'lotes' }] },
    { n: 2, title: 'Detección y descripción', fields: [{ id: 'detectado', label: 'Dónde se detectó', type: 'select', required: true, wide: true,
      options: ['Recepción', 'En proceso', 'Inspección final', 'Lo detectó el cliente'] }, { id: 'folio_qj', label: 'Folio de queja (si lo detectó el cliente)', wide: true },
      { id: 'tipo', label: 'Tipo', type: 'checks', options: NC_TIPOS, required: true }, { id: 'descripcion', label: 'Descripción', type: 'textarea', required: true, wide: true },
      { id: 'fotos', label: 'Fotos (mínimo 1)', type: 'photos', required: true, wide: true }] },
    { n: 3, title: 'Contención', fields: [{ id: 'separado', label: '¿Se separó e identificó?', type: 'select', options: SN, required: true },
      { id: 'aviso', label: '¿Se avisó al cliente?', type: 'select', options: SN }, { id: 'contencion', label: 'Contención realizada', type: 'textarea', wide: true },
      { id: 'aviso_fecha', label: 'Fecha del aviso', type: 'date' }, { id: 'aviso_contacto', label: 'Contacto del cliente' }] },
    { n: 4, title: 'Disposición', fields: [{ id: 'disposicion', label: 'Disposición', type: 'select', required: true, wide: true,
      options: ['Retrabajo', 'Usar como está (autoriza cliente)', 'Desecho (autoriza cliente)', 'Reposición o pago'] },
      { id: 'costo', label: 'Costo estimado ($)', type: 'number' }, { id: 'autorizo', label: 'Autorizó' }] },
    { n: 5, title: 'Cierre', hint: 'El lote queda RETENIDO mientras el no conforme esté ABIERTO. Para cerrarlo anota la fecha de cierre.',
      fields: [{ id: 'folio_ac', label: 'Folio de acción correctiva (AC / 8D)' }, { id: 'lib_retrabajo', label: 'LIB de las piezas retrabajadas' },
        { id: 'cierre', label: 'Fecha de cierre', type: 'date' }, { id: 'estatus', label: 'Estatus', type: 'select', options: ['ABIERTO', 'CERRADO'] }] }] },
};


// ---------- Nómina (antes el artefacto "Nómina POLAR") ----------
// El admin ve todo (pestaña Nómina, sueldos, cierres). El encargado con acceso (users.nomina = 1) captura y consulta
// solo su planta y nunca recibe montos: el servidor quita sueldos y la cantidad de las incidencias en pesos.
const NOM_AREAS = [...PLANTS, 'Administración'];
const NOM_TIPOS = ['falta', 'retardo', 'permiso_sg', 'permiso_cg', 'incapacidad', 'vacacion', 'te', 'dia_extra', 'bono', 'bono_puntualidad', 'descuento'];
const NOM_PESOS = ['bono', 'bono_puntualidad', 'descuento']; // su cantidad es dinero
const NOM_MONEY = ['sueldo', 'te', 'teModo', 'bono']; // campos del empleado que solo ve el admin
const NOM_CONFIG = { porcentaje: 4, diasDivisor: 6, horasJornada: 8, factorTE: 2, bonoDefault: 500, inicio: { Querétaro: 6, Silao: 0, Administración: 1 } };
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? ''));
// Propuestas del asistente de nómina: solo empleados (alta / cambio) e incidencias válidas; los nombres se ligan a su empleado.
// La IA solo PROPONE: el admin las revisa, las edita y las aplica con las rutas normales (que vuelven a validar).
const NOM_EMP_KEYS = ['nombre', 'planta', 'pago', 'sueldo', 'bono', 'te', 'teModo', 'diasBase', 'ingreso', 'baja', 'vacAjuste', 'menor', 'notas'];
export function cleanNomCambios(cambios, emps) {
  const norm = v => String(v ?? '').trim().toLowerCase(), byName = n => emps.find(e => norm(e.nombre) === norm(n));
  return [].concat(cambios ?? []).slice(0, 200).flatMap(c => {
    if (c?.tipo === 'empleado') {
      const old = emps.find(e => e.id === Number(c.id)) || (c.id ? null : byName(c.nombre));
      const d = Object.fromEntries(NOM_EMP_KEYS.filter(k => c[k] !== undefined && c[k] !== null && c[k] !== '').map(k => [k, c[k]]));
      if (d.planta && !NOM_AREAS.includes(d.planta)) delete d.planta;
      for (const k of ['ingreso', 'baja']) if (d[k] && !isDate(d[k])) delete d[k];
      for (const k of ['sueldo', 'bono', 'te', 'diasBase', 'vacAjuste']) if (d[k] !== undefined && !(Number(d[k]) >= 0)) delete d[k];
      if (!old && !d.nombre) return [];
      return [{ tipo: 'empleado', id: old?.id ?? null, nombre: String(d.nombre || old.nombre).slice(0, 80), ...d, planta: d.planta || old?.planta || 'Querétaro' }];
    }
    if (c?.tipo === 'incidencia') {
      const clase = NOM_TIPOS.includes(c.clase) && c.clase !== 'bono_puntualidad' ? c.clase : null, cantidad = Number(c.cantidad);
      if (!clase || !isDate(c.fecha) || !(cantidad > 0)) return [];
      const e = emps.find(x => x.id === Number(c.empleadoId)) || byName(c.empleado);
      return [{ tipo: 'incidencia', empleadoId: e?.id ?? null, empleado: String(e?.nombre || c.empleado || '').slice(0, 80), clase, fecha: c.fecha, cantidad,
        nota: String(c.nota ?? '').slice(0, 240) }];
    }
    return [];
  });
}

// ---------- Formatos de operación (etapa 2): check lists PL-FOR-21/22/23, plática PL-FOR-25, mantenimiento PL-FOR-35 ----------
// Mismo esquema que QFORMS; se guardan en qrecords. Todos son obligatorios al menos 1 vez por semana por planta
// (el PL-FOR-21, por cada unidad que no es montacargas). Puntos tomados de los Excel de "Modificaciones App Polar".
const chkCols = opciones => [{ id: 'punto', label: 'Punto', readonly: true, wide: true }, { id: 'res', label: 'Resultado', type: 'select', options: opciones, required: true },
  { id: 'obs', label: 'Observaciones', wide: true }];
const RESULTADO_CHK = ['APROBADA', 'APROBADA CON OBSERVACIONES', 'RECHAZADA (NO SALE)'];
// Check list: datos + un grupo por sección (renglones fijos) + resultado. bad: respuestas que piden observación.
const checklist = (code, title, opciones, bad, datos, grupos) => ({ code, title, bad, sections: [
  { n: 1, title: 'Datos', fields: datos },
  ...grupos.map(([t, items], i) => ({ n: i + 2, title: t, table: { id: 'g' + (i + 1), fixed: items, cols: chkCols(opciones) } })),
  { n: grupos.length + 2, title: 'Resultado de la inspección', hint: `Si marcas ${bad.join(' o ')} en algún punto, anota en observaciones qué falla (y de qué lado, si aplica).`,
    fields: [{ id: 'resultado', label: 'Resultado', type: 'select', options: RESULTADO_CHK, required: true, wide: true },
      { id: 'pendientes', label: 'Pendientes / reparaciones a realizar', type: 'textarea', wide: true },
      { id: 'fotos', label: 'Fotos (de lo que está mal)', type: 'photos', wide: true }] }] });
const hoyHora = [{ id: 'fecha', label: 'Fecha', type: 'date', required: true }, { id: 'hora', label: 'Hora', type: 'time', required: true }];
const TEMAS = ['5S / orden y limpieza', 'Uso de EPP', 'Manejo de químicos / HDS', 'Prevención de incendios / extintores', 'Bloqueo y etiquetado (LOTO)',
  'Manejo seguro de gas LP', 'Operación segura de hornos', 'Trabajo en caliente', 'Levantamiento de cargas', 'Plan de emergencia / evacuación',
  'Primeros auxilios', 'Manejo de residuos', 'Otro'];
const PEND_NUEVO = 'NO, ES UN TRABAJO NUEVO';
const RESULTADO_MT = ['FUNCIONANDO', 'FUNCIONA PARCIALMENTE', 'NO FUNCIONA (SIGUE PENDIENTE)'];
const FORMATOS = {
  CL21: checklist('PL-FOR-21', 'Check list de camión', ['BIEN', 'MAL', 'N/A'], ['MAL'], [
    { id: 'unidad', label: 'Unidad / placas', type: 'select', options: [], src: 'unidades', required: true, wide: true }, ...hoyHora,
    { id: 'km', label: 'Kilometraje', type: 'number', required: true }, { id: 'operador', label: 'Operador', required: true }], [
    ['Frenos', ['Nivel de líquido de frenos', 'Pedal de freno (recorrido y firmeza)', 'Freno de mano', 'Mangueras y conexiones de freno sin fugas', 'Sistema de aire / compresor (si aplica)']],
    ['Motor', ['Sin fugas de aceite, anticongelante o diésel', 'Mangueras sin fugas ni grietas', 'Nivel de aceite de motor', 'Nivel de anticongelante / radiador',
      'Nivel de urea (si aplica)', 'Filtro de aire', 'Filtros de aceite y combustible sin fugas', 'Batería (terminales limpias y bien sujeta)']],
    ['Llantas y rines', ['Presión de aire en todas las llantas (100 PSI)', 'Llantas delanteras (izq. y der.)', 'Llantas traseras exteriores (izq. y der.)',
      'Llantas traseras interiores (izq. y der.)', 'Llanta de refacción', 'Tuercas y birlos (apriete y faltantes)', 'Guardapolvos y salpicaderas']],
    ['Luces', ['Luces bajas', 'Luces altas', 'Luces de freno', 'Luces de reversa', 'Intermitentes', 'Direccionales delanteras y traseras', 'Luz interior de cabina']],
    ['Cabina', ['Tablero sin testigos de falla encendidos', 'Claxon', 'Limpiaparabrisas', 'Parabrisas y vidrios sin estrellar', 'Espejos', 'Cinturón de seguridad', 'Aire acondicionado']],
    ['Plataforma', ['Plataforma bien sujeta al chasis', 'Argollas y puntos de amarre completos', 'Eslingas y matracas sin daño', 'Piso sin hoyos ni piezas sueltas']],
    ['Equipo de seguridad y documentos', ['Extintor (vigente y cargado)', 'Triángulos de seguridad', 'Gato y llave de cruz', 'Botiquín de primeros auxilios',
      'Licencia del operador vigente', 'Tarjeta de circulación (original o copia)', 'Póliza de seguro vigente', 'Limpieza de la unidad']]]),
  CL22: checklist('PL-FOR-22', 'Check list de área de gas', ['BUENO', 'REQUIERE ATENCIÓN', 'FUERA DE SERVICIO'], ['REQUIERE ATENCIÓN', 'FUERA DE SERVICIO'], hoyHora, [
    ['Inspección del tanque principal', ['Nivel de gas (medidor / flotador) dentro de 10 %', 'No hay olor a gas en el área', 'Tanques sin golpes, corrosión o fugas',
      'Válvulas de servicio, llenado y de alivio sin fugas (agua jabonosa)', 'Cuerpo del tanque sin corrosión, golpes o daños en pintura', 'Manómetros con lectura normal y sin fugas']],
    ['Vaporizador', ['Fugas en conexiones y roscas (agua jabonosa, nunca con flama)', 'Válvulas de venteo del regulador no obstruidas', 'Carcasa sin corrosión, golpes ni tornillería floja',
      'Manómetros con lectura dentro del rango normal de operación', 'Sin escarcha excesiva ni sobrecalentamiento anormal']],
    ['Tanque pulmón', ['Presión dentro de rango normal (manómetro)', 'Sin fugas en válvulas y uniones', 'Válvula de alivio opera correctamente']],
    ['Tubería y trayectoria', ['Recorrido visible sin fugas, golpes o corrosión', 'Conducto de gas líquido (tubo blanco) sin fugas']]]),
  CL23: checklist('PL-FOR-23', 'Check list de horno de pirólisis', ['BIEN', 'REGULAR', 'FALLA'], ['REGULAR', 'FALLA'],
    [{ id: 'horno', label: 'Horno', required: true, list: 'hornos' }, ...hoyHora], [
    ['Inspección previa al arranque', ['Puerta de cámara cierra y sella correctamente (sin fugas visibles ni humo)', 'Aislamiento cerámico interior sin daños mayores, desprendimientos o huecos',
      'Riel de carga y ruedas del carro libres de obstrucciones y bien lubricadas', 'Carga (racks) sin tocar paredes, techo ni quemadores', 'Ductos de chimeneas sin obstrucciones visibles',
      'Aspersores de agua libres']],
    ['Sistema de gas LP', ['Tubería amarilla de gas sin golpes, corrosión ni fugas (prueba con agua jabonosa)', 'Válvula de corte principal opera libremente y cierra por completo',
      'Manómetros funcionando y con lectura de presión normal', 'Conexiones y uniones roscadas sin fugas']],
    ['Quemadores, postquemadores y agua', ['Quemadores giran libremente, sin vibración ni ruido anormal', 'Llama estable sin pulsaciones de los quemadores', 'Motor de los quemadores sin sobrecalentamiento',
      'Postquemadores giran libremente, sin vibración ni ruido anormal', 'Motor de los postquemadores sin sobrecalentamiento', 'Llama estable sin pulsaciones de los postquemadores',
      'Bomba de agua sin fugas y con presión correcta']]]),
  PLA: { code: 'PL-FOR-25', title: 'Asistencia a pláticas de seguridad y capacitación', sections: [
    { n: 1, title: 'Datos de la plática', hint: 'La duración se calcula sola.', fields: [{ id: 'fecha', label: 'Fecha', type: 'date', required: true },
      { id: 'hora', label: 'Hora inicio', type: 'time', required: true }, { id: 'hora_fin', label: 'Hora fin', type: 'time', required: true },
      { id: 'turno', label: 'Turno', type: 'select', options: ['Matutino', 'Vespertino', 'Nocturno'] }, { id: 'area', label: 'Área / lugar', wide: true },
      { id: 'imparte', label: 'Impartió', required: true }, { id: 'puesto', label: 'Puesto de quien imparte' }] },
    { n: 2, title: 'Tema', fields: [{ id: 'tema', label: 'Tema', type: 'select', options: TEMAS, required: true, wide: true }, { id: 'tema_otro', label: 'Si es "Otro", ¿cuál?', wide: true }] },
    { n: 3, title: 'Contenido', fields: [{ id: 'puntos', label: 'Puntos tratados', type: 'textarea', required: true, wide: true },
      { id: 'acuerdos', label: 'Observaciones / acuerdos', type: 'textarea', wide: true }] },
    { n: 4, title: 'Asistentes', hint: 'Marca al personal de la planta que asistió (es el de Nómina → Empleados). Personas de fuera: escríbelas abajo, separadas por coma.',
      fields: [{ id: 'asistentes', label: 'Personal que asistió', type: 'checks', options: [], src: 'personal' }, { id: 'otros', label: 'Otros asistentes', wide: true }] },
    { n: 5, title: 'Evidencia', fields: [{ id: 'fotos', label: 'Fotos de la plática', type: 'photos', wide: true }] }] },
  MT: { code: 'PL-FOR-35', title: 'Registro de mantenimiento y actualizaciones', sections: [
    { n: 1, title: 'Datos generales', fields: [{ id: 'fecha', label: 'Fecha', type: 'date', required: true },
      { id: 'tipo', label: 'Tipo de trabajo', type: 'select', options: ['CORRECTIVO (REPARACIÓN)', 'PREVENTIVO', 'ACTUALIZACIÓN DE SOFTWARE', 'MEJORA / MODIFICACIÓN'], required: true, wide: true },
      { id: 'pendiente', label: '¿Viene de un pendiente del reporte diario?', type: 'select', options: [], src: 'pendientes', required: true, wide: true }] },
    { n: 2, title: 'Equipo', fields: [{ id: 'equipo', label: 'Equipo', required: true, list: 'equipos', wide: true }, { id: 'serie', label: 'Serie / ID' }] },
    { n: 3, title: 'Falla y trabajo realizado', fields: [{ id: 'falla', label: 'Falla o motivo del trabajo', type: 'textarea', required: true, wide: true },
      { id: 'trabajo', label: 'Trabajo realizado', type: 'textarea', required: true, wide: true }] },
    { n: 4, title: 'Solo para actualizaciones de software', fields: [{ id: 'sistema', label: 'Sistema / equipo actualizado', wide: true },
      { id: 'version_ant', label: 'Versión anterior' }, { id: 'version_nueva', label: 'Versión nueva' },
      { id: 'respaldo', label: '¿Se hizo respaldo antes?', type: 'select', options: SN }, { id: 'probado', label: '¿Se probó después?', type: 'select', options: SN }] },
    { n: 5, title: 'Refacciones, materiales y costos', hint: 'El costo total se calcula solo.', table: { id: 'refacciones', item: 'refacción', cols: [
      { id: 'cant', label: 'Cant.', type: 'number' }, { id: 'descripcion', label: 'Descripción', wide: true }, { id: 'costo', label: 'Costo ($)', type: 'number' },
      { id: 'factura', label: '¿Factura?', type: 'select', options: SN }] },
      fields: [{ id: 'mano_obra', label: 'Mano de obra externa ($)', type: 'number', after: true }, { id: 'fotos', label: 'Fotos (facturas, equipo)', type: 'photos', wide: true, after: true }] },
    { n: 6, title: 'Quién lo realizó y tiempos', fields: [{ id: 'quien', label: '¿Quién lo hizo?', type: 'select', options: ['PERSONAL INTERNO', 'PROVEEDOR EXTERNO'], required: true },
      { id: 'nombre', label: 'Nombre', required: true }, { id: 'proveedor', label: 'Empresa y teléfono (si es externo)', wide: true },
      { id: 'hora', label: 'Hora inicio', type: 'time' }, { id: 'hora_fin', label: 'Hora fin', type: 'time' }, { id: 'horas_paro', label: 'Horas que estuvo parado el equipo', type: 'number' }] },
    { n: 7, title: 'Resultado y liberación', hint: 'Si viene de un pendiente y queda FUNCIONANDO, el pendiente se cierra solo. Si es trabajo nuevo y NO FUNCIONA, se abre un pendiente.',
      fields: [{ id: 'resultado', label: 'El equipo quedó', type: 'select', options: RESULTADO_MT, required: true, wide: true },
        { id: 'pruebas', label: 'Pruebas realizadas', wide: true }, { id: 'libero', label: 'Liberó / recibió (encargado)', required: true },
        { id: 'proximo', label: 'Próximo mantenimiento', type: 'date' }, { id: 'observaciones', label: 'Observaciones', type: 'textarea', wide: true }] }] },
};
Object.assign(QFORMS, FORMATOS); // mismas rutas de formato, registro e impresión que Calidad
const pendKey = m => `${m.equipo}|${m.falla}`.trim().toLowerCase();
const pendLabel = m => `${m.equipo || '(sin equipo)'} — ${m.falla || ''}`.slice(0, 200);
// Lunes de la semana de una fecha AAAA-MM-DD (las fechas ya vienen en hora de México).
const lunes = s => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10); };

// Entrega de un lote: va completa (fecha, remisión POLAR, quién recibió) o vacía, y solo si el lote se libera.
function entregaDe(a, libera) {
  if (!(a.entrega_fecha || a.remision_polar || a.recibio || a.foto_remision?.length)) return false;
  if (!libera) throw Object.assign(new Error('Solo se puede registrar la entrega de un lote LIBERADO'), { code: 400 });
  if (!a.entrega_fecha || !a.remision_polar || !a.recibio) throw Object.assign(new Error('Para la entrega anota fecha, remisión POLAR y quién recibió'), { code: 400 });
  return true;
}

// ---------- Personalización del formulario (admin) ----------
// Sobre el PL-FOR-26 base el admin puede: renombrar secciones y preguntas, ocultar secciones (menos la 1) y preguntas
// no protegidas, y agregar preguntas propias. Las que usan los cálculos automáticos solo se pueden renombrar.
// ---------- PL-FOR-43 Check list diario del líder de grupo (MOD-009) ----------
// Catálogo inicial (versión 0). Gerencia lo edita en la app (settings.cll): foto = obligatoria si es NO; critico = un NO da URGENTE;
// mant = un NO abre pendiente de mantenimiento. El id nunca cambia (lo usan los pendientes del día siguiente).
const CLL_INI = [
  ['PERSONAL', 'Asistencia completa'], ['PERSONAL', 'Personal con EPP completo', 1, 1], ['PERSONAL', 'Plática de 5 minutos al inicio del turno'],
  ['PERSONAL', 'Personal en condiciones de trabajar'], ['ORDEN Y LIMPIEZA', 'Rejillas de desagüe limpias y sin tapones', 1],
  ['ORDEN Y LIMPIEZA', 'Baños limpios', 1], ['ORDEN Y LIMPIEZA', 'Baños con papel, jabón y agua'], ['ORDEN Y LIMPIEZA', 'Pisos sin derrames de aceite, agua o químico', 1],
  ['ORDEN Y LIMPIEZA', 'Pasillos y salidas de emergencia libres', 1], ['ORDEN Y LIMPIEZA', 'Basura en su contenedor correcto'], ['ORDEN Y LIMPIEZA', 'Comedor limpio'],
  ['ORDEN Y LIMPIEZA', 'Herramienta ordenada en su lugar'], ['SEGURIDAD', 'Extintores en su lugar y sin obstrucción', 1, 1],
  ['SEGURIDAD', 'Sin olor a gas en hornos, tanques y bodega', 0, 1], ['SEGURIDAD', 'Químicos tapados y etiquetados', 1], ['SEGURIDAD', 'Botiquín completo'],
  ['SEGURIDAD', 'Sin accidentes ni casi accidentes', 0, 1], ['EQUIPOS Y MATERIAL', 'Hornos operando sin alarmas', 1, 1, 1],
  ['EQUIPOS Y MATERIAL', 'Nivel de aceite de hidrolavadora OK', 0, 0, 1], ['EQUIPOS Y MATERIAL', 'Montacargas revisado antes de usarse', 0, 0, 1],
  ['EQUIPOS Y MATERIAL', 'Material recibido identificado por cliente', 1], ['EQUIPOS Y MATERIAL', 'Material terminado separado y etiquetado', 1],
  ['EQUIPOS Y MATERIAL', 'Racks, carritos y pallets ordenados'], ['INCIDENCIAS', 'Incidencias del día anterior atendidas'], ['INCIDENCIAS', 'Incidencias de hoy reportadas'],
  ['CIERRE DE TURNO', 'Equipos apagados y gas cerrado', 0, 1], ['CIERRE DE TURNO', 'Área limpia para el siguiente turno', 1], ['CIERRE DE TURNO', 'Puertas cerradas y luces apagadas'],
].map(([seccion, texto, foto, critico, mant], i) => ({ id: i + 1, seccion, texto, foto: !!foto, critico: !!critico, mant: !!mant, activo: true, plantas: [...PLANTS] }));
const CLL_RES = ['TODO EN ORDEN', 'CON OBSERVACIONES', 'REQUIERE ATENCIÓN URGENTE'];
const isHora = s => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s ?? ''));
// Valida el catálogo que guarda gerencia: ids únicos (los nuevos toman el siguiente), texto y sección obligatorios.
export function cleanCll(c = {}) {
  const str = (v, n) => String(v ?? '').trim().slice(0, n), seen = new Set();
  let next = Math.max(0, ...[].concat(c.puntos ?? []).map(p => Number(p?.id) || 0)) + 1;
  const puntos = [].concat(c.puntos ?? []).slice(0, 100).map(p => ({ id: Number(p?.id) > 0 && !seen.has(Number(p.id)) ? Number(p.id) : next++,
    seccion: str(p?.seccion, 40).toUpperCase(), texto: str(p?.texto, 160), foto: !!p?.foto, critico: !!p?.critico, mant: !!p?.mant, activo: p?.activo !== false,
    plantas: [].concat(p?.plantas ?? PLANTS).filter(x => PLANTS.includes(x)) })).filter(p => p.seccion && p.texto && seen.add(p.id));
  if (!puntos.some(p => p.activo)) throw Object.assign(new Error('El check list necesita al menos un punto activo'), { code: 400 });
  return { puntos, hora_lider: isHora(c.hora_lider) ? c.hora_lider : '19:00', hora_encargado: isHora(c.hora_encargado) ? c.hora_encargado : '20:00' };
}

const PROTECTED = new Set(['turno', 'presentes', 'hubo_reportes', 'reportes_n', 'manana', 'vehiculos.vehiculo', 'vehiculos.km_ini', 'vehiculos.km_fin',
  'gas.tanque', 'gas.na', 'gas.sin_carga', 'gas.litros', 'gas.importe', 'hornos.ciclos', 'quimicos.quimico', 'quimicos.existencia',
  'material.cliente', 'material.pieza', 'material.cantidad', 'material.procesado', 'material.entregado', 'mantenimiento.estatus', 'gastos.importe']);
const EXTRA_TYPES = ['text', 'textarea', 'number', 'sino', 'select', 'date', 'time'];
const keysOf = s => [...(s.fields || []).map(f => [f.id, f]), ...(s.table ? s.table.cols.map(c => [`${s.table.id}.${c.id}`, c]) : [])];
const canHide = (key, f) => !PROTECTED.has(key) && !f.required && !f.auto;

// Valida una configuración (del admin o de la IA): todo lo desconocido o no permitido se descarta.
function cleanConfig(c = {}) {
  const str = (v, n = 120) => String(v ?? '').trim().slice(0, n), out = { sections: {}, fields: {}, extra: {} }, ids = new Set();
  for (const s of FORM) {
    // Un texto igual al original no es un cambio (la IA suele copiar todo tal cual).
    const sc = c.sections?.[s.n] || {}, title = str(sc.title) === s.title ? '' : str(sc.title), hidden = s.n !== 1 && !!sc.hidden;
    if (title || hidden) out.sections[s.n] = { ...(title && { title }), ...(hidden && { hidden }) };
    for (const [key, f] of keysOf(s)) {
      const fc = c.fields?.[key] || {}, label = str(fc.label) === f.label ? '' : str(fc.label), hide = canHide(key, f) && !!fc.hidden;
      if (label || hide) out.fields[key] = { ...(label && { label }), ...(hide && { hidden: true }) };
    }
    const extra = (Array.isArray(c.extra?.[s.n]) ? c.extra[s.n] : []).slice(0, 20).map(x => {
      let id = str(x?.id, 40);
      if (!/^x_[a-z0-9_]{1,36}$/.test(id) || ids.has(id)) id = 'x_' + crypto.randomBytes(4).toString('hex');
      ids.add(id);
      const type = EXTRA_TYPES.includes(x?.type) ? x.type : 'text';
      return { id, label: str(x?.label), type, required: !!x?.required,
        ...(type === 'select' && { options: [].concat(x?.options ?? []).map(o => str(o, 60)).filter(Boolean).slice(0, 20) }) };
    }).filter(x => x.label && (x.type !== 'select' || x.options.length));
    if (extra.length) out.extra[s.n] = extra;
  }
  return out;
}

// Formulario efectivo = PL-FOR-26 base + configuración del admin. Es el que llenan los encargados y el que se valida.
function formFor(c) {
  const lab = (key, f) => ({ ...f, label: c.fields[key]?.label || f.label });
  return FORM.filter(s => !c.sections[s.n]?.hidden).map(s => {
    const fields = [...(s.fields || []).filter(f => !c.fields[f.id]?.hidden).map(f => lab(f.id, f)),
      ...(c.extra[s.n] || []).map(x => x.type === 'sino' ? { ...x, type: 'select', options: SN } : x)];
    return { ...s, title: c.sections[s.n]?.title || s.title, fields: fields.length ? fields : undefined,
      ...(s.table && { table: { ...s.table, cols: s.table.cols.filter(col => !c.fields[`${s.table.id}.${col.id}`]?.hidden).map(col => lab(`${s.table.id}.${col.id}`, col)) } }) };
  });
}

// Normaliza las respuestas al formulario efectivo; las columnas auto se ignoran (las calcula el servidor).
function clean(answers, form) {
  const str = v => String(v ?? '').trim().slice(0, 3000), out = {};
  const missing = (s, label) => Object.assign(new Error(`Falta responder: ${s.n}. ${s.title} — ${label}`), { code: 400 });
  // Una lista cerrada solo acepta sus opciones (las vacías, como los camiones, se validan aparte).
  const pick = (s, f, v) => { if (v && f.type === 'select' && f.options.length && !f.options.includes(v)) throw missing(s, `${f.label} (opción no válida)`); return v; };
  for (const s of form) {
    for (const f of s.fields || []) {
      if (f.type === 'checks') out[f.id] = [].concat(answers[f.id] ?? []).map(str).filter(v => f.options.includes(v));
      else if (f.type === 'photos') out[f.id] = [].concat(answers[f.id] ?? []).map(str).filter(k => PHOTO.test(k)).slice(0, 10);
      else out[f.id] = pick(s, f, str(answers[f.id]));
      if (f.required && !out[f.id].length) throw missing(s, f.label);
    }
    if (!s.table) continue;
    const cols = s.table.cols.filter(c => !c.auto), keys = s.table.fixed ? cols.slice(1) : cols;
    out[s.table.id] = [].concat(answers[s.table.id] ?? []).slice(0, 50)
      .map(r => Object.fromEntries(cols.map(c => [c.id, pick(s, c, str(r?.[c.id]))])))
      .filter(r => keys.some(c => r[c.id]));
    out[s.table.id].forEach((r, i) => { const c = cols.find(c => c.required && !r[c.id]); if (c) throw missing(s, `${c.label} (renglón ${i + 1})`); });
    // Casillas N/A: marcan como N/A los campos que desactivan (p. ej. tanque que no aplica, sin carga de gas).
    for (const r of out[s.table.id]) for (const c of cols) if (c.disables && r[c.id]) {
      r[c.id] = 'N/A';
      for (const d of c.disables) if (r[d] !== undefined && !cols.find(x => x.id === d)?.disables) r[d] = 'N/A';
    }
  }
  return out;
}

// Texto del reporte para la IA. Solo lo que tiene respuesta (los tokens cuestan): sección vacía = "(vacío)".
const formatAnswers = (a, form) => form.map(s => {
  const val = f => f.type === 'photos' ? (a[f.id]?.length ? `${a[f.id].length} foto(s)` : '') : [].concat(a[f.id] ?? '').join(', ');
  const lines = [...(s.fields || []).filter(val).map(f => `${f.label}: ${val(f)}`),
    ...(s.table ? (a[s.table.id] || []).map(r => '- ' + s.table.cols.filter(c => r[c.id]).map(c => `${c.label}: ${r[c.id]}`).join(' | ')) : [])];
  return `${s.n}. ${s.title}\n${lines.join('\n') || '(vacío)'}`;
}).join('\n');

const hash = (pw, salt = crypto.randomBytes(16).toString('hex')) => salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
const verify = (pw, stored) => {
  const [salt, h] = stored.split(':');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), crypto.scryptSync(pw, salt, 64));
};
const httpError = (code, msg) => Object.assign(new Error(msg), { code });
// no-store: el navegador nunca usa una copia vieja de la app o del cuestionario después de un cambio.
export const NO_CACHE = { 'Cache-Control': 'no-store' };
const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...NO_CACHE } });
async function body(req, max = 100_000) {
  const s = await req.text();
  if (s.length > max) throw httpError(413, 'Solicitud demasiado grande');
  try { return s ? JSON.parse(s) : {}; } catch { throw httpError(400, 'Solicitud inválida'); }
}
const parseReport = r => ({ ...r, answers: JSON.parse(r.answers) });

// files: { put(key, bytes), get(key) → cuerpo | null } — fotos JPEG (R2 en Cloudflare, carpeta uploads/ en la compu).
export function createApp({ db, files, env = {} }) {
  const { ADMIN_EMAIL = '', AI_API_KEY = '', AI_BASE_URL = 'https://api.cheaperinference.com/v1',
    AI_MODEL = 'deepseek-v4-flash', // rápido y barato (antes gpt-6-luna y gpt-oss-120b, que tardaba ~1 min)
    TZ = 'America/Mexico_City' } = env;
  // Fechas siempre en hora de México (en la nube el servidor está en UTC).
  const ymd = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: TZ });

  // Arrastre entre días por planta: último km de cada unidad, último saldo por pieza y pendientes abiertos del último reporte.
  // before: el reporte que se está corrigiendo ({ id, date }): solo cuentan los anteriores a él.
  async function carry(plant, before = null) {
    const rows = !plant ? [] : (before
      ? await db.all('SELECT answers FROM reports WHERE plant = ? AND (date < ? OR (date = ? AND id < ?)) ORDER BY date, id', plant, before.date, before.date, before.id)
      : await db.all('SELECT answers FROM reports WHERE plant = ? ORDER BY date, id', plant)).map(r => JSON.parse(r.answers));
    const km = {}, saldos = {};
    for (const a of rows) {
      for (const v of a.vehiculos || []) if (v.vehiculo && v.km_fin) km[v.vehiculo] = v.km_fin;
      for (const m of a.material || []) saldos[matKey(m)] = m;
    }
    return { km, saldos, pendientes: plant ? await pendientesAbiertos(plant, rows.at(-1) || {}) : [] };
  }
  // Pendientes de mantenimiento abiertos: los del último reporte de la planta, menos los que cerró un PL-FOR-35 que quedó
  // FUNCIONANDO, más los que abrió un trabajo nuevo que NO FUNCIONA (hasta que un reporte los marque Cerrado).
  async function pendientesAbiertos(plant, last) {
    last ??= JSON.parse((await db.get('SELECT answers FROM reports WHERE plant = ? ORDER BY date DESC, id DESC LIMIT 1', plant))?.answers || '{}');
    const mts = (await db.all("SELECT data FROM qrecords WHERE kind = 'MT' AND plant = ? ORDER BY created_at", plant)).map(r => JSON.parse(r.data));
    const cerrados = new Set(mts.filter(m => m.resultado === 'FUNCIONANDO' && m.pendiente_key).map(m => m.pendiente_key));
    const out = (last.mantenimiento || []).filter(m => m.estatus !== 'Cerrado' && !cerrados.has(pendKey(m)));
    const enReporte = new Set((last.mantenimiento || []).map(pendKey));
    for (const m of mts) if (m.pendiente === PEND_NUEVO && m.resultado.startsWith('NO FUNCIONA')) {
      const p = { detectado: m.fecha, equipo: m.equipo, falla: m.falla, responsable: m.nombre, estatus: 'Abierto' };
      if (!enReporte.has(pendKey(p)) && !cerrados.has(pendKey(p)) && !out.some(x => pendKey(x) === pendKey(p))) out.push(p);
    }
    const visto = (await db.get('SELECT MAX(created_at) t FROM reports WHERE plant = ?', plant))?.t || '';
    // ponytail: created_at va al segundo; si el reporte y el check list caen en el mismo segundo, enReporte evita repetirlo.
    for (const r of await db.all("SELECT date, data FROM qrecords WHERE kind = 'CLL' AND plant = ? AND created_at >= ?", plant, visto))
      for (const x of JSON.parse(r.data).puntos.filter(x => x.mant && x.r === 'NO')) {
        const p = { detectado: r.date, equipo: x.texto, falla: x.obs, responsable: 'Check list del líder', estatus: 'Abierto' };
        if (!enReporte.has(pendKey(p)) && !cerrados.has(pendKey(p)) && !out.some(y => pendKey(y) === pendKey(p))) out.push(p);
      }
    return out;
  }
  const getConfig = async () => cleanConfig(JSON.parse((await db.get("SELECT value FROM settings WHERE key = 'form'"))?.value || '{}'));
  const currentForm = async () => formFor(await getConfig());

  async function ai(system, user, asJson, ms = 90_000) {
    if (!AI_API_KEY) throw new Error('Falta AI_API_KEY');
    const r = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST', signal: AbortSignal.timeout(ms),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({ model: AI_MODEL, messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        ...(asJson && { response_format: { type: 'json_object' } }) }),
    });
    if (!r.ok) throw new Error(`IA ${r.status}: ${await r.text()}`);
    return (await r.json()).choices[0].message.content;
  }

  async function evaluate(answers, form) {
    const out = JSON.parse(await ai(
      'Eres un supervisor que revisa el reporte diario de operación e incidencias (formato PL-FOR-26) de una planta de retrabajos industriales y limpiezas. ' +
      'Escribe siempre en español. Responde SOLO un JSON con las claves: ' +
      '"resumen" (2-3 oraciones para el administrador con lo más importante: incidencias, faltas, químicos por agotarse, gastos y pendientes), ' +
      '"calidad" (entero 0-100: qué tan completo, específico y útil es el reporte), ' +
      '"retroalimentacion" (1-2 oraciones para el encargado sobre cómo mejorar su reporte, en tono amable).',
      formatAnswers(answers, form), true));
    return { summary: String(out.resumen ?? ''), score: Math.max(0, Math.min(100, Math.round(Number(out.calidad) || 0))), feedback: String(out.retroalimentacion ?? '') };
  }

  // Material que entró (PL-FOR-28) y salió (entregas PL-FOR-29) en la planta ese día, por cliente + pieza.
  async function movimientos(plant, date) {
    const m = {}, add = (cliente, pieza, k, n, folio) => {
      const x = m[matKey({ cliente, pieza })] ??= { cliente, pieza, recibido: 0, entregado: 0, folios: [] };
      x[k] += n; if (!x.folios.includes(folio)) x.folios.push(folio);
    };
    for (const r of await db.all("SELECT folio, data FROM qrecords WHERE kind = 'REC' AND plant = ? AND date = ?", plant, date)) {
      const d = JSON.parse(r.data);
      for (const p of d.partidas) add(d.cliente, p.parte, 'recibido', num(p.contada), r.folio);
    }
    for (const r of await db.all("SELECT folio, data FROM qrecords WHERE kind = 'LIB' AND plant = ? AND status = 'ENTREGADO'", plant)) {
      const d = JSON.parse(r.data);
      if (d.entrega_fecha === date) add(d.cliente, d.parte, 'entregado', num(d.aceptadas), r.folio);
    }
    return m;
  }

  // Sección 7: saldo en planta y pendientes por procesar de cada pieza, a partir de los saldos anteriores.
  const saldar = (a, saldos) => { for (const m of a.material || []) {
    m.saldo_ant = String(num(saldos[matKey(m)]?.saldo));
    m.saldo = String(num(m.saldo_ant) + num(m.cantidad) - num(m.entregado)); // las piezas del renglón son lo que entró
    m.pendientes = String(num(saldos[matKey(m)]?.pendientes) + num(m.cantidad) - num(m.procesado)); // se arrastra como el saldo
  } };
  // Limpia las respuestas y calcula los campos automáticos (para guardar o para corregir; before = el reporte que se corrige).
  async function prepare(plant, answers, before = null, date = ymd()) {
    const form = await currentForm(), a = clean(answers, form), { saldos } = await carry(plant, before);
    // Sección 7: recibido / entregado salen de Calidad (no se capturan). Cada pieza con movimiento ese día lleva su renglón.
    if (a.material) {
      // ponytail: los movimientos del día cuentan solo en el primer reporte de la planta ese día (si no, el saldo los sumaría dos veces).
      const otro = await db.get('SELECT 1 FROM reports WHERE plant = ? AND date = ? AND id < ?', plant, date, before?.id ?? Number.MAX_SAFE_INTEGER);
      const mov = otro ? {} : await movimientos(plant, date);
      for (const [k, x] of Object.entries(mov)) if (!a.material.some(m => matKey(m) === k)) a.material.push({ cliente: x.cliente, pieza: x.pieza, procesado: '' });
      for (const m of a.material) {
        const x = mov[matKey(m)];
        Object.assign(m, { cantidad: String(x?.recibido || 0), entregado: String(x?.entregado || 0), folio: x ? x.folios.join(', ') : '' });
      }
    }
    if (a.hubo_reportes === 'No') a.reportes_n = 'N/A';
    // Solo camiones registrados de la planta (secciones ocultas no traen tabla, de ahí el || []).
    const trucks = new Set((await db.all('SELECT name FROM trucks WHERE plant = ?', plant)).map(t => t.name));
    // Último check list de cada unidad: el PL-FOR-21 más reciente (si es más nuevo que lo capturado a mano).
    const chk = {};
    for (const r of await db.all("SELECT date, data FROM qrecords WHERE kind = 'CL21' AND plant = ?", plant)) { const u = JSON.parse(r.data).unidad; if (!(chk[u] >= r.date)) chk[u] = r.date; }
    for (const v of a.vehiculos || []) {
      if (chk[v.vehiculo] && !(v.checklist >= chk[v.vehiculo])) v.checklist = chk[v.vehiculo];
      if (!trucks.has(v.vehiculo)) throw httpError(400, `El vehículo "${v.vehiculo || '(vacío)'}" no está registrado en la planta ${plant}`);
      v.recorrido = v.km_ini && v.km_fin ? String(num(v.km_fin) - num(v.km_ini)) : '';
    }
    saldar(a, saldos);
    return { a, form };
  }
  // El reporte se guarda aunque la IA falle; queda sin calificación (o con la anterior, si se corrigió).
  async function grade(id, a, form) {
    try {
      const ev = await evaluate(a, form);
      await db.run('UPDATE reports SET summary = ?, score = ?, feedback = ? WHERE id = ?', ev.summary, ev.score, ev.feedback, id);
    } catch (e) { console.error('Evaluación IA falló:', e.message); }
  }

  // ---------- Calidad ISO 9001 ----------
  // Catálogo de clientes (con especificación particular) y teléfono de gerencia para la franja de emergencia.
  const getCalidad = async () => {
    const c = JSON.parse((await db.get("SELECT value FROM settings WHERE key = 'calidad'"))?.value || '{}');
    return { clientes: c.clientes || CLIENTES_INI, tel: c.tel || '' };
  };
  // Folio consecutivo: el UPDATE ... RETURNING es atómico, así que dos capturas al mismo tiempo nunca repiten número.
  const nextNum = async key => (await db.get('INSERT INTO counters(key, n) VALUES (?, 1) ON CONFLICT(key) DO UPDATE SET n = n + 1 RETURNING n', key)).n;
  const nextFolio = async kind => `${kind}-${String(await nextNum(kind)).padStart(4, '0')}`;
  const lotCode = async (plant, fecha) => `${PLANT_CODE[plant]}-${fecha.replaceAll('-', '')}-${String(await nextNum(`LOTE:${plant}:${fecha}`)).padStart(2, '0')}`;
  // El admin elige planta; el encargado siempre trabaja con la suya.
  const plantFor = (user, asked) => { const p = user.role === 'admin' ? asked : user.plant; if (!PLANTS.includes(p)) throw badPlant(); return p; };
  // Formato con sus listas de la planta: clientes del catálogo; lotes EN PLANTA (liberación) o recientes (no conforme).
  async function qform(kind, plant) {
    const clientes = (await getCalidad()).clientes.filter(c => c.plant === plant).map(c => c.name);
    const lotes = (kind === 'LIB' ? await db.all("SELECT code FROM lots WHERE plant = ? AND status = 'EN PLANTA' ORDER BY code", plant)
      : await db.all('SELECT code FROM lots WHERE plant = ? AND received >= ? ORDER BY code DESC', plant, ymd(new Date(Date.now() - 180 * DAY)))).map(l => l.code);
    const src = { clientes, lotes };
    if (kind === 'CL21') src.unidades = (await db.all('SELECT name FROM trucks WHERE plant = ? ORDER BY horometro, name', plant)).map(t => t.name);
    if (kind === 'PLA') src.personal = (await db.all('SELECT data FROM nom_emps WHERE area = ?', plant)).map(r => JSON.parse(r.data))
      .filter(e => !e.baja || e.baja >= ymd()).map(e => e.nombre).sort();
    if (kind === 'MT') src.pendientes = [...(await pendientesAbiertos(plant)).map(pendLabel), PEND_NUEVO];
    return { ...QFORMS[kind], sections: QFORMS[kind].sections.map(s => ({ ...s, fields: s.fields?.map(f => f.src ? { ...f, options: src[f.src] } : f) })) };
  }
  const getRecord = async (folio, user) => {
    const r = await db.get('SELECT q.*, u.name FROM qrecords q JOIN users u ON u.id = q.user_id WHERE folio = ?', String(folio));
    if (!r || (user.role !== 'admin' && r.plant !== user.plant)) throw httpError(404, 'Registro no encontrado');
    return { ...r, data: JSON.parse(r.data) };
  };
  const saveRecord = (folio, kind, plant, date, user, status, data) =>
    db.run('INSERT INTO qrecords(folio, kind, plant, date, user_id, status, data) VALUES (?, ?, ?, ?, ?, ?, ?)', folio, kind, plant, date, user.id, status, JSON.stringify(data));
  // Entregas parciales: un lote se libera (PL-FOR-29) y se entrega en partes. Avance por lote: piezas inspeccionadas en liberaciones
  // LIBERADO / ENTREGADO, entregadas, rechazadas y folios LIB liberados que faltan por entregar.
  async function avanceLotes(plant) {
    const out = {};
    for (const r of await db.all("SELECT folio, status, data FROM qrecords WHERE kind = 'LIB' AND plant = ? AND status IN ('LIBERADO', 'ENTREGADO')", plant)) {
      const d = JSON.parse(r.data), x = out[d.lote] ??= { inspeccionadas: 0, entregadas: 0, rechazadas: 0, porEntregar: [] };
      x.inspeccionadas += num(d.inspeccionadas); x.rechazadas += num(d.inspeccionadas) - num(d.aceptadas);
      if (r.status === 'ENTREGADO') x.entregadas += num(d.aceptadas); else x.porEntregar.push(r.folio);
    }
    return out;
  }
  const AV0 = { inspeccionadas: 0, entregadas: 0, rechazadas: 0, porEntregar: [] };
  // Estatus de un lote que no está RETENIDO: EN PLANTA mientras le falten piezas por liberar; LIBERADO si falta entregar algo liberado.
  async function estadoLote(code, plant) {
    const l = await db.get('SELECT qty FROM lots WHERE code = ?', code), a = (await avanceLotes(plant))[code] || AV0;
    const status = l.qty - a.inspeccionadas > 0 ? 'EN PLANTA' : a.porEntregar.length ? 'LIBERADO' : 'ENTREGADO';
    await db.run('UPDATE lots SET status = ?, delivered_qty = ? WHERE code = ?', status, a.entregadas, code);
    return status;
  }
  // Recepciones (PL-FOR-28) con piezas por entregar: siguen ABIERTAS hasta que se entregue todo lo recibido (lo rechazado no cuenta).
  // ponytail: recorre todas las recepciones de la planta en cada consulta; si llegan a ser miles, guardar el avance en la tabla lots.
  async function recepcionesAbiertas(plant) {
    const av = await avanceLotes(plant), out = [];
    for (const r of await db.all("SELECT folio, date, data FROM qrecords WHERE kind = 'REC' AND plant = ? ORDER BY date, folio", plant)) {
      const d = JSON.parse(r.data), partidas = d.partidas.map(x => { const a = av[x.lote] || AV0, recibidas = num(x.contada);
        return { lote: x.lote, parte: x.parte, recibidas, entregadas: a.entregadas, rechazadas: a.rechazadas, porLiberar: Math.max(0, recibidas - a.inspeccionadas),
          porEntregar: Math.max(0, recibidas - a.entregadas - a.rechazadas), faltanLlegar: Math.max(0, num(x.remision) - recibidas), libsPorEntregar: a.porEntregar }; });
      const total = partidas.reduce((t, x) => t + x.porEntregar, 0);
      if (total > 0) out.push({ folio: r.folio, plant, date: r.date, cliente: d.cliente, remision: d.remision, compromiso: d.compromiso, partidas, total });
    }
    return out;
  }
  // Un lote con no conforme ABIERTO queda RETENIDO; al cerrarse todos vuelve a EN PLANTA (hay que volver a inspeccionarlo).
  // Los ya entregados no cambian (un NC que detectó el cliente queda solo como registro).
  async function syncLots(plant, codes) {
    const open = (await db.all("SELECT data FROM qrecords WHERE kind = 'NC' AND plant = ? AND status = 'ABIERTO'", plant)).flatMap(r => JSON.parse(r.data).lotes || []);
    for (const code of codes) {
      const l = await db.get('SELECT status FROM lots WHERE code = ?', code);
      if (!l || l.status === 'ENTREGADO' || (l.status === 'LIBERADO' && !open.includes(code))) continue;
      if (open.includes(code)) await db.run("UPDATE lots SET status = 'RETENIDO' WHERE code = ?", code);
      else await estadoLote(code, plant); // vuelve a EN PLANTA (o como vaya su liberación por partes)
    }
  }
  // 8D sugerido (sección 4.3): lo detectó el cliente, más de un lote, daño con costo, o se repite cliente + tipo en 90 días.
  async function sugiere8D(plant, a, folio) {
    if (a.detectado === 'Lo detectó el cliente' || a.lotes.length > 1 || (a.tipo.some(t => t.startsWith('Daño')) && num(a.costo) > 0)) return true;
    const prev = await db.all("SELECT data FROM qrecords WHERE kind = 'NC' AND plant = ? AND folio != ? AND date >= ?", plant, folio, ymd(new Date(Date.now() - 90 * DAY)));
    return prev.map(r => JSON.parse(r.data)).some(d => d.cliente === a.cliente && d.tipo.some(t => a.tipo.includes(t)));
  }
  // Valida y guarda un no conforme nuevo o actualizado (folio = el existente al actualizar).
  async function saveNC(user, plant, answers, origen, existing) {
    const a = clean(answers, (await qform('NC', plant)).sections);
    a.estatus ||= 'ABIERTO';
    if (a.estatus === 'CERRADO' && !a.cierre) throw httpError(400, 'Para cerrar el no conforme anota la fecha de cierre');
    if (a.detectado === 'Lo detectó el cliente' && !a.folio_qj) throw httpError(400, 'Anota el folio de la queja del cliente (QJ)');
    const folio = existing?.folio || await nextFolio('NC');
    a.origen = existing ? existing.data.origen : /^(REC|LIB)-\d+$/.test(origen || '') && (await db.get('SELECT 1 FROM qrecords WHERE folio = ? AND plant = ?', origen, plant)) ? origen : '';
    a.sugiere_8d = await sugiere8D(plant, a, folio) ? 'Sí' : 'No';
    if (existing) await db.run('UPDATE qrecords SET status = ?, data = ? WHERE folio = ?', a.estatus, JSON.stringify(a), folio);
    else {
      await saveRecord(folio, 'NC', plant, a.fecha, user, a.estatus, a);
      await db.run('INSERT INTO alerts(plant, folio, text) VALUES (?, ?, ?)', plant, folio,
        `Nuevo no conforme ${folio} · ${a.cliente} · ${plant}: ${a.tipo.join(', ')} — ${a.cantidad} pza. (${a.detectado})`);
    }
    await syncLots(plant, [...new Set([...(existing?.data.lotes || []), ...a.lotes])]);
    return { folio, ...a };
  }

  // Guarda un formato de operación (check list, plática, mantenimiento) con sus reglas. Estatus = su resultado.
  // existing: el registro que corrige el admin (conserva folio y planta).
  async function saveFormato(kind, user, b, existing = null) {
    const plant = existing?.plant || plantFor(user, b.planta), F = await qform(kind, plant), a = clean(b.answers || {}, F.sections), fx = FORMATOS[kind];
    if (fx.bad) { // check list: todos los puntos contestados; lo que está mal lleva observación
      for (const s of F.sections.filter(s => s.table)) {
        if (a[s.table.id].length !== s.table.fixed.length || a[s.table.id].some((r, i) => r.punto !== s.table.fixed[i]))
          throw httpError(400, `Contesta todos los puntos de "${s.title}"`);
        const r = a[s.table.id].find(r => fx.bad.includes(r.res) && !r.obs);
        if (r) throw httpError(400, `Anota en observaciones qué falla: "${r.punto}"`);
      }
      const malos = F.sections.filter(s => s.table).flatMap(s => a[s.table.id]).filter(r => fx.bad.includes(r.res));
      if (malos.length && a.resultado === 'APROBADA') throw httpError(400, 'Hay puntos con falla: el resultado no puede ser APROBADA. Elige "con observaciones" o "rechazada".');
      a.fallas = String(malos.length);
    }
    if (kind === 'PLA') {
      a.otros = a.otros.split(',').map(x => x.trim()).filter(Boolean).join(', ');
      a.total = String(a.asistentes.length + (a.otros ? a.otros.split(', ').length : 0));
      if (a.total === '0') throw httpError(400, 'Marca al menos un asistente');
      if (a.tema === 'Otro' && !a.tema_otro) throw httpError(400, 'Escribe cuál es el tema');
      const [h1, m1] = a.hora.split(':').map(Number), [h2, m2] = a.hora_fin.split(':').map(Number);
      a.duracion = String(Math.max(0, h2 * 60 + m2 - h1 * 60 - m1));
    }
    if (kind === 'MT') {
      if (a.tipo === 'ACTUALIZACIÓN DE SOFTWARE' && !a.sistema) throw httpError(400, 'Anota qué sistema o equipo se actualizó');
      a.sin_respaldo = a.tipo === 'ACTUALIZACIÓN DE SOFTWARE' && a.respaldo !== 'Sí' ? 'Sí' : 'No';
      a.total = String(a.refacciones.reduce((t, r) => t + num(r.costo), 0) + num(a.mano_obra));
      const p = (await pendientesAbiertos(plant)).find(m => pendLabel(m) === a.pendiente);
      a.pendiente_key = p ? pendKey(p) : a.pendiente === existing?.data.pendiente ? existing.data.pendiente_key || '' : '';
    }
    const status = a.resultado || 'REALIZADA';
    if (existing) {
      await db.run('UPDATE qrecords SET date = ?, status = ?, data = ? WHERE folio = ?', a.fecha, status, JSON.stringify(a), existing.folio);
      return { folio: existing.folio, status, ...a };
    }
    const folio = await nextFolio(kind);
    await saveRecord(folio, kind, plant, a.fecha, user, status, a);
    if (status.startsWith('RECHAZADA')) await db.run('INSERT INTO alerts(plant, folio, text) VALUES (?, ?, ?)', plant, folio,
      `${fx.code} ${fx.title} RECHAZADO ${a.unidad || a.horno || ''} · ${plant}: ${a.fallas} punto(s) con falla`);
    return { folio, status, ...a };
  }
  // Formatos de la semana (lunes a hoy) por planta: cuáles faltan. PL-FOR-21: cada unidad que no es montacargas.
  async function semana(plants) {
    const desde = lunes(ymd()), out = [];
    for (const plant of plants) {
      const recs = (await db.all("SELECT kind, data FROM qrecords WHERE plant = ? AND date >= ? AND kind IN ('CL21', 'CL22', 'CL23', 'PLA', 'MT')", plant, desde))
        .map(r => ({ kind: r.kind, ...JSON.parse(r.data) }));
      const unidades = (await db.all('SELECT name FROM trucks WHERE plant = ? AND horometro = 0 ORDER BY name', plant)).map(t => t.name);
      for (const kind of ['CL21', 'CL22', 'CL23', 'PLA', 'MT']) {
        const mine = recs.filter(r => r.kind === kind);
        const faltan = kind === 'CL21' ? unidades.filter(u => !mine.some(r => r.unidad === u)) : mine.length ? [] : [FORMATOS[kind].code];
        out.push({ plant, kind, code: FORMATOS[kind].code, title: FORMATOS[kind].title, hechos: mine.length, faltan });
      }
    }
    return { desde, formatos: out };
  }

  // ---------- Check list del líder (PL-FOR-43): uno por planta al día, se liga al reporte diario de esa planta y fecha ----------
  const getCll = async () => JSON.parse((await db.get("SELECT value FROM settings WHERE key = 'cll'"))?.value || 'null') || { puntos: CLL_INI, hora_lider: '19:00', hora_encargado: '20:00' };
  const cllFolio = (plant, fecha) => `CLL-${PLANT_CODE[plant]}-${fecha.replaceAll('-', '')}-T1`;
  const horaMx = () => new Date().toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const encargadoDe = async plant => (await db.all("SELECT name FROM users WHERE role = 'colaborador' AND plant = ? AND status = 'activo' ORDER BY id", plant)).map(u => u.name).join(', ');
  const cllDe = async (plant, fecha) => { const r = await db.get("SELECT folio, status, data FROM qrecords WHERE kind = 'CLL' AND plant = ? AND date = ?", plant, fecha);
    return r ? { folio: r.folio, status: r.status, ...JSON.parse(r.data) } : null; };
  // Lo que el encargado no marcó ATENDIDO en el último check list anterior: el líder lo revisa en el punto "Incidencias del día anterior".
  async function pendientesCll(plant, fecha) {
    const r = await db.get("SELECT data FROM qrecords WHERE kind = 'CLL' AND plant = ? AND date < ? ORDER BY date DESC LIMIT 1", plant, fecha);
    if (!r) return [];
    const d = JSON.parse(r.data);
    return [...d.puntos.filter(p => p.r === 'NO'), ...d.incidencias.map(i => ({ texto: 'Incidencia', obs: i.desc, estado: i.estado }))]
      .filter(x => x.estado !== 'ATENDIDO').map(x => ({ texto: x.texto, obs: x.obs, estado: x.estado || 'SIN REVISAR', fecha: d.fecha }));
  }
  // Avisos dentro de la app: líder sin check list a la hora del recordatorio, al encargado una hora después, y URGENTE de hoy.
  async function avisosCll(plants, role) {
    const c = await getCll(), hoy = ymd(), hora = horaMx(), out = [];
    for (const plant of plants) {
      const r = await cllDe(plant, hoy);
      if (r?.resultado === CLL_RES[2]) out.push({ plant, nivel: 'red', text: `URGENTE · Check list del líder de ${plant}: ${r.puntos.filter(p => p.critico && p.r === 'NO').map(p => p.texto).join('; ')}` });
      else if (!r && hora >= (role === 'lider' ? c.hora_lider : c.hora_encargado))
        out.push({ plant, nivel: 'yellow', text: role === 'lider' ? `Ya son más de las ${c.hora_lider}: envía el check list de hoy` : `${plant}: el líder no ha enviado el check list de hoy. Pídeselo antes de cerrar tu reporte.` });
    }
    return out;
  }

  const userOf = req => {
    const t = /(?:^|;\s*)sid=([a-f0-9]+)/.exec(req.headers.get('cookie') || '')?.[1];
    return t ? db.get("SELECT u.id, u.name, u.email, u.role, u.plant, u.nomina FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.created > ? AND u.status = 'activo'",
      t, Date.now() - SESSION_MS) : null;
  };
  const isOwner = user => !!ADMIN_EMAIL && user.role === 'admin' && user.email === ADMIN_EMAIL.trim().toLowerCase();
  const adminOnly = fn => (req, user, out) => user.role !== 'admin' ? json(403, { error: 'Solo admin' }) : fn(req, user, out);

  // ---------- Nómina ----------
  const nomOnly = fn => (req, user, out) => user.role === 'admin' || user.nomina ? fn(req, user, out) : json(403, { error: 'No tienes acceso a nómina. Pídeselo al administrador.' });
  const nomConfig = async () => ({ ...NOM_CONFIG, ...JSON.parse((await db.get("SELECT value FROM settings WHERE key = 'nomina'"))?.value || '{}') });
  // Empleado que el usuario puede ver (encargado: solo los de su planta).
  async function nomEmp(id, user) {
    const r = await db.get('SELECT * FROM nom_emps WHERE id = ?', Number(id));
    if (!r || (user.role !== 'admin' && r.area !== user.plant)) throw httpError(404, 'Empleado no encontrado');
    return { id: r.id, ...JSON.parse(r.data), planta: r.area };
  }
  const empOut = (e, user) => {
    if (user.role === 'admin') return e;
    const out = { ...e, conBono: Number(e.bono) > 0 };
    for (const k of NOM_MONEY) delete out[k];
    return out;
  };
  const incOut = (r, user) => {
    const i = { id: r.id, empleadoId: r.emp_id, tipo: r.tipo, fecha: r.fecha, aplicado: !!r.aplicado, creadoPor: r.creador, creadoEn: r.created_at, ...JSON.parse(r.data) };
    if (user.role !== 'admin' && NOM_PESOS.includes(i.tipo)) delete i.cantidad;
    return i;
  };
  const incRow = async id => {
    const r = await db.get('SELECT i.*, a.area FROM nom_incs i JOIN nom_emps a ON a.id = i.emp_id WHERE i.id = ?', Number(id));
    if (!r) throw httpError(404, 'Incidencia no encontrada');
    return r;
  };
  // Valida una incidencia nueva o editada. old: la que se edita (el encargado no ve ni cambia montos).
  function cleanInc(b, user, old) {
    const admin = user.role === 'admin', tipo = admin || !old ? b.tipo : old.tipo;
    if (!NOM_TIPOS.includes(tipo) || (!admin && tipo === 'bono_puntualidad')) throw httpError(400, 'Tipo de incidencia no válido');
    if (!isDate(b.fecha)) throw httpError(400, 'Revisa la fecha');
    const keep = !admin && old && NOM_PESOS.includes(tipo), cantidad = keep ? old.cantidad : Number(b.cantidad);
    if (!(cantidad > 0) || cantidad > 1_000_000) throw httpError(400, 'Revisa la cantidad');
    const nota = String(b.nota ?? '').trim().slice(0, 240);
    if (tipo === 'bono' && !nota) throw httpError(400, 'Escribe por qué se le da el bono');
    // "Ya se le pagó en efectivo": solo el admin y solo en lo que suma (queda registrado como pagado).
    const efectivo = admin ? !!b.efectivo && ['te', 'dia_extra', 'bono'].includes(tipo) : !!old?.efectivo;
    return { tipo, fecha: b.fecha, data: { ...(old || {}), cantidad, nota, efectivo, ...(efectivo && !old && { aplicadoEn: 'efectivo' }) } };
  }

  const nomRoutes = {
    // Todo lo de nómina que el usuario puede ver. Encargado: su planta y sin montos ni cierres.
    'GET /api/nomina': nomOnly(async (req, user) => {
      const admin = user.role === 'admin', areas = admin ? NOM_AREAS : [user.plant];
      const inA = areas.map(() => '?').join(', ');
      const emps = (await db.all(`SELECT * FROM nom_emps WHERE area IN (${inA})`, ...areas)).map(r => empOut({ id: r.id, ...JSON.parse(r.data), planta: r.area }, user));
      const incs = (await db.all(`SELECT i.*, u.name AS creador FROM nom_incs i JOIN nom_emps a ON a.id = i.emp_id LEFT JOIN users u ON u.id = i.user_id
        WHERE a.area IN (${inA}) AND (i.aplicado = 0 OR i.fecha >= ?) ORDER BY i.fecha DESC, i.id DESC`, ...areas, ymd(new Date(Date.now() - 400 * DAY)))).map(r => incOut(r, user));
      const cierres = admin ? (await db.all('SELECT data FROM nom_cierres ORDER BY payday DESC LIMIT 120')).map(r => JSON.parse(r.data)) : [];
      return json(200, { emps, incs, cierres, config: admin ? await nomConfig() : null, areas, admin });
    }),

    // Alta o cambio de empleado. El encargado no pone sueldos (se conservan los que puso el admin) y solo en su planta.
    'POST /api/nomina/emp': nomOnly(async (req, user) => {
      const b = await body(req), admin = user.role === 'admin', old = b.id ? await nomEmp(b.id, user) : null;
      const s = (k, n = 80) => String(b[k] ?? '').trim().slice(0, n), n = k => Math.max(0, Number(b[k]) || 0);
      const area = admin ? b.planta : user.plant;
      if (!NOM_AREAS.includes(area)) throw httpError(400, 'Elige planta: Querétaro, Silao o Administración');
      if (!s('nombre')) throw httpError(400, 'Escribe el nombre');
      for (const k of ['ingreso', 'baja']) if (b[k] && !isDate(b[k])) throw httpError(400, 'Revisa las fechas');
      const d = { nombre: s('nombre'), pago: b.pago === 'dia' ? 'dia' : 'semana', diasBase: Math.min(7, Math.max(1, n('diasBase') || 1)), ingreso: s('ingreso', 10),
        baja: s('baja', 10), vacAjuste: Number(b.vacAjuste) || 0, menor: !!b.menor, notas: s('notas', 240) };
      Object.assign(d, admin ? { sueldo: n('sueldo'), te: n('te'), teModo: b.teModo === 'manual' ? 'manual' : 'auto', bono: n('bono') }
        : Object.fromEntries(NOM_MONEY.map(k => [k, old?.[k] ?? (k === 'teModo' ? 'auto' : 0)])));
      if (old) await db.run('UPDATE nom_emps SET area = ?, data = ? WHERE id = ?', area, JSON.stringify(d), old.id);
      else await db.run('INSERT INTO nom_emps(area, data) VALUES (?, ?)', area, JSON.stringify(d));
      return json(200, { ok: true });
    }),

    // Captura: la misma incidencia para uno o varios empleados.
    'POST /api/nomina/inc': nomOnly(async (req, user) => {
      const b = await body(req), ids = [...new Set([].concat(b.emps ?? []).map(Number))].slice(0, 100);
      if (!ids.length) throw httpError(400, 'Elige al menos un empleado');
      const x = cleanInc(b, user);
      for (const id of ids) await nomEmp(id, user); // todos visibles antes de guardar nada
      for (const id of ids) await db.run('INSERT INTO nom_incs(emp_id, tipo, fecha, aplicado, data, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        id, x.tipo, x.fecha, x.data.efectivo ? 1 : 0, JSON.stringify(x.data), user.id);
      return json(200, { ok: true, n: ids.length });
    }),

    // Editar / borrar: el encargado solo lo que aún no se paga y de su planta.
    'POST /api/nomina/inc/edit': nomOnly(async (req, user) => {
      const b = await body(req), r = await incRow(b.id), admin = user.role === 'admin';
      if (!admin && (r.area !== user.plant || r.aplicado)) throw httpError(403, 'Solo puedes cambiar incidencias de tu planta que aún no se pagan');
      const emp = await nomEmp(b.empleadoId ?? r.emp_id, user), x = cleanInc(b, user, { tipo: r.tipo, ...JSON.parse(r.data) });
      delete x.data.tipo;
      const aplicado = admin ? !!b.aplicado : !!r.aplicado;
      if (admin) x.data.aplicadoEn = aplicado ? x.data.aplicadoEn || 'manual' : null;
      await db.run('UPDATE nom_incs SET emp_id = ?, tipo = ?, fecha = ?, aplicado = ?, data = ? WHERE id = ?', emp.id, x.tipo, x.fecha, aplicado ? 1 : 0, JSON.stringify(x.data), r.id);
      return json(200, { ok: true });
    }),
    // Borrar un empleado (solo la cuenta dueña). Se van sus incidencias sin pagar; las pagadas se quedan en el historial de cierres.
    'POST /api/nomina/emp/delete': async (req, user) => {
      if (!isOwner(user)) return json(403, { error: 'Solo el dueño de la cuenta puede borrar empleados' });
      const e = await nomEmp((await body(req)).id, user);
      await db.run('DELETE FROM nom_incs WHERE emp_id = ? AND aplicado = 0', e.id);
      await db.run('DELETE FROM nom_emps WHERE id = ?', e.id);
      return json(200, { ok: true });
    },
    'POST /api/nomina/inc/delete': nomOnly(async (req, user) => {
      const r = await incRow((await body(req)).id);
      if (user.role !== 'admin' && (r.area !== user.plant || r.aplicado)) throw httpError(403, 'Solo puedes borrar incidencias de tu planta que aún no se pagan');
      await db.run('DELETE FROM nom_incs WHERE id = ?', r.id);
      return json(200, { ok: true });
    }),

    // Bono de puntualidad del mes: el monto sale del empleado (el encargado lo agrega sin verlo). Uno por mes.
    'POST /api/nomina/bono': nomOnly(async (req, user) => {
      const b = await body(req), mes = String(b.mes ?? '');
      if (!/^\d{4}-\d{2}$/.test(mes)) throw httpError(400, 'Mes no válido');
      let n = 0;
      for (const id of [...new Set([].concat(b.emps ?? []).map(Number))].slice(0, 200)) {
        const e = await nomEmp(id, user);
        if (!(Number(e.bono) > 0)) continue;
        const ya = (await db.all("SELECT data FROM nom_incs WHERE emp_id = ? AND tipo = 'bono_puntualidad'", e.id)).some(r => JSON.parse(r.data).mes === mes);
        if (ya) continue;
        await db.run("INSERT INTO nom_incs(emp_id, tipo, fecha, data, user_id) VALUES (?, 'bono_puntualidad', ?, ?, ?)", e.id, ymd(),
          JSON.stringify({ cantidad: Number(e.bono), mes, nota: `Bono de puntualidad ${mes}` }), user.id);
        n++;
      }
      return json(200, { ok: true, n });
    }),

    // Pagar después / incluir esta semana (solo admin).
    'POST /api/nomina/inc/diferir': adminOnly(async req => {
      const r = await incRow((await body(req)).id), d = JSON.parse(r.data);
      await db.run('UPDATE nom_incs SET data = ? WHERE id = ?', JSON.stringify({ ...d, diferido: !d.diferido }), r.id);
      return json(200, { ok: true });
    }),

    // Cerrar semana: guarda la foto de la nómina (la calcula el panel del admin) y marca como pagadas sus incidencias.
    'POST /api/nomina/cerrar': adminOnly(async req => {
      const b = await body(req);
      if (!isDate(b.payday)) throw httpError(400, 'Semana no válida');
      const incIds = [].concat(b.incIds ?? []).map(Number).filter(Boolean);
      try { await db.run('INSERT INTO nom_cierres(payday, data) VALUES (?, ?)', b.payday, JSON.stringify({ ...b, incIds, cerradaEn: new Date().toISOString() })); }
      catch (e) { if (String(e.message).includes('UNIQUE')) throw httpError(409, 'Esa semana ya está cerrada'); throw e; }
      for (const id of incIds) {
        const r = await db.get('SELECT data FROM nom_incs WHERE id = ? AND aplicado = 0', id);
        if (r) await db.run('UPDATE nom_incs SET aplicado = 1, data = ? WHERE id = ?', JSON.stringify({ ...JSON.parse(r.data), aplicadoEn: b.payday, diferido: false }), id);
      }
      return json(200, { ok: true });
    }),
    'POST /api/nomina/reabrir': adminOnly(async req => {
      const { payday } = await body(req), c = await db.get('SELECT data FROM nom_cierres WHERE payday = ?', String(payday ?? ''));
      if (!c) throw httpError(404, 'Esa semana no está cerrada');
      for (const id of JSON.parse(c.data).incIds || []) {
        const r = await db.get('SELECT data FROM nom_incs WHERE id = ?', id), d = r && JSON.parse(r.data);
        if (d?.aplicadoEn === payday) await db.run('UPDATE nom_incs SET aplicado = 0, data = ? WHERE id = ?', JSON.stringify({ ...d, aplicadoEn: null }), id);
      }
      await db.run('DELETE FROM nom_cierres WHERE payday = ?', payday);
      return json(200, { ok: true });
    }),

    // Asistente de nómina con IA (solo admin): lee el mensaje y, si viene, el texto de un Excel / CSV, y PROPONE altas o cambios
    // de empleados e incidencias. No guarda nada: el admin edita y aplica las propuestas desde la pantalla.
    'POST /api/nomina/ai': adminOnly(async req => {
      const b = await body(req, 400_000), msgs = [].concat(b.mensajes ?? []).slice(-12).map(m => ({ rol: m?.rol === 'ia' ? 'asistente' : 'admin', texto: String(m?.texto ?? '').slice(0, 4000) }));
      if (!msgs.length || !msgs.at(-1).texto && !b.archivo) return json(400, { error: 'Escribe un mensaje o adjunta un archivo' });
      const emps = (await db.all('SELECT * FROM nom_emps')).map(r => ({ id: r.id, ...JSON.parse(r.data), planta: r.area }));
      const out = JSON.parse(await ai(
        'Eres el asistente de nómina de POLAR (Retrabajos Industriales y Limpiezas Especializadas). Escribe en español de México. ' +
        'Ayudas al administrador a llenar la nómina: das de alta o cambias empleados y capturas incidencias a partir de lo que te dice o de un Excel/CSV. ' +
        'Responde SOLO un JSON con las claves "respuesta" (texto breve para el admin: qué entendiste, qué propones y qué dudas tienes) y "cambios" (lista). ' +
        'Cada cambio es uno de: {"tipo":"empleado","id":<id si ya existe o null si es nuevo>,"nombre","planta","pago","sueldo","bono","te","teModo","diasBase","ingreso","baja","vacAjuste","menor","notas"} ' +
        '(en un cambio a un empleado existente pon id, nombre y SOLO los campos que cambian) o ' +
        '{"tipo":"incidencia","empleadoId":<id o null>,"empleado":"<nombre>","clase","fecha","cantidad","nota"}. ' +
        'Plantas: Querétaro, Silao o Administración. pago: "semana" (sueldo semanal) o "dia" (pago por día). teModo: "auto" (hora extra por fórmula) o "manual" (te = pago por hora extra). ' +
        'Clases de incidencia y su cantidad: falta (días), retardo (veces), permiso_sg = permiso sin goce (días), permiso_cg = permiso con goce (días), incapacidad (días), ' +
        'vacacion (días), te = tiempo extra (horas), dia_extra = día extra o domingo (días), bono (pesos, la nota con el motivo es obligatoria), descuento (pesos). ' +
        'Fechas en AAAA-MM-DD; si en el Excel vienen como número de serie, conviértelas (número de días desde 1899-12-30). ' +
        'Usa el id del empleado cuando el nombre coincida con uno existente (aunque varíen mayúsculas o acentos); si no existe, propón darlo de alta antes. ' +
        'No inventes datos ni dupliques lo que ya está capturado. Si algo no está claro, pregúntalo en "respuesta" y no lo propongas. Si solo te hacen una pregunta, responde con "cambios": [].',
        JSON.stringify({ hoy: ymd(), empleados: emps.map(({ id, nombre, planta, pago, sueldo, bono, ingreso, baja }) => ({ id, nombre, planta, pago, sueldo, bono, ingreso, baja })),
          conversacion: msgs, archivo: b.archivo ? { nombre: String(b.archivo.nombre ?? '').slice(0, 120), contenido: String(b.archivo.texto ?? '').slice(0, 300_000) } : null }),
        true, 180_000));
      return json(200, { respuesta: String(out.respuesta ?? ''), cambios: cleanNomCambios(out.cambios, emps) });
    }),

    // Parámetros de cálculo y corte de semana por área (solo admin).
    'POST /api/nomina/config': adminOnly(async req => {
      const b = (await body(req)).config || {}, c = await nomConfig(), pos = v => Number(v) > 0 ? Number(v) : null;
      for (const k of ['diasDivisor', 'horasJornada', 'factorTE']) c[k] = pos(b[k]) ?? c[k];
      for (const k of ['porcentaje', 'bonoDefault']) if (Number(b[k]) >= 0) c[k] = Number(b[k]);
      for (const a of NOM_AREAS) { const d = Number(b.inicio?.[a]); if (Number.isInteger(d) && d >= 0 && d <= 6) c.inicio = { ...c.inicio, [a]: d }; }
      await db.run("INSERT INTO settings(key, value) VALUES ('nomina', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", JSON.stringify(c));
      return json(200, c);
    }),

    // Dar o quitar a un encargado el acceso a nómina (solo admin; los admins ya ven todo).
    'POST /api/users/nomina': adminOnly(async req => {
      const { id, nomina } = await body(req);
      await db.run("UPDATE users SET nomina = ? WHERE id = ? AND status = 'activo'", nomina ? 1 : 0, Number(id));
      return json(200, { ok: true });
    }),
  };

  // Valida y crea una cuenta (autoregistro o creada por el admin).
  async function createUser({ name = '', email = '', password = '' }, role, status, plant = null) {
    const e = String(email).trim().toLowerCase();
    if (!String(name).trim() || !/^\S+@\S+\.\S+$/.test(e) || String(password).length < 8)
      throw httpError(400, 'Nombre, correo válido y contraseña de al menos 8 caracteres son obligatorios');
    if (await db.get('SELECT 1 FROM users WHERE email = ?', e)) throw httpError(409, 'Ese correo ya está registrado');
    if (plant !== null && !PLANTS.includes(plant)) throw badPlant();
    // Todo encargado nuevo nace con acceso a nómina (sin montos); el admin se lo puede quitar en Cuentas.
    return (await db.run('INSERT INTO users(name, email, pass, role, status, plant, nomina) VALUES (?, ?, ?, ?, ?, ?, ?)',
      String(name).trim().slice(0, 80), e, hash(String(password)), role, status, plant, role === 'colaborador' ? 1 : 0)).lastInsertRowid;
  }
  // La cookie de sesión la agrega handleApi() a la respuesta; Secure cuando el sitio va por https (Cloudflare).
  async function startSession(req, out, userId) {
    const t = crypto.randomBytes(32).toString('hex');
    await db.run('DELETE FROM sessions WHERE created < ?', Date.now() - SESSION_MS); // limpia las vencidas
    await db.run('INSERT INTO sessions(token, user_id, created) VALUES (?, ?, ?)', t, userId, Date.now());
    out.cookie = `sid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MS / 1000}${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`;
  }

  const routes = {
    ...nomRoutes,
    'GET /api/questions': async () => json(200, await currentForm()),

    // Valores que se llenan solos en el formulario (km inicial, sugerencias, pendientes abiertos).
    // ?planta= y ?excluir= (admin corrigiendo un reporte): la planta de ese reporte y el arrastre sin él.
    'GET /api/defaults': async (req, user) => {
      const q = new URL(req.url).searchParams, plant = (user.role === 'admin' && q.get('planta')) || user.plant;
      const before = q.get('excluir') ? await db.get('SELECT id, date FROM reports WHERE id = ?', Number(q.get('excluir'))) : null;
      const { km, saldos, pendientes } = await carry(plant, before), mats = Object.values(saldos);
      const pend = Object.fromEntries(Object.entries(saldos).map(([k, m]) => [k, num(m.pendientes)])); // pendientes por procesar de días anteriores
      const trucks = await db.all('SELECT name, horometro FROM trucks WHERE plant = ? ORDER BY name', plant ?? '');
      // mov: recibido / entregado por pieza ese día (?fecha= al corregir un reporte de otro día) — la sección 7 los muestra sin capturarlos.
      const mov = plant ? await movimientos(plant, q.get('fecha') || ymd()) : {};
      const catalogo = (await getCalidad()).clientes.filter(c => c.plant === plant).map(c => c.name);
      const porProcesar = mats.filter(m => num(m.pendientes) > 0).map(({ cliente, pieza }) => ({ cliente, pieza })); // renglones iniciales de la sección 7
      return json(200, { km, pendientes, pend, trucks, mov, porProcesar, tel: (await getCalidad()).tel, lists: {
        clientes: [...new Set([...catalogo, ...mats.map(m => m.cliente).filter(Boolean)])], piezas: [...new Set(mats.map(m => m.pieza).filter(Boolean))] } });
    },

    // Autoregistro: queda pendiente hasta que el admin lo aprueba (salvo ADMIN_EMAIL, que entra directo como admin).
    'POST /api/register': async (req, user, out) => {
      const b = await body(req);
      const isAdmin = ADMIN_EMAIL && String(b.email ?? '').trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
      const id = await createUser(b, isAdmin ? 'admin' : 'colaborador', isAdmin ? 'activo' : 'pendiente');
      if (!isAdmin) return json(200, { pending: true });
      await startSession(req, out, id);
      return json(200, { ok: true });
    },

    // 5 intentos fallidos seguidos bloquean ese correo 15 minutos (se revisa antes de scrypt, que gasta CPU).
    'POST /api/login': async (req, user, out) => {
      const { email = '', password = '' } = await body(req), e = String(email).trim().toLowerCase(), now = Date.now();
      const f = await db.get('SELECT n, until FROM login_fails WHERE email = ?', e);
      if (f?.until > now) return json(429, { error: 'Demasiados intentos fallidos. Espera 15 minutos o pide al administrador una contraseña nueva.' });
      const u = await db.get('SELECT id, pass, status FROM users WHERE email = ?', e);
      if (!u || !verify(String(password), u.pass)) {
        const n = (f?.n || 0) + 1;
        await db.run('INSERT INTO login_fails(email, n, until) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET n = excluded.n, until = excluded.until',
          e, n % 5, n >= 5 ? now + 15 * 60_000 : 0);
        return json(401, { error: 'Correo o contraseña incorrectos' });
      }
      await db.run('DELETE FROM login_fails WHERE email = ?', e);
      if (u.status !== 'activo') return json(403, { error: 'Tu cuenta está pendiente de aprobación del administrador' });
      await startSession(req, out, u.id);
      return json(200, { ok: true });
    },

    'POST /api/logout': async (req, user, out) => {
      await db.run('DELETE FROM sessions WHERE user_id = ?', user.id);
      out.cookie = 'sid=; Path=/; Max-Age=0';
      return json(200, { ok: true });
    },

    // owner: la cuenta dueña (ADMIN_EMAIL); solo ella borra empleados de nómina.
    'GET /api/me': (req, user) => json(200, { ...user, owner: isOwner(user) }),

    // Cambiar mi contraseña (pide la actual). Cierra las demás sesiones; esta sigue abierta con una sesión nueva.
    'POST /api/me/password': async (req, user, out) => {
      const { current = '', password = '' } = await body(req);
      if (String(password).length < 8) return json(400, { error: 'La contraseña nueva debe tener al menos 8 caracteres' });
      if (!verify(String(current), (await db.get('SELECT pass FROM users WHERE id = ?', user.id)).pass)) return json(400, { error: 'La contraseña actual no es correcta' });
      await db.run('UPDATE users SET pass = ? WHERE id = ?', hash(String(password)), user.id);
      await db.run('DELETE FROM sessions WHERE user_id = ?', user.id);
      await startSession(req, out, user.id);
      return json(200, { ok: true });
    },

    // Filtros opcionales: ?id=, ?desde=, ?hasta= (AAAA-MM-DD), ?planta=. El encargado solo ve los suyos.
    'GET /api/reports': async (req, user) => {
      const q = new URL(req.url).searchParams, where = [], p = [];
      if (user.role !== 'admin') { where.push('r.user_id = ?'); p.push(user.id); }
      for (const [k, sql] of [['id', 'r.id = ?'], ['desde', 'r.date >= ?'], ['hasta', 'r.date <= ?'], ['planta', 'r.plant = ?']])
        if (q.get(k)) { where.push(sql); p.push(k === 'id' ? Number(q.get(k)) : q.get(k)); }
      return json(200, (await db.all(`SELECT r.*, u.name FROM reports r JOIN users u ON u.id = r.user_id
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY r.date DESC, r.id DESC`, ...p)).map(parseReport));
    },

    'POST /api/reports': async (req, user) => {
      const { answers = {} } = await body(req);
      // La planta se guarda en el usuario la primera vez; después se llena sola.
      const plant = user.plant || String(answers.planta ?? '').trim();
      if (!PLANTS.includes(plant)) throw badPlant();
      const { a, form } = await prepare(plant, answers);
      if (!user.plant) await db.run('UPDATE users SET plant = ? WHERE id = ?', plant, user.id);
      let id;
      try {
        id = (await db.run('INSERT INTO reports(user_id, date, answers, plant) VALUES (?, ?, ?, ?)', user.id, ymd(), JSON.stringify(a), plant)).lastInsertRowid;
      } catch (e) {
        // id: la app ofrece corregir el que ya está (lo escrito queda en el borrador).
        if (String(e.message).includes('UNIQUE')) return json(409, { error: 'Ya enviaste tu reporte de hoy.', id: (await db.get('SELECT id FROM reports WHERE user_id = ? AND date = ?', user.id, ymd()))?.id });
        throw e;
      }
      await grade(id, a, form);
      return json(200, parseReport(await db.get('SELECT * FROM reports WHERE id = ?', id)));
    },

    // Corregir: el encargado, su reporte de hoy; el admin, cualquiera. Se recalcula contra los reportes anteriores
    // y después se vuelven a calcular los saldos de material de los siguientes de la planta (los arrastran).
    'POST /api/reports/edit': async (req, user) => {
      const { id, answers = {} } = await body(req);
      const r = await db.get('SELECT id, user_id, date, plant FROM reports WHERE id = ?', Number(id));
      if (!r || (user.role !== 'admin' && (r.user_id !== user.id || r.date !== ymd()))) throw httpError(403, 'Solo puedes corregir tu reporte de hoy');
      const { a, form } = await prepare(r.plant, answers, r, r.date);
      await db.run('UPDATE reports SET answers = ? WHERE id = ?', JSON.stringify(a), r.id);
      // ponytail: un UPDATE por reporte siguiente; si alguna planta llega a miles de reportes, recalcular en lote.
      for (const n of await db.all('SELECT id, date, answers FROM reports WHERE plant = ? AND (date > ? OR (date = ? AND id > ?)) ORDER BY date, id', r.plant, r.date, r.date, r.id)) {
        const b = JSON.parse(n.answers);
        saldar(b, (await carry(r.plant, n)).saldos);
        await db.run('UPDATE reports SET answers = ? WHERE id = ?', JSON.stringify(b), n.id);
      }
      await grade(r.id, a, form);
      return json(200, parseReport(await db.get('SELECT * FROM reports WHERE id = ?', r.id)));
    },

    // Fotos: el teléfono las reduce a JPEG antes de subirlas. La clave aleatoria (128 bits) no se puede adivinar.
    // ponytail: las fotos que se suben pero no se envían en un reporte quedan huérfanas; limpiarlas si el bucket crece.
    'POST /api/upload': async req => {
      if (req.headers.get('content-type') !== 'image/jpeg') return json(400, { error: 'Solo se aceptan fotos' });
      const bytes = new Uint8Array(await req.arrayBuffer());
      if (!bytes.length || bytes.length > 2_000_000) throw httpError(413, 'La foto pesa demasiado');
      const key = crypto.randomBytes(16).toString('hex') + '.jpg';
      await files.put(key, bytes);
      return json(200, { key });
    },

    'GET /api/files/': async req => {
      const key = new URL(req.url).pathname.slice('/api/files/'.length), f = PHOTO.test(key) && await files.get(key);
      if (!f) return json(404, { error: 'Foto no encontrada' });
      return new Response(f, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable' } });
    },

    // ---- Calidad ISO 9001 (etapa 1): PL-FOR-28 / 29 / 30 ----
    // Tablero: lotes, registros recientes y alertas (encargado: solo su planta; admin: todas o ?planta=).
    'GET /api/calidad': async (req, user) => {
      const asked = new URL(req.url).searchParams.get('planta'), plants = user.role === 'admin' ? (PLANTS.includes(asked) ? [asked] : PLANTS) : [user.plant];
      const inP = col => `${col} IN (${plants.map(() => '?').join(', ')})`, cal = await getCalidad();
      const lotes = await db.all(`SELECT * FROM lots WHERE ${inP('plant')} AND (status != 'ENTREGADO' OR delivered >= ?) ORDER BY received DESC, code DESC`,
        ...plants, ymd(new Date(Date.now() - 30 * DAY)));
      const registros = (await db.all(`SELECT q.folio, q.kind, q.plant, q.date, q.status, q.data, u.name FROM qrecords q JOIN users u ON u.id = q.user_id
        WHERE ${inP('q.plant')} AND q.kind != 'CLL' ORDER BY q.created_at DESC, q.folio DESC LIMIT 100`, ...plants)).map(r => ({ ...r, data: JSON.parse(r.data) }));
      // Alertas: las guardadas (solo gerencia las ve y las marca) + las que se calculan de los lotes.
      const alertas = user.role === 'admin' ? await db.all(`SELECT id, folio, text, created_at FROM alerts WHERE seen = 0 AND ${inP('plant')} ORDER BY id DESC`, ...plants) : [];
      const openNC = registros.filter(r => r.kind === 'NC' && r.status === 'ABIERTO').flatMap(r => r.data.lotes || []), old = ymd(new Date(Date.now() - LOT_DAYS * DAY));
      for (const l of lotes) {
        if (l.status === 'EN PLANTA' && l.received < old) alertas.push({ folio: l.rec, text: `Lote ${l.code} (${l.client}) lleva más de ${LOT_DAYS} días en planta sin liberar` });
        if (l.status === 'RETENIDO' && !openNC.includes(l.code)) alertas.push({ lote: l.code, text: `Lote ${l.code} está RETENIDO sin no conforme abierto: levanta el PL-FOR-30` });
      }
      const abiertas = (await Promise.all(plants.map(recepcionesAbiertas))).flat(), porRec = Object.fromEntries(abiertas.map(r => [r.folio, r.total]));
      for (const r of registros) if (r.kind === 'REC') r.porEntregar = porRec[r.folio] || 0;
      return json(200, { clientes: cal.clientes.filter(c => plants.includes(c.plant)), tel: cal.tel, lotes, registros, alertas, abiertas });
    },

    // Formato con las listas de la planta, más los datos de los lotes (para llenar cliente / parte solos) y las especificaciones por cliente.
    'GET /api/calidad/form': async (req, user) => {
      const q = new URL(req.url).searchParams, kind = q.get('tipo');
      if (!QFORMS[kind]) return json(404, { error: 'Formato no encontrado' });
      const plant = plantFor(user, q.get('planta')), cal = await getCalidad();
      const av = await avanceLotes(plant), lotes = (await db.all('SELECT code, client, part, qty, rec, status, proceso FROM lots WHERE plant = ? AND received >= ?', plant, ymd(new Date(Date.now() - 180 * DAY))))
        .map(l => ({ ...l, porLiberar: l.qty - (av[l.code] || AV0).inspeccionadas, entregadas: (av[l.code] || AV0).entregadas }));
      return json(200, { ...await qform(kind, plant), plant, lotes, specs: Object.fromEntries(cal.clientes.filter(c => c.plant === plant).map(c => [c.name, c.spec])) });
    },

    // Un registro con sus lotes (para verlo / imprimirlo).
    'GET /api/calidad/registro': async (req, user) => {
      const r = await getRecord(new URL(req.url).searchParams.get('folio'), user);
      const codes = r.kind === 'REC' ? r.data.partidas.map(p => p.lote) : r.kind === 'LIB' ? [r.data.lote] : r.data.lotes || [];
      const lotes = codes.length ? await db.all(`SELECT * FROM lots WHERE code IN (${codes.map(() => '?').join(', ')})`, ...codes) : [];
      const ligados = (await db.all("SELECT folio, kind, status, data FROM qrecords WHERE kind = 'NC' AND plant = ?", r.plant))
        .filter(n => JSON.parse(n.data).origen === r.folio).map(({ folio, status }) => ({ folio, status }));
      const avance = r.kind === 'REC' ? (await recepcionesAbiertas(r.plant)).find(x => x.folio === r.folio) || { total: 0, partidas: [] } : null;
      return json(200, { ...r, lotes, ligados, avance, ...QFORMS[r.kind] }); // + code, title y sections (para imprimirlo)
    },

    // PL-FOR-28: cada partida crea su lote EN PLANTA (suma al saldo de la sección 7 de ese día).
    // ponytail: varias escrituras sin transacción; si una falla a la mitad queda un folio o lote suelto. Usar db.batch de D1 si llega a pasar.
    'POST /api/calidad/rec': async (req, user) => {
      const b = await body(req), plant = plantFor(user, b.planta), a = clean(b.answers || {}, (await qform('REC', plant)).sections);
      if (!a.partidas.length) throw httpError(400, 'Agrega al menos una partida');
      const folio = await nextFolio('REC');
      for (const p of a.partidas) {
        p.diferencia = String(num(p.contada) - num(p.remision));
        p.lote = await lotCode(plant, a.fecha);
        await db.run('INSERT INTO lots(code, plant, client, part, qty, proceso, rec, status, received, due) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          p.lote, plant, a.cliente, p.parte, num(p.contada), p.proceso, folio, 'EN PLANTA', a.fecha, a.compromiso || null);
      }
      // Diferencia o algún "No" en el estado al recibir: la app avisa y ofrece levantar el no conforme precargado.
      const anomalia = a.partidas.some(p => num(p.diferencia)) || ESTADO_REC.some(([id]) => a[id] === 'No');
      await saveRecord(folio, 'REC', plant, a.fecha, user, anomalia ? 'CON OBSERVACIONES' : 'CONFORME', a);
      return json(200, { folio, anomalia, ...a });
    },

    // PL-FOR-29: NOK o RETENIDO → lote RETENIDO (hay que levantar NC); LIBERADO (+ entrega) → LIBERADO / ENTREGADO.
    'POST /api/calidad/lib': async (req, user) => {
      const b = await body(req), plant = plantFor(user, b.planta), a = clean(b.answers || {}, (await qform('LIB', plant)).sections);
      const lot = await db.get('SELECT * FROM lots WHERE code = ? AND plant = ?', a.lote, plant);
      if (lot?.status !== 'EN PLANTA') throw httpError(400, 'Ese lote no está EN PLANTA');
      if (a.criterios.length !== CRITERIOS.length || a.criterios.some((c, i) => c.criterio !== CRITERIOS[i] || !c.resultado))
        throw httpError(400, 'Marca OK o NOK en los 8 criterios de inspección');
      const nok = a.criterios.some(c => c.resultado === 'NOK'), insp = num(a.inspeccionadas), acc = num(a.aceptadas), libera = a.disposicion.startsWith('LIBERADO');
      if (acc > insp) throw httpError(400, 'Las piezas aceptadas no pueden ser más que las inspeccionadas');
      const quedan = lot.qty - ((await avanceLotes(plant))[lot.code] || AV0).inspeccionadas; // se puede liberar por partes
      if (insp > quedan) throw httpError(400, `Del lote ${lot.code} quedan ${quedan} piezas por liberar`);
      if (nok && libera) throw httpError(400, 'Con un criterio NOK no se puede liberar: elige RETENIDO / NO CONFORME y levanta el no conforme (PL-FOR-30)');
      if (a.disposicion === 'LIBERADO CON DESVIACIÓN' && !a.autorizo_cliente) throw httpError(400, 'Anota quién autorizó la desviación por parte del cliente');
      const entrega = entregaDe(a, libera);
      Object.assign(a, { cliente: lot.client, parte: lot.part, rec: lot.rec, pct: insp ? String(Math.round(acc / insp * 1000) / 10) : '0' });
      const status = nok || a.disposicion.startsWith('RETENIDO') ? 'RETENIDO' : a.disposicion === 'RETRABAJO INTERNO' ? 'RETRABAJO' : entrega ? 'ENTREGADO' : 'LIBERADO';
      const folio = await nextFolio('LIB');
      await saveRecord(folio, 'LIB', plant, a.fecha, user, status, a);
      await db.run('UPDATE lots SET status = ?, lib = ?, delivered = COALESCE(?, delivered) WHERE code = ?',
        status === 'RETENIDO' ? 'RETENIDO' : 'EN PLANTA', folio, entrega ? a.entrega_fecha : null, lot.code);
      const estado = status === 'RETENIDO' ? 'RETENIDO' : await estadoLote(lot.code, plant); // parcial: sigue EN PLANTA
      return json(200, { ...a, folio, status, estadoLote: estado, quedan: quedan - (['LIBERADO', 'ENTREGADO'].includes(status) ? insp : 0), requiereNC: status === 'RETENIDO' });
    },

    // Registrar la entrega de un lote ya LIBERADO (no se puede entregar sin liberación LIBERADO).
    'POST /api/calidad/entrega': async (req, user) => {
      const b = await body(req), r = await getRecord(b.folio, user), lot = r.kind === 'LIB' && await db.get('SELECT * FROM lots WHERE code = ?', r.data.lote);
      if (r.status !== 'LIBERADO' || !lot || lot.status === 'RETENIDO') throw httpError(400, 'Solo se puede entregar una liberación LIBERADO');
      const e = clean(b.answers || {}, [{ n: 5, title: 'Entrega', fields: ENTREGA }]);
      if (!entregaDe(e, true)) throw httpError(400, 'Para la entrega anota fecha, remisión POLAR y quién recibió');
      await db.run("UPDATE qrecords SET status = 'ENTREGADO', data = ? WHERE folio = ?", JSON.stringify({ ...r.data, ...e }), r.folio);
      await db.run('UPDATE lots SET delivered = ? WHERE code = ?', e.entrega_fecha, lot.code);
      await estadoLote(lot.code, r.plant); // ENTREGADO solo cuando ya se entregó todo el lote
      return json(200, { ok: true });
    },

    // PL-FOR-30: retiene sus lotes y avisa a gerencia. origen = folio REC / LIB de donde se levantó.
    'POST /api/calidad/nc': async (req, user) => {
      const b = await body(req), plant = plantFor(user, b.planta);
      return json(200, await saveNC(user, plant, b.answers || {}, b.origen));
    },
    'POST /api/calidad/nc/actualizar': async (req, user) => {
      const b = await body(req), r = await getRecord(b.folio, user);
      if (r.kind !== 'NC') return json(400, { error: 'Ese folio no es un no conforme' });
      return json(200, await saveNC(user, r.plant, b.answers || {}, null, r));
    },

    // Formatos de operación de la semana (encargado: su planta; admin: todas).
    'GET /api/semana': async (req, user) => json(200, await semana(user.role === 'admin' ? PLANTS : PLANTS.includes(user.plant) ? [user.plant] : [])),
    ...Object.fromEntries(Object.keys(FORMATOS).map(k => [`POST /api/calidad/${k.toLowerCase()}`, async (req, user) => json(200, await saveFormato(k, user, await body(req)))])),
    // Corregir un check list, plática o mantenimiento ya guardado (solo admin).
    'POST /api/calidad/formato/editar': adminOnly(async (req, user) => {
      const b = await body(req), r = await getRecord(b.folio, user);
      if (!FORMATOS[r.kind]) return json(400, { error: 'Ese registro no se corrige aquí' });
      return json(200, await saveFormato(r.kind, user, b, r));
    }),

    // ---- PL-FOR-43 Check list del líder de grupo ----
    // Pantalla: puntos activos de la planta, el check list del día (?fecha=, hoy por omisión), pendientes del anterior,
    // historial de 30 días (el líder: solo los suyos) y avisos. El admin además recibe el catálogo completo para editarlo.
    'GET /api/cll': async (req, user) => {
      const q = new URL(req.url).searchParams, plant = plantFor(user, q.get('planta')), fecha = isDate(q.get('fecha')) ? q.get('fecha') : ymd(), c = await getCll();
      const historial = await db.all(`SELECT folio, date, status, json_extract(data, '$.hora') hora, json_extract(data, '$.lider') lider FROM qrecords
        WHERE kind = 'CLL' AND plant = ? AND date >= ? ${user.role === 'lider' ? 'AND user_id = ?' : ''} ORDER BY date DESC`,
        plant, ymd(new Date(Date.now() - 30 * DAY)), ...(user.role === 'lider' ? [user.id] : []));
      return json(200, { plant, fecha, hoy: ymd(), catalogo: c.puntos.filter(p => p.activo && p.plantas.includes(plant)), registro: await cllDe(plant, fecha),
        pendientes: await pendientesCll(plant, fecha), historial, encargado: await encargadoDe(plant),
        avisos: await avisosCll(user.role === 'admin' ? PLANTS : [plant], user.role), ...(user.role === 'admin' ? { config: c } : {}) });
    },
    'GET /api/cll/registro': async (req, user) => {
      const r = await getRecord(new URL(req.url).searchParams.get('folio'), user);
      if (r.kind !== 'CLL' || (user.role === 'lider' && r.user_id !== user.id)) throw httpError(404, 'Registro no encontrado');
      return json(200, { folio: r.folio, plant: r.plant, status: r.status, name: r.name, ...r.data });
    },
    // Enviar (líder de su planta; el encargado si falta el líder; el admin con ?planta). Una vez enviado no se edita.
    'POST /api/cll': async (req, user) => {
      const b = await body(req, 200_000), plant = plantFor(user, b.planta), fecha = ymd(), folio = cllFolio(plant, fecha);
      if (await db.get('SELECT 1 FROM qrecords WHERE folio = ?', folio)) throw httpError(409, `El check list de hoy de ${plant} ya se envió`);
      const str = (v, n = 1000) => String(v ?? '').trim().slice(0, n), fotos = v => [].concat(v ?? []).filter(k => PHOTO.test(k)).slice(0, 10), resp = b.puntos || {};
      const puntos = (await getCll()).puntos.filter(p => p.activo && p.plantas.includes(plant)).map(p => {
        const x = resp[p.id] || {}, r = ['SI', 'NO', 'NA'].includes(x.r) ? x.r : '';
        if (!r) throw httpError(400, `Falta contestar: ${p.texto}`);
        const o = { id: p.id, seccion: p.seccion, texto: p.texto, critico: p.critico, mant: p.mant, r, obs: r === 'NO' ? str(x.obs) : '', fotos: r === 'NO' ? fotos(x.fotos) : [], estado: '', comentario: '' };
        if (r === 'NO' && !o.obs) throw httpError(400, `Escribe qué pasó y qué se hizo en: ${p.texto}`);
        if (r === 'NO' && p.foto && !o.fotos.length) throw httpError(400, `Toma una foto de: ${p.texto}`);
        return o;
      });
      const incidencias = [].concat(b.incidencias ?? []).slice(0, 30).map(i => ({ desc: str(i?.desc), hora: isHora(i?.hora) ? i.hora : '', accion: str(i?.accion),
        fotos: fotos(i?.fotos), estado: '', comentario: '' })).filter(i => i.desc);
      const no = puntos.filter(p => p.r === 'NO'), resultado = no.some(p => p.critico) ? CLL_RES[2] : no.length ? CLL_RES[1] : CLL_RES[0];
      const a = { fecha, hora: horaMx(), turno: '1', lider: user.name, encargado: await encargadoDe(plant), resultado, puntos, incidencias };
      await saveRecord(folio, 'CLL', plant, fecha, user, resultado, a);
      if (resultado === CLL_RES[2]) await db.run('INSERT INTO alerts(plant, folio, text) VALUES (?, ?, ?)', plant, folio,
        `URGENTE · Check list del líder ${plant}: ${no.filter(p => p.critico).map(p => `${p.texto} (${p.obs})`).join('; ')}`.slice(0, 1000));
      return json(200, { folio, plant, ...a });
    },
    // El encargado (o gerencia) marca cada NO / incidencia del líder ATENDIDO o PENDIENTE con un comentario.
    'POST /api/cll/atender': async (req, user) => {
      const b = await body(req), r = await getRecord(b.folio, user);
      if (r.kind !== 'CLL' || user.role === 'lider') throw httpError(403, 'Solo el encargado o gerencia marcan los puntos');
      const x = b.tipo === 'inc' ? r.data.incidencias[Number(b.i)] : r.data.puntos.find(p => p.id === Number(b.i) && p.r === 'NO');
      if (!x || !['ATENDIDO', 'PENDIENTE'].includes(b.estado)) throw httpError(400, 'Punto no encontrado');
      Object.assign(x, { estado: b.estado, comentario: String(b.comentario ?? '').trim().slice(0, 500), por: user.name });
      await db.run('UPDATE qrecords SET data = ? WHERE folio = ?', JSON.stringify(r.data), r.folio);
      return json(200, { ok: true });
    },
    // Catálogo de puntos y horas de recordatorio (gerencia = admin). Agregar, editar o desactivar sin programar.
    'POST /api/cll/catalogo': adminOnly(async req => {
      const c = cleanCll(await body(req));
      await db.run("INSERT INTO settings(key, value) VALUES ('cll', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", JSON.stringify(c));
      return json(200, c);
    }),

    // Catálogo de clientes (con su especificación para el criterio 7) y teléfono de gerencia (solo admin).
    'POST /api/calidad/config': adminOnly(async req => {
      const b = await body(req), str = (v, n) => String(v ?? '').trim().slice(0, n), seen = new Set();
      const clientes = [].concat(b.clientes ?? []).slice(0, 100).map(c => ({ name: str(c?.name, 60), plant: c?.plant, spec: str(c?.spec, 300) }))
        .filter(c => c.name && PLANTS.includes(c.plant) && !seen.has(c.plant + c.name) && seen.add(c.plant + c.name));
      const tel = str(b.tel, 20);
      if (tel && !/^[+\d\s()-]+$/.test(tel)) return json(400, { error: 'El teléfono solo puede llevar números, espacios, +, ( ) y -' });
      await db.run("INSERT INTO settings(key, value) VALUES ('calidad', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", JSON.stringify({ clientes, tel }));
      return json(200, { clientes, tel });
    }),

    'POST /api/calidad/alertas/vista': adminOnly(async req => {
      await db.run('UPDATE alerts SET seen = 1 WHERE id = ?', Number((await body(req)).id));
      return json(200, { ok: true });
    }),

    // ---- Camiones por planta (el admin los registra; el encargado solo ve los de su planta) ----
    'GET /api/trucks': async (req, user) => json(200, user.role === 'admin'
      ? await db.all('SELECT * FROM trucks ORDER BY plant, name')
      : await db.all('SELECT * FROM trucks WHERE plant = ? ORDER BY name', user.plant ?? '')),

    'POST /api/trucks': adminOnly(async req => {
      const { plant = '', name = '', horometro } = await body(req), n = String(name).trim().slice(0, 60);
      if (!PLANTS.includes(plant)) throw badPlant();
      if (!n) return json(400, { error: 'Escribe el nombre o las placas del camión' });
      try { await db.run('INSERT INTO trucks(plant, name, horometro) VALUES (?, ?, ?)', plant, n, horometro ? 1 : 0); }
      catch (e) { if (String(e.message).includes('UNIQUE')) return json(409, { error: `Ya existe "${n}" en ${plant}` }); throw e; }
      return json(200, { ok: true });
    }),

    // Los reportes ya enviados conservan el nombre del camión.
    'POST /api/trucks/delete': adminOnly(async req => {
      await db.run('DELETE FROM trucks WHERE id = ?', Number((await body(req)).id));
      return json(200, { ok: true });
    }),

    // ---- Personalización del formulario (solo admin) ----
    'GET /api/form-config': adminOnly(async () => json(200, { base: FORM, config: await getConfig(), protected: [...PROTECTED] })),

    'POST /api/form-config': adminOnly(async req => {
      const config = cleanConfig((await body(req)).config);
      await db.run("INSERT INTO settings(key, value) VALUES ('form', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", JSON.stringify(config));
      return json(200, config);
    }),

    // Vista previa: el formulario tal como lo vería el encargado con esta configuración (sin guardarla).
    'POST /api/form-config/preview': adminOnly(async req => json(200, formFor(cleanConfig((await body(req)).config)))),

    // La IA solo PROPONE: devuelve una configuración validada que el admin revisa y aplica (o descarta).
    'POST /api/form-config/ai': adminOnly(async req => {
      const instruction = String((await body(req)).instruction ?? '').trim().slice(0, 1000);
      if (!instruction) return json(400, { error: 'Escribe qué quieres cambiar' });
      const out = JSON.parse(await ai(
        'Modificas la configuración del formulario PL-FOR-26 de una app de reportes diarios. Escribe en español. ' +
        'Responde SOLO un JSON con las claves "config" (la configuración COMPLETA nueva) y "resumen" (1-3 oraciones de lo que cambiaste). ' +
        'Formato de config: {"sections":{"<n>":{"title":"...","hidden":true}},"fields":{"<clave>":{"label":"...","hidden":true}},' +
        '"extra":{"<n>":[{"id":"x_...","label":"...","type":"text|textarea|number|sino|select|date|time","options":["..."],"required":false}]}}. ' +
        'Reglas: conserva todo lo que no se pidió cambiar; para preguntas nuevas usa id "x_" + palabras en minúsculas con guion bajo; ' +
        'type "select" requiere options; no ocultes campos con protegido=true ni la sección 1.',
        JSON.stringify({ secciones: FORM.map(s => ({ n: s.n, titulo: s.title, campos: keysOf(s).map(([k, f]) => ({ clave: k, etiqueta: f.label, protegido: !canHide(k, f) })) })),
          config_actual: await getConfig(), instruccion: instruction }), true));
      return json(200, { config: cleanConfig(out.config), resumen: String(out.resumen ?? '') });
    }),

    // ---- Cuentas (solo admin) ----
    'GET /api/users': adminOnly(async (req, user) => json(200,
      await db.all("SELECT id, name, email, plant, role, status, nomina FROM users WHERE id != ? AND status != 'eliminado' ORDER BY status = 'pendiente' DESC, name", user.id))),

    // Cambiar rol (encargado ↔ admin). Aplica en la siguiente petición: el rol se lee de la base en cada una.
    'POST /api/users/role': adminOnly(async (req, user) => {
      const { id, role } = await body(req);
      if (Number(id) === user.id) return json(400, { error: 'No puedes cambiar tu propio rol' });
      if (!['admin', 'colaborador', 'lider'].includes(role)) return json(400, { error: 'Rol inválido' });
      if (role !== 'admin' && !(await db.get('SELECT plant FROM users WHERE id = ?', Number(id)))?.plant) throw badPlant();
      await db.run("UPDATE users SET role = ? WHERE id = ? AND status = 'activo'", role, Number(id));
      return json(200, { ok: true });
    }),

    // Eliminar = quitar el acceso. Los reportes se conservan (son historial de la planta) y el correo queda libre.
    'POST /api/users/delete': adminOnly(async (req, user) => {
      const id = Number((await body(req)).id);
      if (id === user.id) return json(400, { error: 'No puedes eliminar tu propia cuenta' });
      await db.run("UPDATE users SET status = 'eliminado', email = 'eliminado-' || id || '-' || email WHERE id = ? AND status = 'activo'", id);
      await db.run('DELETE FROM sessions WHERE user_id = ?', id);
      return json(200, { ok: true });
    }),

    'POST /api/users': adminOnly(async req => {
      const b = await body(req);
      const role = ['admin', 'lider'].includes(b.role) ? b.role : 'colaborador', plant = String(b.plant ?? '').trim() || null;
      if (role !== 'admin' && !plant) throw badPlant(); // el encargado y el líder siempre tienen planta
      await createUser(b, role, 'activo', plant);
      return json(200, { ok: true });
    }),

    // Contraseña nueva (para quien la olvidó): cierra sus sesiones y quita el bloqueo por intentos fallidos.
    'POST /api/users/password': adminOnly(async req => {
      const { id, password = '' } = await body(req);
      if (String(password).length < 8) return json(400, { error: 'La contraseña debe tener al menos 8 caracteres' });
      const u = await db.get("SELECT email FROM users WHERE id = ? AND status = 'activo'", Number(id));
      if (!u) return json(400, { error: 'Cuenta no encontrada' });
      await db.run('UPDATE users SET pass = ? WHERE id = ?', hash(String(password)), Number(id));
      await db.run('DELETE FROM sessions WHERE user_id = ?', Number(id));
      await db.run('DELETE FROM login_fails WHERE email = ?', u.email);
      return json(200, { ok: true });
    }),

    'POST /api/users/approve': adminOnly(async req => {
      const { id, plant = '' } = await body(req);
      if (!PLANTS.includes(plant)) throw badPlant();
      await db.run("UPDATE users SET status = 'activo', plant = ? WHERE id = ? AND status = 'pendiente'", plant, Number(id));
      return json(200, { ok: true });
    }),

    // Rechazar = borrar la solicitud (una cuenta pendiente no tiene reportes).
    'POST /api/users/reject': adminOnly(async req => {
      await db.run("DELETE FROM users WHERE id = ? AND status = 'pendiente'", Number((await body(req)).id));
      return json(200, { ok: true });
    }),

    'GET /api/weekly': adminOnly(async () => json(200, await db.all('SELECT * FROM weekly ORDER BY id DESC'))),

    'POST /api/weekly': adminOnly(async () => {
      const start = ymd(new Date(Date.now() - 6 * DAY)), form = await currentForm();
      const rows = (await db.all('SELECT r.*, u.name FROM reports r JOIN users u ON u.id = r.user_id WHERE r.date >= ? ORDER BY u.name, r.date', start)).map(parseReport);
      if (!rows.length) return json(400, { error: 'No hay reportes en los últimos 7 días' });
      const cll = (await db.all("SELECT plant, data FROM qrecords WHERE kind = 'CLL' AND date >= ?", start)).map(r => ({ plant: r.plant, ...JSON.parse(r.data) }));
      const cllTxt = PLANTS.map(p => { const mine = cll.filter(c => c.plant === p), n = {};
        for (const c of mine) for (const x of c.puntos) if (x.r === 'NO') n[x.texto] = (n[x.texto] || 0) + 1;
        return `${p}: check list del líder enviado ${mine.length} de 7 días; puntos en NO: ${Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, k]) => `${t} (${k})`).join(', ') || 'ninguno'}`; }).join('\n');
      const text = await ai(
        'Eres un analista que prepara el resumen semanal de los reportes diarios de operación e incidencias (PL-FOR-26) de las plantas para gerencia. ' +
        'Escribe en español, texto plano (sin markdown), con estas secciones: Panorama general, Personal (faltas, permisos, reportes), ' +
        'Material por cliente y producción, Gas y gastos (con totales), Químicos por pedir, Incidencias y mantenimiento pendiente, ' +
        'Desempeño por encargado (incluye su calidad promedio de reporte), Check list del líder (días enviados y puntos que más salieron en NO), Recomendaciones.',
        rows.map(r => `### ${r.name} — planta ${r.plant ?? '—'} — ${r.date} (calidad: ${r.score ?? 'sin evaluar'})\n${formatAnswers(r.answers, form)}`).join('\n\n') + '\n\n### Check list del líder de grupo\n' + cllTxt,
        false, 300_000);
      await db.run('INSERT INTO weekly(start, end, text) VALUES (?, ?, ?)', start, ymd(), text);
      return json(200, { ok: true });
    }),
  };

  const LIDER_OK = new Set(['GET /api/questions', 'GET /api/me', 'POST /api/logout', 'POST /api/me/password', 'POST /api/upload', 'GET /api/files/', 'GET /api/cll', 'GET /api/cll/registro', 'POST /api/cll']);
  // Atiende /api/*: Request → Response (Fetch API, igual en Node y en Workers).
  return async function handleApi(req) {
    try {
      const path = new URL(req.url).pathname, key = `${req.method} ${path.startsWith('/api/files/') ? '/api/files/' : path}`, route = routes[key];
      if (!route) return json(404, { error: 'No encontrado' });
      const open = ['/api/questions', '/api/register', '/api/login'].includes(path);
      const user = await userOf(req);
      if (!open && !user) return json(401, { error: 'Inicia sesión' });
      // El líder de grupo solo llena su check list (se valida aquí, no solo ocultando botones).
      if (user?.role === 'lider' && !LIDER_OK.has(key)) return json(403, { error: 'Tu cuenta de líder de grupo solo puede llenar el check list' });
      const out = { cookie: null }, res = await route(req, user, out);
      if (out.cookie) res.headers.set('Set-Cookie', out.cookie);
      return res;
    } catch (e) {
      console.error(e);
      return json([400, 403, 404, 409, 413].includes(e.code) ? e.code : 500, { error: e.message });
    }
  };
}
