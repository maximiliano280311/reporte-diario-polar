# Reporte Diario Polar

Reporte diario de operación e incidencias (formato **PL-FOR-26**) para las plantas Querétaro y Silao.

- **Producción:** https://reporte-diario-polar.maxelpiloto3.workers.dev — panel de admin en `/admin`
- Corre en Cloudflare Workers + D1. El contexto completo del proyecto está en [CLAUDE.md](CLAUDE.md).

## Trabajar en otra compu

Requisitos: [Node.js 24+](https://nodejs.org) y git.

```bash
git clone https://github.com/maximiliano280311/reporte-diario-polar.git
cd reporte-diario-polar
cp .env.example .env          # y pon tu AI_API_KEY en .env
```

### Probar en tu compu (base local, datos de prueba)
```bash
node server.mjs               # app: http://localhost:3000   admin: http://localhost:3001
```
Crea `data.db` vacía al arrancar. Regístrate con el correo de `ADMIN_EMAIL` para entrar como admin.

### Publicar cambios en Cloudflare
```bash
npx wrangler login            # una vez por compu
npx wrangler dev --local      # opcional: probar con el motor de Cloudflare
npx wrangler deploy           # publica en la URL de producción
```
Si cambias tablas, aplica el cambio también a D1:
`npx wrangler d1 execute reporte-diario-polar --remote --command "ALTER TABLE ..."`

### Copia de los datos de producción
```bash
npx wrangler d1 export reporte-diario-polar --remote --output respaldo.sql
```
(No subas respaldos ni `data.db` al repositorio: tienen contraseñas cifradas y datos reales.)
