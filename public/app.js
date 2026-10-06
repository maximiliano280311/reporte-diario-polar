// Compartido por la app de teléfono (index.html, data-mode="app") y el panel web de admin (admin.html, data-mode="web").
const WEB = document.documentElement.dataset.mode === 'web';
// Computadora = pantalla de 1024px o más (o el panel web). Decide el diseño; los permisos los decide WEB.
const DESK = matchMedia('(min-width: 1024px)');
let WIDE = WEB || DESK.matches;

// Tokens copiados del design system de Stitch ("Sapphire Pulse") para poder pegar su HTML tal cual.
tailwind.config = { theme: { extend: {
  colors: { primary: "#004ac6", "primary-container": "#2563eb", "surface-tint": "#0053db", surface: "#f8f9ff",
    "surface-container-lowest": "#ffffff", "surface-container-low": "#eff4ff", "surface-container": "#e5eeff",
    "surface-container-high": "#dce9ff", "surface-container-highest": "#d3e4fe", "on-surface": "#0b1c30",
    "on-surface-variant": "#434655", outline: "#737686", "outline-variant": "#c3c6d7", "on-primary": "#ffffff", "on-primary-container": "#eeefff",
    secondary: "#006c49", "on-secondary": "#ffffff", "secondary-container": "#6cf8bb", "on-secondary-container": "#00714d",
    tertiary: "#784b00", "on-tertiary": "#ffffff", "tertiary-fixed": "#ffddb8", "tertiary-fixed-dim": "#ffb95f", "on-tertiary-fixed": "#2a1700",
    error: "#ba1a1a", "error-container": "#ffdad6", "on-error-container": "#93000a" },
  fontSize: { "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
    "headline-md": ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
    "headline-sm": ["18px", { lineHeight: "26px", fontWeight: "600" }],
    "body-lg": ["16px", "24px"], "body-md": ["14px", "20px"], "body-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.01em" }],
    "label-lg": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
    "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
    "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.03em", fontWeight: "500" }] },
  spacing: { "space-xs": "0.25rem", "space-sm": "0.5rem", "space-md": "0.75rem", "space-lg": "1rem", "space-xl": "1.5rem", margin: "1rem", gutter: "1rem" },
  fontFamily: { sans: ["Manrope", "sans-serif"] } } } };

document.head.insertAdjacentHTML('beforeend', `<style>
  .card { background: #fff; border-radius: 1rem; box-shadow: 0 1px 3px rgba(15,23,42,.05), 0 1px 2px rgba(15,23,42,.03); }
  .input { width: 100%; border-radius: .75rem; border: 1.5px solid #cbd5e1; background: #fff; padding: .75rem 1rem; outline: none; }
  .input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
  .input:disabled { background: #f1f5f9; border-color: #e2e8f0; cursor: not-allowed; }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; min-height: 48px; border-radius: .75rem; font-weight: 600; padding: 0 1.25rem; transition: all .15s; }
  .btn-primary { background: #2563eb; color: #fff; } .btn-primary:hover { background: #1d4ed8; } .btn:disabled { opacity: .6; }
  .chip { display: inline-flex; align-items: center; gap: .35rem; padding: .15rem .6rem; border-radius: 9999px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  details > summary { list-style: none; cursor: pointer; } details > summary::-webkit-details-marker { display: none; }
  @media (min-width: 1024px) { body.chrome #shell { padding-left: 16rem; } } /* espacio del menú lateral (app en computadora) */
  /* Documento PL-FOR-26 (igual al formato en papel) */
  .pl { background: #fff; color: #000; font-size: 11px; padding: 16px; max-width: 900px; margin: 0 auto; overflow-x: auto; }
  .pl table { width: 100%; border-collapse: collapse; }
  .pl th, .pl td { border: 1px solid #000; padding: 3px 6px; vertical-align: top; }
  .pl th, .pl .k { background: #dce6f1; font-weight: 700; font-size: 10px; text-transform: uppercase; }
  .pl th { text-align: center; } .pl .k { width: 35%; } .pl .c { text-align: center; font-weight: 700; }
  .pl .bar { background: #1f4e79; color: #fff; font-weight: 700; text-align: center; padding: 3px; margin-top: 10px; }
  .pl .head .bar { margin: 0; } .pl .head td:last-child { white-space: nowrap; } .pl .head .t { text-align: center; font-weight: 700; font-size: 13px; vertical-align: middle; }
  .pl .head .logo { width: 120px; text-align: center; vertical-align: middle; font-weight: 700; font-size: 18px; color: #1f4e79; letter-spacing: .1em; }
  .pl .checks { display: grid; grid-template-columns: 1fr 1fr; border-left: 1px solid #000; }
  .pl .checks span { padding: 2px 6px; border-right: 1px solid #000; border-bottom: 1px solid #000; }
  .pl .hint { font-style: italic; font-size: 9px; margin: 2px 0 0; }
  .pl .firmas { margin-top: 12px; } .pl .firmas td { height: 64px; vertical-align: bottom; text-align: center; width: 50%; }
  @media print { [data-chrome], .no-print { display: none !important; } #app { padding: 0 !important; max-width: none !important; } .pl { padding: 0; } }
</style>`);

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ymd = (d = new Date()) => d.toLocaleDateString('en-CA');
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
const fdate = (d, opts = { weekday: 'long', day: 'numeric', month: 'long' }) => {
  const s = new Date(d + 'T12:00').toLocaleDateString('es-MX', opts); return s[0].toUpperCase() + s.slice(1);
};
async function api(path, data) {
  const r = await fetch(path, data ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : {});
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && !path.includes('login') && path !== '/api/me') { me = null; location.hash = '#/login'; }
  if (!r.ok) throw new Error(j.error || 'Error inesperado');
  return j;
}
let me = null, questions = [], reports = [];

function quality(score) {
  if (score == null) return { cls: 'bg-surface-container text-on-surface-variant', dot: 'bg-outline-variant', label: 'Sin evaluar' };
  if (score >= 80) return { cls: 'bg-secondary-container text-on-secondary-container', dot: 'bg-secondary', label: `Excelente · ${score}` };
  if (score >= 60) return { cls: 'bg-tertiary-fixed text-on-tertiary-fixed', dot: 'bg-tertiary', label: `Aceptable · ${score}` };
  return { cls: 'bg-error-container text-on-error-container', dot: 'bg-error', label: `Mejorable · ${score}` };
}
const qChip = s => { const q = quality(s); return `<span class="chip ${q.cls}"><span class="w-1.5 h-1.5 rounded-full ${q.dot}"></span>${q.label}</span>`; };
const avg = xs => { const v = xs.filter(x => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
function streak(dates) {
  const set = new Set(dates), d = new Date(); let n = 0;
  if (!set.has(ymd(d))) d.setDate(d.getDate() - 1);
  while (set.has(ymd(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const PLANTS = ['Querétaro', 'Silao']; // igual que en server.mjs
const plantSelect = (attrs, v = '') => `<select class="input" ${attrs}><option value="">Selecciona planta…</option>${PLANTS.map(p => `<option ${p === v ? 'selected' : ''}>${p}</option>`).join('')}</select>`;
const dmy = d => d ? d.split('-').reverse().join('/') : '';
// Acciones destructivas: el primer toque pide confirmación en el mismo botón (sin diálogos del navegador).
const confirmed = btn => btn.dataset.sure ? true : (btn.dataset.sure = 1, btn.lastChild.textContent = '¿Seguro? Toca otra vez', false);
const showErr = err => { $('#err').textContent = err.message; $('#err').classList.remove('hidden'); };
const money = n => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const sum = (rows, k) => (rows || []).reduce((t, x) => t + (Number(x[k]) || 0), 0);
const nInc = r => r.answers.incidencias?.length || 0;

// ---------- Cuestionario PL-FOR-26 (el esquema viene de /api/questions) ----------
function input(f, name, v = '') {
  const req = f.required ? 'required' : '';
  if (f.type === 'textarea') return `<textarea class="input" rows="2" name="${name}" ${req}>${esc(v)}</textarea>`;
  if (f.type === 'select') return `<select class="input" name="${name}" ${req}><option value="">Selecciona…</option>${f.options.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  if (f.type === 'check') return `<input type="checkbox" name="${name}" value="N/A" ${v ? 'checked' : ''} class="w-6 h-6 shrink-0 accent-[#2563eb]">`;
  if (f.type === 'checks') return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-2 pt-1">${f.options.map(o => `<label class="flex items-center gap-3 text-body-md text-on-surface"><input type="checkbox" name="${name}" value="${esc(o)}" class="w-5 h-5 shrink-0 accent-[#2563eb]">${esc(o)}</label>`).join('')}</div>`;
  return `<input class="input" name="${name}" value="${esc(v)}" type="${['number', 'date', 'time'].includes(f.type) ? f.type : 'text'}" ${f.type === 'number' ? 'step="any" min="0" inputmode="decimal"' : ''} ${f.list ? `list="dl-${f.list}"` : ''} ${req}>`;
}
const labeled = (f, html) => `<label class="flex ${f.type === 'check' ? 'flex-row-reverse justify-end items-center self-end h-12 gap-2' : 'flex-col gap-1'} text-label-md text-on-surface-variant ${f.type === 'checks' ? 'col-span-2 lg:col-span-4' : f.wide ? 'col-span-2' : ''}">
  <span>${esc(f.label)}${f.required ? ' <span class="text-error">*</span>' : ''}</span>${html}</label>`;
let rowN = 0; // los renglones se nombran tabla.N.columna
const rowHtml = (t, r = {}) => {
  const i = rowN++, cols = t.cols.filter(c => !c.auto), f = id => input(cols.find(c => c.id === id), `${t.id}.${i}.${id}`, r[id]);
  // Sección 7 (boceto): "[33] piezas modelo/No. Parte [r6gk]"; en pantallas angostas el modelo baja a la siguiente línea.
  const piezas = () => `<div class="col-span-2 flex flex-col gap-1 text-label-md text-on-surface-variant"><span>Pieza / No. de parte</span>
    <div class="flex flex-wrap items-center gap-2"><label class="w-20 shrink-0"><span class="sr-only">Piezas</span>${f('cantidad')}</label>
    <span class="text-body-md text-on-surface shrink-0">piezas modelo/No. Parte</span>
    <label class="flex-1 min-w-[120px]"><span class="sr-only">Modelo/No. Parte</span>${f('pieza')}</label></div></div>`;
  return `
  <div data-row class="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3 rounded-xl bg-surface-container-low">
    ${cols.map(c => t.id !== 'material' ? labeled(c, f(c.id)) : c.id === 'cantidad' ? piezas() : c.id === 'pieza' ? '' : labeled(c, f(c.id))).join('')}
    ${t.id === 'material' ? '<p data-pend class="col-span-2 self-end p-2 rounded-lg bg-tertiary-fixed/50 text-label-md text-on-tertiary-fixed" aria-live="polite"></p>' : ''}
    ${t.fixed ? '' : '<button type="button" data-del class="col-span-2 lg:col-span-4 justify-self-end text-label-sm text-error flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">delete</span>Quitar</button>'}
  </div>`; };

// Documento PL-FOR-26 armado con las respuestas (solo admin).
function plDoc(r) {
  const a = r.answers, gas = sum(a.gas, 'importe'), gastos = sum(a.gastos, 'importe');
  const pedir = [...(a.quimicos || []).filter(q => ['PT', 'A'].includes(q.existencia)).map(q => `${q.quimico} (${q.existencia})`), a.pedir].filter(Boolean).join(', ');
  const kv = pairs => `<table><tbody>${pairs.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v) || '&nbsp;'}</td></tr>`).join('')}</tbody></table>`;
  const extra = { 5: [['Total de hornos', (a.hornos || []).length], ['Total de ciclos', sum(a.hornos, 'ciclos')]],
    6: [['⚠ Químicos que hay que pedir', pedir]],
    12: [['Total gastos', money(gastos)], ['Total cargas de gas (sección 4)', money(gas)], ['Total del día', money(gastos + gas)]] };
  return `<div class="pl">
    <table class="head"><tr><td rowspan="3" class="logo">POLAR</td><td rowspan="2" class="t">RETRABAJOS INDUSTRIALES Y LIMPIEZAS ESPECIALIZADAS POLAR</td><td class="k">Número de control</td><td>PL-FOR-26</td></tr>
      <tr><td class="k">Revisión</td><td>06</td></tr>
      <tr><td class="bar">REPORTE DIARIO DE OPERACIÓN E INCIDENCIAS</td><td class="k">Fecha emisión</td><td>OCT-2026</td></tr></table>
    ${questions.map(s => {
      const t = s.table, rows = t ? a[t.id] || [] : [], fs = s.fields || [];
      const plain = fs.filter(f => f.type !== 'checks' && f.id !== 'pedir'), after = plain.filter(f => f.after).map(f => [f.label, a[f.id]]);
      const pairs = [...(s.n === 1 ? [['Fecha', dmy(r.date)], ['Planta', r.plant], ['Elaboró', r.name]] : []),
        ...plain.filter(f => !f.after).map(f => [f.label, a[f.id]])];
      return `<div class="bar">${s.n}. ${esc(s.title.toUpperCase())}</div>
      ${pairs.length ? kv(pairs) : ''}
      ${fs.filter(f => f.type === 'checks').map(f => `<div class="checks">${f.options.map(o => `<span>${(a[f.id] || []).includes(o) ? '☒' : '☐'} ${esc(o.toUpperCase())}</span>`).join('')}</div>`).join('')}
      ${t ? `<table><thead><tr>${t.cols.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.length
        ? rows.map(x => `<tr>${t.cols.map(c => `<td>${esc(c.type === 'date' ? dmy(x[c.id]) : x[c.id])}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${t.cols.length}" class="c">${t.empty || '—'}</td></tr>`}</tbody></table>` : ''}
      ${after.length || extra[s.n] ? kv([...after, ...(extra[s.n] || [])]) : ''}
      ${s.hint ? `<p class="hint">${esc(s.hint)}</p>` : ''}`;
    }).join('')}
    <table class="firmas"><tr><td>${esc(r.name)}<br><b>ELABORÓ — ENCARGADO DE PLANTA</b></td><td><b>REVISÓ — GERENCIA</b></td></tr></table>
  </div>`;
}
const logo = size => `<span class="material-symbols-outlined text-primary-container" style="font-size:${size}px;font-variation-settings:'FILL' 1">verified_user</span>`;

// ---------- Vistas ----------
const views = {
  login() {
    let mode = 'login';
    const render = () => {
      $('#app').innerHTML = `
      <div class="max-w-md mx-auto ${WEB ? 'pt-16' : ''}">
      <div class="flex flex-col items-center text-center pt-8 gap-3">
        <div class="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center">${logo(48)}</div>
        <span class="chip bg-surface-container-high text-secondary"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>${WEB ? 'PANEL DE ADMINISTRACIÓN' : 'PLATAFORMA OPERATIVA'}</span>
        <h1 class="text-3xl font-bold tracking-tight">Reporte Diario Polar</h1>
        <p class="text-on-surface-variant">${WEB ? 'Supervisa los reportes de tu equipo con resúmenes de IA' : 'Gestiona tu jornada laboral de forma ágil y ordenada'}</p>
      </div>
      <form id="auth" class="card p-5 mt-6 flex flex-col gap-4">
        ${mode === 'register' ? `<label class="flex flex-col gap-1.5 text-sm font-medium">Nombre completo<input class="input" name="name" required autocomplete="name"></label>` : ''}
        <label class="flex flex-col gap-1.5 text-sm font-medium">Correo<input class="input" name="email" type="email" required autocomplete="email" placeholder="nombre@empresa.com"></label>
        <label class="flex flex-col gap-1.5 text-sm font-medium">Contraseña<input class="input" name="password" type="password" required minlength="8" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}"></label>
        <p id="err" class="text-sm text-error hidden" role="alert"></p>
        <button class="btn btn-primary w-full">${mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}<span class="material-symbols-outlined">arrow_forward</span></button>
      </form>
      <p class="text-center text-sm text-on-surface-variant mt-6">${mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
        <button id="toggle" class="text-primary font-semibold">${mode === 'login' ? 'Regístrate' : 'Inicia sesión'}</button></p>
      </div>`;
      $('#toggle').onclick = () => { mode = mode === 'login' ? 'register' : 'login'; render(); };
      $('#auth').onsubmit = async e => {
        e.preventDefault();
        const btn = e.target.querySelector('button'); btn.disabled = true;
        try {
          const r = await api(`/api/${mode}`, Object.fromEntries(new FormData(e.target)));
          if (!r.pending) return await boot();
          $('#auth').outerHTML = `<div class="card p-5 mt-6 flex flex-col items-center text-center gap-2">
            <span class="material-symbols-outlined text-tertiary text-[40px]">hourglass_top</span>
            <p class="font-semibold">Tu cuenta fue creada</p>
            <p class="text-sm text-on-surface-variant">Está pendiente de aprobación. Podrás iniciar sesión cuando el administrador la apruebe.</p></div>`;
        }
        catch (err) { $('#err').textContent = err.message; $('#err').classList.remove('hidden'); btn.disabled = false; }
      };
    };
    render();
  },

  // Panel web: los colaboradores usan la app del teléfono.
  soloAdmin() {
    $('#app').innerHTML = `
    <div class="max-w-md mx-auto pt-24 flex flex-col items-center text-center gap-3">
      <div class="w-16 h-16 rounded-full bg-surface-container-high text-primary flex items-center justify-center"><span class="material-symbols-outlined text-[36px]">smartphone</span></div>
      <h1 class="text-2xl font-bold">Usa la app Reporte Diario Polar</h1>
      <p class="text-on-surface-variant">Hola ${esc(me.name)}, este panel es solo para administradores. Llena tus reportes desde la app en tu teléfono.</p>
      <button data-logout class="btn btn-primary mt-2"><span class="material-symbols-outlined">logout</span>Cerrar sesión</button>
    </div>`;
  },

  // Diseño: pantalla "Dashboard Principal" del proyecto Stitch "Remix of Daily Form Dashboard".
  async inicio() {
    reports = await api('/api/reports');
    const today = ymd(), todayDone = reports.find(r => r.date === today);
    const monday = new Date(); monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    const week = [...Array(7)].map((_, i) => { const d = new Date(monday); d.setDate(d.getDate() + i); return ymd(d); });
    const dates = reports.map(r => r.date), last = reports[0];
    const weekCount = week.filter(d => dates.includes(d)).length;
    const monthPct = Math.round(100 * dates.filter(d => d.startsWith(today.slice(0, 7))).length / new Date().getDate());
    const lastTitle = !last ? '' : last.date === today ? 'Formulario de hoy' : last.date === daysAgo(1) ? 'Formulario de ayer' : 'Formulario anterior';
    const lastTime = last?.created_at ? ' • ' + new Date(last.created_at.replace(' ', 'T') + 'Z').toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' hrs' : '';
    const nCli = last ? new Set((last.answers.material || []).map(m => m.cliente)).size : 0;
    const inc = last ? nInc(last) : 0;
    $('#app').innerHTML = `
    <div class="grid w-full gap-space-lg lg:grid-cols-2 lg:items-start">
      <div class="flex flex-col pt-space-xs lg:col-span-2">
        <div class="flex items-center gap-1.5">
          <h1 class="text-headline-lg-mobile text-on-surface tracking-tight">¡Hola, ${esc(me.name.split(' ')[0])}!</h1>
          <span class="text-xl animate-bounce">👋</span>
        </div>
        <p class="text-label-md text-on-surface-variant flex items-center gap-1 mt-0.5">
          <span class="material-symbols-outlined text-[16px] text-primary">calendar_today</span><span>${fdate(today)}</span></p>
      </div>
      <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary-container to-surface-tint p-space-lg text-on-primary shadow-xl">
        <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-on-primary/10 rounded-full blur-xl pointer-events-none"></div>
        <div class="absolute top-3 right-3 opacity-15 pointer-events-none">
          <svg fill="none" height="84" viewBox="0 0 100 100" width="84" aria-hidden="true">
            <path d="M50 8L15 24V48C15 71 30 92 50 98C70 92 85 71 85 48V24L50 8Z" stroke="currentColor" stroke-linejoin="round" stroke-width="6"></path>
            <path d="M35 50L45 60L65 40" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="7"></path></svg>
        </div>
        <div class="relative z-10 flex flex-col gap-space-md">
          ${todayDone ? `
          <div><span class="chip bg-secondary-container text-on-secondary-container">Enviado</span></div>
          <div class="flex flex-col gap-1">
            <h2 class="text-headline-sm font-bold tracking-tight">Tu reporte de hoy ya fue enviado</h2>
            <p class="text-body-md text-on-primary-container/90 leading-relaxed">${esc(todayDone.feedback || 'Gracias por reportar tu jornada.')}</p>
          </div>
          <div>${qChip(todayDone.score)}</div>` : `
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-semibold shadow-sm">
              <span class="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>Acción requerida</span>
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-on-primary/15 backdrop-blur-md text-label-sm">
              <span class="material-symbols-outlined text-[15px]">timer</span>10 min</span>
          </div>
          <div class="flex flex-col gap-1">
            <h2 class="text-headline-sm font-bold tracking-tight">Tu reporte diario de hoy está pendiente</h2>
            <p class="text-body-md text-on-primary-container/90 leading-relaxed">Registra tus actividades, avances y estado de tu equipo para cerrar la jornada con éxito.</p>
          </div>
          <a href="#/nuevo" class="inline-flex items-center justify-center w-full gap-2 py-3.5 px-5 rounded-lg bg-surface-container-lowest text-primary text-label-lg shadow-md hover:bg-surface-container active:scale-[0.98] transition-all">
            Llenar formulario de hoy<span class="material-symbols-outlined text-[20px]">arrow_forward</span></a>`}
        </div>
      </div>
      <div class="grid grid-cols-2 gap-space-md">
        <div class="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-lg bg-tertiary-fixed/60 flex items-center justify-center text-tertiary">
              <span class="material-symbols-outlined text-[22px]" style="font-variation-settings:'FILL' 1">local_fire_department</span></div>
            ${weekCount ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-semibold">+${weekCount} esta sem.</span>` : ''}
          </div>
          <div class="mt-space-md flex flex-col">
            <div class="flex items-baseline gap-1"><span class="text-headline-lg-mobile font-bold tracking-tight">${streak(dates)}</span><span class="text-label-md text-on-surface-variant font-medium">${streak(dates) === 1 ? 'día' : 'días'}</span></div>
            <span class="text-label-sm text-on-surface-variant mt-0.5">Racha actual activa</span>
          </div>
        </div>
        <div class="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[22px]" style="font-variation-settings:'FILL' 1">task_alt</span></div>
            <svg class="w-8 h-8 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
              <path class="text-surface-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5"></path>
              <path class="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="${monthPct}, 100" stroke-linecap="round" stroke-width="3.5"></path></svg>
          </div>
          <div class="mt-space-md flex flex-col">
            <span class="text-headline-lg-mobile font-bold tracking-tight">${monthPct}%</span>
            <span class="text-label-sm text-on-surface-variant mt-0.5">Cumplimiento del mes</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-space-sm p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
        <div class="flex items-center justify-between">
          <h3 class="text-label-lg flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[20px]">date_range</span>Resumen de la semana</h3>
          <span class="text-label-sm text-secondary font-semibold">${weekCount} / 7 completados</span>
        </div>
        <div class="grid grid-cols-7 gap-1.5 pt-space-xs">${week.map((d, i) => {
          const done = dates.includes(d), isToday = d === today;
          return `<div class="flex flex-col items-center gap-1.5 py-2 rounded-lg ${isToday ? 'bg-surface-container-highest' : 'bg-surface-container-low'} ${d > today ? (i > 4 ? 'opacity-40' : 'opacity-60') : ''}">
            <span class="text-label-sm ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant'}">${'LMMJVSD'[i]}</span>
            ${done ? '<div class="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center"><span class="material-symbols-outlined text-[16px] font-bold">check</span></div>'
            : isToday ? `<div class="relative w-6 h-6 flex items-center justify-center"><span class="absolute inline-flex h-full w-full rounded-full bg-tertiary-fixed-dim opacity-75 animate-ping"></span>
                <div class="relative w-5 h-5 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center"><span class="material-symbols-outlined text-[14px]">edit</span></div></div>`
            : '<div class="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center"><span class="w-1.5 h-1.5 rounded-full bg-outline-variant"></span></div>'}
          </div>`; }).join('')}</div>
      </div>
      ${last ? `
      <div class="flex flex-col gap-space-sm">
        <div class="flex items-center justify-between px-0.5">
          <span class="text-headline-sm">Actividad reciente</span>
          <a href="#/historial" class="text-label-sm text-primary font-bold hover:underline flex items-center gap-0.5">Ver historial completo<span class="material-symbols-outlined text-[16px]">chevron_right</span></a>
        </div>
        <div class="flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
          <div class="flex items-start justify-between gap-space-sm">
            <div class="flex items-start gap-space-sm">
              <div class="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container mt-0.5">
                <span class="material-symbols-outlined text-[20px]" style="font-variation-settings:'FILL' 1">assignment_turned_in</span></div>
              <div class="flex flex-col">
                <div class="flex items-center gap-2">
                  <h4 class="text-label-lg">${lastTitle}</h4>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm">Enviado</span>
                </div>
                <p class="text-body-sm text-on-surface-variant mt-0.5">${fdate(last.date, { weekday: 'long', day: 'numeric', month: 'long' })}${lastTime}</p>
              </div>
            </div>
            <a href="#/historial" aria-label="Ver detalles" class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"><span class="material-symbols-outlined text-[20px]">more_vert</span></a>
          </div>
          <div class="mt-space-md p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <span class="text-label-sm text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[15px] text-primary">folder_open</span>Material por cliente</span>
              <span class="text-label-sm font-semibold">${nCli} ${nCli === 1 ? 'cliente reportado' : 'clientes reportados'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-label-sm text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[15px] ${inc ? 'text-tertiary' : 'text-secondary'}">${inc ? 'warning' : 'check_circle'}</span>Incidencias del día</span>
              <span class="text-label-sm font-semibold ${inc ? 'text-tertiary' : 'text-secondary'}">${inc ? `${inc} ${inc === 1 ? 'incidencia' : 'incidencias'}` : 'Sin incidencias'}</span>
            </div>
          </div>
        </div>
      </div>` : ''}
      <div class="flex items-center gap-3 p-space-md rounded-xl bg-surface-container-high/60 lg:col-span-2">
        <div class="w-9 h-9 shrink-0 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary"><span class="material-symbols-outlined text-[20px]">lightbulb</span></div>
        <div class="flex flex-col">
          <span class="text-label-md">Tip de productividad</span>
          <span class="text-body-sm text-on-surface-variant">Llenar tu diario antes de las 18:00 mejora la precisión de tu equipo.</span>
        </div>
      </div>
    </div>`;
  },

  async nuevo() {
    const d = await api('/api/defaults'); rowN = 0;
    // Vehículo: solo los camiones registrados de la planta.
    const veh = questions.find(s => s.table?.id === 'vehiculos')?.table.cols.find(c => c.id === 'vehiculo');
    if (veh) veh.options = d.trucks.map(t => t.name);
    $('#app').innerHTML = `
    <p class="text-label-sm font-semibold text-primary">PL-FOR-26 · REV. 06</p>
    <h1 class="text-headline-lg-mobile tracking-tight">Reporte diario de operación</h1>
    <p class="text-body-md text-on-surface-variant mb-4">${fdate(ymd())}${me.plant ? ' · Planta ' + esc(me.plant) : ''}</p>
    ${Object.entries(d.lists).map(([k, xs]) => `<datalist id="dl-${k}">${xs.map(x => `<option value="${esc(x)}">`).join('')}</datalist>`).join('')}
    <form id="report" class="flex flex-col gap-4">
      ${questions.map(s => `
      <section class="card p-4 flex flex-col gap-3">
        <h2 class="text-label-lg text-primary">${s.n}. ${esc(s.title)}</h2>
        ${s.hint ? `<p class="text-body-sm text-on-surface-variant">${esc(s.hint)}</p>` : ''}
        ${s.table?.id === 'vehiculos' && !d.trucks.length ? '<p class="text-body-sm text-error">Tu planta no tiene camiones registrados. Pide al administrador que los agregue.</p>' : ''}
        ${s.fields ? `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          ${s.n === 1 && !me.plant ? labeled({ label: 'Planta', required: true, wide: true }, plantSelect('name="planta" required')) : ''}
          ${s.fields.filter(f => !f.after).map(f => labeled(f, input(f, f.id))).join('')}</div>` : ''}
        ${s.table ? `<div data-table="${s.table.id}" class="flex flex-col gap-2">${(s.table.fixed ? s.table.fixed.map(v => ({ [s.table.cols[0].id]: v }))
            : s.table.id === 'mantenimiento' ? d.pendientes : []).map(r => rowHtml(s.table, r)).join('')}</div>
          ${s.table.fixed ? '' : `<button type="button" data-add="${s.table.id}" class="btn border-[1.5px] border-[#cbd5e1] text-primary"><span class="material-symbols-outlined">add</span>Agregar ${esc(s.table.item)}</button>`}` : ''}
        ${s.table?.id === 'hornos' ? '<p data-total-hornos class="p-3 rounded-xl bg-surface-container-high/60 text-label-lg text-primary" aria-live="polite"></p>' : ''}
        ${(s.fields || []).filter(f => f.after).map(f => `<div class="grid grid-cols-2">${labeled(f, input(f, f.id))}</div>`).join('')}
      </section>`).join('')}
      <p id="err" class="text-sm text-error hidden" role="alert"></p>
      <button class="btn btn-primary w-full"><span class="material-symbols-outlined">send</span>Enviar reporte</button>
    </form>`;
    const form = $('#report');
    form.onclick = e => {
      const add = e.target.closest('[data-add]'), del = e.target.closest('[data-del]');
      if (add) form.querySelector(`[data-table="${add.dataset.add}"]`).insertAdjacentHTML('beforeend', rowHtml(questions.find(s => s.table?.id === add.dataset.add).table));
      if (del) del.closest('[data-row]').remove();
      totalHornos(); pendientes();
    };
    // Sección 5: total de hornos y de ciclos, en vivo.
    const totalHornos = () => {
      const rows = [...form.querySelectorAll('[data-table="hornos"] [data-row]')];
      form.querySelector('[data-total-hornos]').textContent = `Total de hornos: ${rows.length} · Total de ciclos: ${sum(rows.map(r => ({ c: r.querySelector('[name$=".ciclos"]').value })), 'c')}`;
    };
    // Sección 7: pendientes por procesar = pendientes anteriores (misma pieza) + piezas − procesado hoy. El servidor lo recalcula al guardar.
    const pendientes = () => form.querySelectorAll('[data-table="material"] [data-row]').forEach(r => {
      const v = id => r.querySelector(`[name$=".${id}"]`).value, prev = d.pend[`${v('cliente')}|${v('pieza')}`.trim().toLowerCase()] || 0;
      r.querySelector('[data-pend]').textContent = `Pendientes por procesar: ${prev + (Number(v('cantidad')) || 0) - (Number(v('procesado')) || 0)}`
        + (prev ? ` (incluye ${prev} de días anteriores)` : '');
    });
    form.oninput = () => { totalHornos(); pendientes(); };
    totalHornos();
    // Km inicial = km final de la última vez que se usó la unidad.
    form.onchange = e => {
      const n = e.target.name || '', ini = n.endsWith('.vehiculo') && form.elements[n.replace(/vehiculo$/, 'km_ini')];
      if (ini && !ini.value && d.km[e.target.value]) ini.value = d.km[e.target.value];
      // Sección 2: sin reportes de personal → "¿Cuántos?" = N/A; con reportes → obligatorio.
      if (n === 'hubo_reportes') {
        const c = form.elements.reportes_n, no = e.target.value === 'No';
        Object.assign(c, { disabled: no, required: e.target.value === 'Sí', placeholder: no ? 'N/A' : '' });
        if (no) c.value = '';
      }
      // Casillas N/A (gas): desactivan los campos de su lista "disables"; se recalcula todo el renglón.
      const row = e.target.closest('[data-row]'), t = questions.find(s => s.table?.id === n.split('.')[0])?.table;
      if (e.target.type === 'checkbox' && row && t?.cols.some(c => c.disables)) {
        const el = id => row.querySelector(`[name$=".${id}"]`);
        row.querySelectorAll('input').forEach(x => x.disabled = false);
        for (const c of t.cols) if (c.disables && el(c.id).checked) c.disables.forEach(d => {
          const x = el(d); x.disabled = true; x.type === 'checkbox' ? (x.checked = false) : (x.value = '');
        });
      }
    };
    form.onsubmit = async e => {
      e.preventDefault();
      const btn = e.target.querySelector('button[class*=btn-primary]');
      btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span>Analizando con IA…';
      const answers = {};
      for (const [k, v] of new FormData(form)) {
        const [id, i, col] = k.split('.');
        if (col) ((answers[id] ??= {})[i] ??= {})[col] = v;
        else answers[id] = id in answers ? [].concat(answers[id], v) : v; // casillas: varios valores
      }
      for (const s of questions) if (s.table) answers[s.table.id] = Object.values(answers[s.table.id] || {});
      try {
        const r = await api('/api/reports', { answers });
        me = await api('/api/me');
        $('#app').innerHTML = `
        <div class="flex flex-col items-center text-center gap-3 pt-6">
          <div class="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <span class="material-symbols-outlined text-[36px]">task_alt</span></div>
          <h1 class="text-2xl font-bold">¡Reporte enviado!</h1>
          ${r.score != null ? `<p class="text-sm text-on-surface-variant">Calidad de tu reporte</p><p class="text-5xl font-bold text-primary">${r.score}</p>${qChip(r.score)}`
            : '<p class="text-sm text-on-surface-variant">Tu reporte se guardó; la evaluación de calidad no estuvo disponible.</p>'}
          ${r.feedback ? `<div class="card p-4 text-left w-full mt-2"><p class="text-xs font-semibold text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">lightbulb</span>Cómo mejorar</p><p class="text-sm mt-1">${esc(r.feedback)}</p></div>` : ''}
          <a href="#/inicio" class="btn btn-primary w-full mt-2">Volver al inicio</a>
        </div>`;
      } catch (err) {
        $('#err').textContent = err.message; $('#err').classList.remove('hidden');
        btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined">send</span>Enviar reporte';
      }
    };
  },

  async historial() {
    reports = await api('/api/reports');
    $('#app').innerHTML = `
    <p class="text-xs font-semibold text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">shield</span>MIS REPORTES</p>
    <h1 class="text-2xl font-semibold tracking-tight mb-4">Historial</h1>
    <div class="grid gap-3 lg:grid-cols-2 lg:items-start">${reports.length ? reports.map(r => reportCard(r)).join('') : '<p class="text-on-surface-variant text-sm">Aún no tienes reportes.</p>'}</div>`;
  },

  async admin() {
    let users;
    [reports, users] = await Promise.all([api('/api/reports'), api('/api/users')]);
    users = users.filter(u => u.role === 'colaborador' && u.status === 'activo');
    const today = reports.filter(r => r.date === ymd());
    const week = reports.filter(r => r.date >= daysAgo(6));
    const team = users.map(u => {
      const mine = week.filter(r => r.user_id === u.id);
      return { ...u, today: today.some(r => r.user_id === u.id), count: mine.length, score: avg(mine.map(r => r.score)) };
    });
    $('#app').innerHTML = `
    <h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Reportes del equipo</h1>
    <p class="text-sm text-on-surface-variant">${fdate(ymd())}</p>
    <div class="grid ${WIDE ? 'grid-cols-4' : 'grid-cols-3'} gap-3 my-4">
      ${[['Reportaron hoy', `${today.length}/${users.length}`, 'today'], ['Reportes 7 días', week.length, 'date_range'],
         ['Calidad prom. semana', avg(week.map(r => r.score)) ?? '—', 'grade'],
         ...(WIDE ? [['Incidencias 7 días', week.reduce((t, r) => t + nInc(r), 0), 'warning']] : [])]
        .map(([l, v, i]) => `<div class="card ${WIDE ? 'p-5' : 'p-3'}"><span class="material-symbols-outlined text-primary">${i}</span><p class="text-2xl font-bold mt-1">${v}</p><p class="text-[11px] text-on-surface-variant">${l}</p></div>`).join('')}
    </div>
    <div class="${WIDE ? 'grid grid-cols-[minmax(0,1fr)_360px] gap-6 items-start' : 'flex flex-col gap-4'}">
      <div>
        <input id="filter" class="input mb-3" placeholder="Buscar por colaborador, fecha o contenido…">
        <div id="list" class="flex flex-col gap-3"></div>
      </div>
      <div class="card p-4 ${WIDE ? 'sticky top-6' : 'order-first'}">
        <h3 class="font-semibold flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-primary">groups</span>Equipo · últimos 7 días</h3>
        ${team.length ? `<table class="w-full text-sm">
          <thead><tr class="text-left text-[11px] uppercase tracking-wide text-on-surface-variant"><th class="py-2 font-semibold">Colaborador</th><th class="font-semibold">Hoy</th><th class="font-semibold text-center">7d</th><th class="font-semibold text-right">Calidad</th></tr></thead>
          <tbody>${team.map(u => `<tr class="border-t border-[#f1f5f9]">
            <td class="py-2 pr-2"><p class="font-medium">${esc(u.name)}</p><p class="text-[11px] text-on-surface-variant">${esc(u.plant || 'Sin planta')} · ${esc(u.email)}</p></td>
            <td>${u.today ? '<span class="material-symbols-outlined text-secondary" title="Reportó hoy">check_circle</span>' : '<span class="chip bg-tertiary-fixed text-on-tertiary-fixed">Pendiente</span>'}</td>
            <td class="text-center">${u.count}</td>
            <td class="text-right font-semibold">${u.score ?? '—'}</td></tr>`).join('')}</tbody></table>`
          : '<p class="text-sm text-on-surface-variant">Aún no hay colaboradores registrados.</p>'}
      </div>
    </div>`;
    const draw = (f = '') => {
      const list = reports.filter(r => JSON.stringify(r).toLowerCase().includes(f.toLowerCase()));
      $('#list').innerHTML = list.length ? list.map(r => reportCard(r, true)).join('') : '<p class="text-on-surface-variant text-sm">Sin reportes.</p>';
    };
    $('#filter').oninput = e => draw(e.target.value);
    draw();
  },

  async semanal() {
    const [list, all] = await Promise.all([api('/api/weekly'), api('/api/reports')]);
    const wk = all.filter(r => r.date >= daysAgo(6)), latest = {};
    for (const r of all) latest[r.plant] ??= r; // vienen del más reciente al más viejo
    const open = Object.values(latest).reduce((t, r) => t + (r.answers.mantenimiento || []).filter(m => m.estatus !== 'Cerrado').length, 0);
    $('#app').innerHTML = `
    <div class="${WIDE ? 'max-w-3xl' : ''}">
    <h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Resumen semanal</h1>
    <p class="text-sm text-on-surface-variant mb-4">Totales de los PL-FOR-26 de los últimos 7 días y resumen generado con IA. Solo visible para el administrador.</p>
    <div class="grid grid-cols-2 ${WIDE ? 'md:grid-cols-4' : ''} gap-3 mb-4">
      ${[['Gastos', money(wk.reduce((t, r) => t + sum(r.answers.gastos, 'importe'), 0)), 'payments'],
         ['Cargas de gas', money(wk.reduce((t, r) => t + sum(r.answers.gas, 'importe'), 0)), 'local_gas_station'],
         ['Incidencias', wk.reduce((t, r) => t + nInc(r), 0), 'warning'], ['Mantenimiento abierto', open, 'build']]
        .map(([l, v, i]) => `<div class="card p-4"><span class="material-symbols-outlined text-primary">${i}</span><p class="text-xl font-bold mt-1">${v}</p><p class="text-[11px] text-on-surface-variant">${l}</p></div>`).join('')}
    </div>
    <button id="gen" class="btn btn-primary ${WIDE ? '' : 'w-full'}"><span class="material-symbols-outlined">auto_awesome</span>Generar resumen de esta semana</button>
    <p id="err" class="text-sm text-error hidden mt-2" role="alert"></p>
    <div class="flex flex-col gap-3 mt-4">${list.map((w, i) => `
      <details class="card p-4" ${i === 0 ? 'open' : ''}>
        <summary class="flex items-center justify-between font-semibold">
          <span>${fdate(w.start, { day: 'numeric', month: 'short' })} – ${fdate(w.end, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span class="material-symbols-outlined text-on-surface-variant">expand_more</span></summary>
        <p class="text-sm whitespace-pre-wrap mt-3 leading-relaxed">${esc(w.text)}</p>
      </details>`).join('') || '<p class="text-on-surface-variant text-sm">Aún no hay resúmenes semanales.</p>'}</div>
    </div>`;
    $('#gen').onclick = async e => {
      const btn = e.currentTarget; btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span>Generando…';
      try { await api('/api/weekly', {}); views.semanal(); }
      catch (err) { $('#err').textContent = err.message; $('#err').classList.remove('hidden'); btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span>Generar resumen de esta semana'; }
    };
  },

  // Aprobar/rechazar solicitudes de registro y crear cuentas (solo admin).
  async cuentas() {
    const users = await api('/api/users'), pend = users.filter(u => u.status === 'pendiente'), act = users.filter(u => u.status !== 'pendiente');
    $('#app').innerHTML = `
    <div class="${WIDE ? 'max-w-3xl' : ''} flex flex-col gap-4">
      <div><h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Cuentas</h1>
        <p class="text-sm text-on-surface-variant">Aprueba las solicitudes nuevas o crea cuentas para tu equipo.</p></div>
      <p id="err" class="text-sm text-error hidden" role="alert"></p>
      <section id="pend" class="card p-4 flex flex-col gap-3">
        <h2 class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-tertiary">pending</span>Solicitudes pendientes (${pend.length})</h2>
        ${pend.length ? pend.map(u => `
        <div data-id="${u.id}" class="flex flex-col gap-2 p-3 rounded-xl bg-surface-container-low">
          <div><p class="font-medium">${esc(u.name)}</p><p class="text-xs text-on-surface-variant">${esc(u.email)}</p></div>
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex-1 min-w-[160px]">${plantSelect(`data-plant aria-label="Planta de ${esc(u.name)}"`, u.plant)}</div>
            <button data-approve class="btn btn-primary"><span class="material-symbols-outlined">check</span>Aprobar</button>
            <button data-reject class="btn border-[1.5px] border-[#cbd5e1] text-error"><span class="material-symbols-outlined">close</span>Rechazar</button>
          </div></div>`).join('') : '<p class="text-sm text-on-surface-variant">No hay solicitudes pendientes.</p>'}
      </section>
      <form id="nueva" class="card p-4 grid grid-cols-2 gap-3">
        <h2 class="col-span-2 font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-primary">person_add</span>Crear cuenta</h2>
        ${labeled({ label: 'Nombre completo', required: true, wide: true }, '<input class="input" name="name" required autocomplete="off">')}
        ${labeled({ label: 'Correo', required: true, wide: true }, '<input class="input" name="email" type="email" required autocomplete="off">')}
        ${labeled({ label: 'Contraseña inicial', required: true, wide: true }, '<input class="input" name="password" type="text" required minlength="8" autocomplete="off">')}
        ${labeled({ label: 'Planta (obligatoria para encargado)' }, plantSelect('name="plant"'))}
        ${labeled({ label: 'Rol' }, '<select class="input" name="role"><option value="colaborador">Encargado</option><option value="admin">Admin</option></select>')}
        <button class="btn btn-primary col-span-2"><span class="material-symbols-outlined">person_add</span>Crear cuenta</button>
      </form>
      <section id="act" class="card p-4">
        <h2 class="font-semibold flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-primary">group</span>Cuentas activas (${act.length})</h2>
        ${act.length ? `<table class="w-full text-sm"><tbody>${act.map(u => `<tr class="border-t border-[#f1f5f9]">
          <td class="py-2 pr-2"><p class="font-medium">${esc(u.name)}</p><p class="text-[11px] text-on-surface-variant">${esc(u.email)}</p></td>
          <td class="pr-2">${esc(u.plant || '—')}</td><td class="pr-2"><select data-role-user="${u.id}" class="input !py-2 !px-3 w-auto" aria-label="Rol de ${esc(u.name)}">
            ${[['colaborador', 'Encargado'], ['admin', 'Admin']].map(([v, l]) => `<option value="${v}" ${u.role === v ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
          <td class="text-right"><button data-del-user="${u.id}" class="text-label-sm text-error font-semibold inline-flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-error-container whitespace-nowrap" aria-label="Eliminar a ${esc(u.name)}"><span class="material-symbols-outlined text-[18px]">delete</span>Eliminar</button></td></tr>`).join('')}</tbody></table>`
          : '<p class="text-sm text-on-surface-variant">Aún no hay otras cuentas.</p>'}
      </section>
    </div>`;
    const fail = err => { $('#err').textContent = err.message; $('#err').classList.remove('hidden'); };
    $('#pend').onclick = async e => {
      const btn = e.target.closest('[data-approve],[data-reject]'), row = btn?.closest('[data-id]');
      if (!row) return;
      btn.disabled = true;
      try { await api(`/api/users/${btn.matches('[data-approve]') ? 'approve' : 'reject'}`, { id: row.dataset.id, plant: row.querySelector('[data-plant]').value }); views.cuentas(); }
      catch (err) { fail(err); btn.disabled = false; }
    };
    // Doble clic para confirmar (sin diálogo del navegador).
    $('#act').onclick = async e => {
      const btn = e.target.closest('[data-del-user]');
      if (!btn) return;
      if (!confirmed(btn)) return;
      btn.disabled = true;
      try { await api('/api/users/delete', { id: btn.dataset.delUser }); views.cuentas(); } catch (err) { fail(err); btn.disabled = false; }
    };
    $('#act').onchange = async e => {
      const sel = e.target.closest('[data-role-user]');
      if (!sel) return;
      sel.disabled = true;
      try { await api('/api/users/role', { id: sel.dataset.roleUser, role: sel.value }); views.cuentas(); } catch (err) { fail(err); sel.disabled = false; }
    };
    $('#nueva').onsubmit = async e => {
      e.preventDefault();
      try { await api('/api/users', Object.fromEntries(new FormData(e.target))); views.cuentas(); } catch (err) { fail(err); }
    };
  },

  // Camiones de cada planta (solo admin). El encargado solo puede reportar los de su planta.
  async camiones() {
    const trucks = await api('/api/trucks');
    $('#app').innerHTML = `
    <div class="${WIDE ? 'max-w-4xl' : ''} flex flex-col gap-4">
      <div><h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Camiones</h1>
        <p class="text-sm text-on-surface-variant">Las unidades de cada planta. En la sección 3 el encargado solo puede elegir las de su planta.</p></div>
      <p id="err" class="text-sm text-error hidden" role="alert"></p>
      <form id="nuevo-camion" class="card p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <h2 class="col-span-2 lg:col-span-4 font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-primary">add_circle</span>Agregar camión</h2>
        ${labeled({ label: 'Nombre o placas', required: true, wide: true }, '<input class="input" name="name" required maxlength="60" placeholder="Ej. Nissan NP300 · GTO-123">')}
        ${labeled({ label: 'Planta', required: true }, plantSelect('name="plant" required'))}
        ${labeled({ label: 'Tipo' }, '<select class="input" name="horometro"><option value="">Vehículo (km)</option><option value="1">Montacargas (horómetro)</option></select>')}
        <button class="btn btn-primary col-span-2 lg:col-span-4"><span class="material-symbols-outlined">add</span>Agregar</button>
      </form>
      <div id="lista" class="grid gap-4 lg:grid-cols-2 lg:items-start">${PLANTS.map(p => { const ts = trucks.filter(t => t.plant === p); return `
        <section class="card p-4">
          <h2 class="font-semibold flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-primary">factory</span>${p} (${ts.length})</h2>
          ${ts.length ? ts.map(t => `<div class="flex items-center justify-between gap-2 py-2 border-t border-[#f1f5f9]">
            <div class="min-w-0"><p class="font-medium truncate">${esc(t.name)}</p><p class="text-[11px] text-on-surface-variant">${t.horometro ? 'Montacargas · horómetro' : 'Vehículo · km'}</p></div>
            <button data-del-truck="${t.id}" class="text-label-sm text-error font-semibold inline-flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-error-container whitespace-nowrap" aria-label="Eliminar ${esc(t.name)}"><span class="material-symbols-outlined text-[18px]">delete</span>Eliminar</button>
          </div>`).join('') : '<p class="text-sm text-on-surface-variant">Sin camiones registrados.</p>'}
        </section>`; }).join('')}</div>
    </div>`;
    $('#nuevo-camion').onsubmit = async e => {
      e.preventDefault();
      try { await api('/api/trucks', Object.fromEntries(new FormData(e.target))); views.camiones(); } catch (err) { showErr(err); }
    };
    $('#lista').onclick = async e => {
      const btn = e.target.closest('[data-del-truck]');
      if (!btn || !confirmed(btn)) return;
      btn.disabled = true;
      try { await api('/api/trucks/delete', { id: btn.dataset.delTruck }); views.camiones(); } catch (err) { showErr(err); btn.disabled = false; }
    };
  },

  // Personalizar el formulario (solo admin): a mano o con una propuesta de la IA que el admin aplica o descarta.
  async formulario() {
    const { base, config, protected: prot } = await api('/api/form-config'), P = new Set(prot);
    const keys = s => [...(s.fields || []).map(f => [f.id, f]), ...(s.table ? s.table.cols.map(c => [`${s.table.id}.${c.id}`, c]) : [])];
    const TYPES = { text: 'Texto', textarea: 'Texto largo', number: 'Número', sino: 'Sí / No', select: 'Lista de opciones', date: 'Fecha', time: 'Hora' };
    const extraRow = (x = {}) => `
      <div data-extra class="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3 rounded-xl bg-surface-container-low items-end">
        <input type="hidden" name="id" value="${esc(x.id || '')}">
        ${labeled({ label: 'Pregunta nueva', required: true, wide: true }, `<input class="input" name="label" value="${esc(x.label || '')}" required maxlength="120">`)}
        ${labeled({ label: 'Tipo' }, `<select class="input" name="type">${Object.entries(TYPES).map(([v, l]) => `<option value="${v}" ${x.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
        ${labeled({ label: 'Obligatoria', type: 'check' }, `<input type="checkbox" name="required" ${x.required ? 'checked' : ''} class="w-6 h-6 accent-[#2563eb]">`)}
        ${labeled({ label: 'Opciones (solo para "Lista de opciones", separadas por coma)', wide: true }, `<input class="input" name="options" value="${esc((x.options || []).join(', '))}">`)}
        <button type="button" data-del-extra class="col-span-2 justify-self-end text-label-sm text-error flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">delete</span>Quitar</button>
      </div>`;
    // Lista legible de lo que cambia entre dos configuraciones (para revisar la propuesta de la IA).
    const diff = (a, b) => base.flatMap(s => {
      const out = [], x = a.sections[s.n] || {}, y = b.sections[s.n] || {}, ea = a.extra[s.n] || [], eb = b.extra[s.n] || [];
      if ((x.title || '') !== (y.title || '')) out.push(`Sección ${s.n}: el título será "${y.title || s.title}"`);
      if (!!x.hidden !== !!y.hidden) out.push(`Sección ${s.n} (${s.title}): ${y.hidden ? 'se oculta' : 'se vuelve a mostrar'}`);
      for (const [k, f] of keys(s)) {
        const p = a.fields[k] || {}, q = b.fields[k] || {};
        if ((p.label || '') !== (q.label || '')) out.push(`Sección ${s.n}: "${p.label || f.label}" → "${q.label || f.label}"`);
        if (!!p.hidden !== !!q.hidden) out.push(`Sección ${s.n}: "${f.label}" ${q.hidden ? 'se oculta' : 'se vuelve a mostrar'}`);
      }
      for (const e of eb) { const o = ea.find(z => z.id === e.id);
        if (!o) out.push(`Sección ${s.n}: nueva pregunta "${e.label}" (${TYPES[e.type]}${e.required ? ', obligatoria' : ''})`);
        else if (JSON.stringify(o) !== JSON.stringify(e)) out.push(`Sección ${s.n}: cambia la pregunta "${e.label}"`); }
      for (const e of ea) if (!eb.some(z => z.id === e.id)) out.push(`Sección ${s.n}: se quita la pregunta "${e.label}"`);
      return out;
    });
    const save = async c => { await api('/api/form-config', { config: c }); questions = await api('/api/questions'); views.formulario(); };
    $('#app').innerHTML = `
    <div class="${WIDE ? 'max-w-4xl' : ''} flex flex-col gap-4">
      <div><h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Formulario</h1>
        <p class="text-sm text-on-surface-variant">Personaliza el PL-FOR-26 para las dos plantas. Las preguntas con <span class="material-symbols-outlined text-[14px] align-middle">lock</span> las usan los cálculos automáticos: se pueden renombrar pero no ocultar.</p></div>
      <p id="err" class="text-sm text-error hidden" role="alert"></p>
      <section class="card p-4 flex flex-col gap-3">
        <h2 class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-primary">auto_awesome</span>Modificar con IA</h2>
        <textarea id="ai-txt" class="input" rows="2" maxlength="1000" aria-label="Cambio que quieres hacer" placeholder='Ej. "Agrega en la sección 5 una pregunta de temperatura del horno (número) y oculta el folio de material"'></textarea>
        <button id="ai-go" class="btn btn-primary ${WIDE ? 'self-start' : ''}"><span class="material-symbols-outlined">auto_awesome</span>Proponer cambios</button>
        <div id="ai-out"></div>
      </section>
      <form id="cfg" class="flex flex-col gap-4">
        ${base.map(s => { const sc = config.sections[s.n] || {}; return `
        <section data-sec="${s.n}" class="card p-4 flex flex-col gap-3">
          <div class="flex flex-wrap items-end gap-3">
            <label class="flex-1 min-w-[200px] flex flex-col gap-1 text-label-md text-on-surface-variant"><span>Sección ${s.n} — título</span>
              <input class="input" name="stitle" value="${esc(sc.title || '')}" placeholder="${esc(s.title)}"></label>
            ${s.n === 1 ? '' : `<label class="flex items-center gap-2 h-12 text-label-md"><input type="checkbox" name="shidden" ${sc.hidden ? 'checked' : ''} class="w-5 h-5 accent-[#2563eb]">Ocultar sección</label>`}
          </div>
          <details><summary class="text-label-lg text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">expand_more</span>Preguntas del formato (${keys(s).length})</summary>
            <div class="flex flex-col gap-2 mt-2">${keys(s).map(([k, f]) => { const fc = config.fields[k] || {}, locked = P.has(k) || f.required || f.auto; return `
              <div data-field="${k}" class="flex flex-wrap items-center gap-2">
                <input class="input flex-1 min-w-[200px]" name="label" value="${esc(fc.label || '')}" placeholder="${esc(f.label)}" aria-label="Nuevo texto para ${esc(f.label)}">
                ${locked ? '<span class="text-label-sm text-on-surface-variant flex items-center gap-1 w-24" title="La usan los cálculos automáticos"><span class="material-symbols-outlined text-[16px]">lock</span>Protegida</span>'
                  : `<label class="flex items-center gap-2 text-label-md w-24"><input type="checkbox" name="hidden" ${fc.hidden ? 'checked' : ''} class="w-5 h-5 accent-[#2563eb]">Ocultar</label>`}
              </div>`; }).join('')}</div></details>
          <div data-extras class="flex flex-col gap-2">${(config.extra[s.n] || []).map(extraRow).join('')}</div>
          <button type="button" data-add-extra class="btn border-[1.5px] border-[#cbd5e1] text-primary ${WIDE ? 'self-start' : ''}"><span class="material-symbols-outlined">add</span>Agregar pregunta</button>
        </section>`; }).join('')}
        <button class="btn btn-primary sticky bottom-24 lg:bottom-4 shadow-lg"><span class="material-symbols-outlined">save</span>Guardar cambios</button>
      </form>
    </div>`;
    const form = $('#cfg');
    // Lee la configuración tal como está en pantalla.
    const read = () => {
      const c = { sections: {}, fields: {}, extra: {} };
      for (const sec of form.querySelectorAll('[data-sec]')) {
        const n = sec.dataset.sec;
        c.sections[n] = { title: sec.querySelector('[name=stitle]').value, hidden: !!sec.querySelector('[name=shidden]')?.checked };
        for (const f of sec.querySelectorAll('[data-field]')) c.fields[f.dataset.field] = { label: f.querySelector('[name=label]').value, hidden: !!f.querySelector('[name=hidden]')?.checked };
        c.extra[n] = [...sec.querySelectorAll('[data-extra]')].map(x => { const v = k => x.querySelector(`[name=${k}]`);
          return { id: v('id').value, label: v('label').value, type: v('type').value, required: v('required').checked,
            options: v('options').value.split(',').map(o => o.trim()).filter(Boolean) }; });
      }
      return c;
    };
    form.onclick = e => {
      const add = e.target.closest('[data-add-extra]'), del = e.target.closest('[data-del-extra]');
      if (add) add.previousElementSibling.insertAdjacentHTML('beforeend', extraRow());
      if (del) del.closest('[data-extra]').remove();
    };
    form.onsubmit = async e => {
      e.preventDefault();
      const c = read(), bad = Object.values(c.extra).flat().find(x => x.type === 'select' && !x.options.length);
      if (bad) return showErr(new Error(`La pregunta "${bad.label}" es una lista: escribe sus opciones separadas por coma`));
      const btn = form.querySelector('.btn-primary'); btn.disabled = true;
      try { await save(c); } catch (err) { showErr(err); btn.disabled = false; }
    };
    $('#ai-go').onclick = async e => {
      const btn = e.currentTarget, out = $('#ai-out'), instruction = $('#ai-txt').value.trim();
      if (!instruction) return showErr(new Error('Escribe qué quieres cambiar'));
      btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span>Pensando…';
      try {
        const p = await api('/api/form-config/ai', { instruction }), changes = diff(config, p.config);
        out.innerHTML = `<div class="p-3 rounded-xl bg-surface-container-low flex flex-col gap-2">
          <p class="text-label-lg">Propuesta de la IA</p>
          ${p.resumen ? `<p class="text-sm">${esc(p.resumen)}</p>` : ''}
          ${changes.length ? `<ul class="list-disc pl-5 text-sm">${changes.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : '<p class="text-sm text-on-surface-variant">La IA no propuso cambios.</p>'}
          <div class="flex gap-2">${changes.length ? '<button id="ai-apply" class="btn btn-primary"><span class="material-symbols-outlined">check</span>Aplicar</button>' : ''}
            <button id="ai-discard" class="btn border-[1.5px] border-[#cbd5e1]">Descartar</button></div></div>`;
        $('#ai-discard').onclick = () => { out.innerHTML = ''; };
        if (changes.length) $('#ai-apply').onclick = async () => { try { await save(p.config); } catch (err) { showErr(err); } };
      } catch (err) { showErr(err); }
      btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span>Proponer cambios';
    };
  },

  async pl(id) {
    reports = await api('/api/reports');
    const r = reports.find(x => x.id === Number(id));
    if (!r) throw new Error('Reporte no encontrado');
    $('#app').innerHTML = `
    <div class="no-print flex items-center justify-between mb-4">
      <a href="#/admin" class="text-primary font-semibold flex items-center gap-1"><span class="material-symbols-outlined">arrow_back</span>Reportes</a>
      <button onclick="print()" class="btn btn-primary"><span class="material-symbols-outlined">print</span>Imprimir</button>
    </div>
    ${plDoc(r)}`;
  },
};

// El encargado ve calidad + retroalimentación; el admin ve además resumen IA y el PL-FOR-26 completo.
function reportCard(r, admin = false) {
  const inc = nInc(r), blocked = inc > 0;
  return `
  <details class="card p-4">
    <summary class="flex items-start gap-3">
      <div class="w-10 h-10 shrink-0 rounded-lg ${blocked ? 'bg-tertiary-fixed text-tertiary' : 'bg-secondary-container text-on-secondary-container'} flex items-center justify-center">
        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">${blocked ? 'warning' : 'assignment_turned_in'}</span></div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold">${admin ? esc(r.name) : fdate(r.date)}</p>
        <div class="flex flex-wrap items-center gap-2 mt-1">${qChip(r.score)}<span class="text-xs text-on-surface-variant">${admin ? fdate(r.date) + ' · ' : ''}${esc(r.plant || '')}${r.answers.turno ? ' · ' + esc(r.answers.turno) : ''}${inc ? ` · ${inc} ${inc === 1 ? 'incidencia' : 'incidencias'}` : ''}</span></div>
        ${admin && r.summary && WIDE ? `<p class="text-sm text-on-surface-variant mt-2 line-clamp-2">${esc(r.summary)}</p>` : ''}
      </div>
      <span class="material-symbols-outlined text-on-surface-variant">expand_more</span>
    </summary>
    ${admin && r.summary ? `<div class="mt-3 p-3 rounded-lg bg-surface-container-low"><p class="text-xs font-semibold text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">auto_awesome</span>Resumen IA</p><p class="text-sm mt-1">${esc(r.summary)}</p></div>` : ''}
    ${r.feedback ? `<div class="mt-3 p-3 rounded-lg bg-surface-container-low"><p class="text-xs font-semibold text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">lightbulb</span>Retroalimentación</p><p class="text-sm mt-1">${esc(r.feedback)}</p></div>` : ''}
    ${admin ? `<a href="#/pl/${r.id}" class="btn btn-primary w-full mt-3"><span class="material-symbols-outlined">description</span>Ver PL-FOR-26</a>` : ''}
  </details>`;
}

// ---------- Navegación ----------
const NAV = {
  colaborador: [['inicio', 'dashboard', 'Inicio'], ['nuevo', 'add_task', ''], ['historial', 'history', 'Historial']],
  admin: [['admin', 'groups', 'Reportes'], ['semanal', 'auto_awesome', 'Semanal'], ['cuentas', 'manage_accounts', 'Cuentas'],
    ['camiones', 'local_shipping', 'Camiones'], ['formulario', 'edit_note', 'Formulario']],
};
function renderNav(name) {
  const items = NAV[me.role];
  // Computadora: menú lateral (panel admin y app en pantalla grande). Teléfono: barra inferior con botón central.
  $('#nav').innerHTML = WIDE ? `<div class="flex flex-col h-full">
    <div class="flex items-center gap-2 px-2 mb-8">${logo(30)}<div class="flex flex-col items-start gap-1"><span class="text-lg font-semibold tracking-tight leading-tight">Reporte Diario Polar</span><span class="chip bg-surface-container-high text-primary">${me.role === 'admin' ? 'Admin' : 'Encargado'}</span></div></div>
    <div class="flex flex-col gap-1">${items.map(([p, icon, label]) => `
      <a href="#/${p}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl ${p === name ? 'bg-surface-container-high text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}">
        <span class="material-symbols-outlined">${icon}</span>${{ Semanal: 'Resumen semanal', '': 'Nuevo reporte' }[label] ?? label}</a>`).join('')}</div>
    <div class="mt-auto flex items-center justify-between gap-2 px-2 pt-4 border-t border-[#f1f5f9]">
      <div class="min-w-0"><p class="text-sm font-semibold truncate">${esc(me.name)}</p><p class="text-xs text-on-surface-variant truncate">${esc(me.email)}</p></div>
      <button data-logout class="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high" aria-label="Cerrar sesión" title="Cerrar sesión"><span class="material-symbols-outlined">logout</span></button>
    </div></div>`
  : `<div class="flex items-center justify-around h-20 px-4">${items.map(([p, icon, label]) => !label
    ? `<a href="#/${p}" class="relative -top-3 flex items-center justify-center w-14 h-14 rounded-full bg-primary-container text-white shadow-[0_8px_16px_rgba(37,99,235,0.35)]" aria-label="Nuevo reporte"><span class="material-symbols-outlined text-[28px]">${icon}</span></a>`
    : `<a href="#/${p}" class="flex flex-col items-center gap-1 flex-1 min-w-0 ${p === name ? 'text-primary font-semibold' : 'text-on-surface-variant'}"><span class="material-symbols-outlined">${icon}</span><span class="text-[11px]">${label}</span></a>`).join('')}</div>`;
}

async function route() {
  const [name, arg] = location.hash.slice(2).split('/');
  if (!me) return views.login();
  if (WEB && me.role !== 'admin') return views.soloAdmin();
  const allowed = [...NAV[me.role].map(n => n[0]), ...(me.role === 'admin' ? ['pl'] : [])]; // pl/ID: PL-FOR-26, solo admin
  if (!allowed.includes(name)) return location.hash = '#/' + allowed[0];
  renderNav(name === 'pl' ? 'admin' : name);
  try { await views[name](arg); } catch (e) { $('#app').innerHTML = `<p class="text-error text-sm">${esc(e.message)}</p>`; }
  scrollTo(0, 0);
}
async function boot() {
  questions = await api('/api/questions');
  me = await api('/api/me').catch(() => null);
  const showChrome = me && (!WEB || me.role === 'admin');
  document.querySelectorAll('[data-chrome]').forEach(el => el.classList.toggle('hidden', !showChrome));
  document.body.classList.toggle('chrome', !!showChrome);
  if (me && $('#role-chip')) $('#role-chip').textContent = me.role === 'admin' ? 'Admin' : 'Encargado';
  route();
}
async function logout() { await api('/api/logout', {}).catch(() => {}); me = null; history.replaceState(null, '', location.pathname); boot(); }

addEventListener('DOMContentLoaded', () => {
  addEventListener('hashchange', route);
  // Si la ventana cruza el tamaño de computadora, solo se cambia el menú: redibujar la vista borraría un formulario a medio llenar.
  DESK.addEventListener('change', e => {
    WIDE = WEB || e.matches;
    const name = location.hash.slice(2).split('/')[0];
    if (me && !(WEB && me.role !== 'admin')) renderNav(name === 'pl' ? 'admin' : name);
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-logout]')) logout(); });
  boot();
});
