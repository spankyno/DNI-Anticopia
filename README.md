# DNI Anticopia

Protege tu DNI, pasaporte y documentos con marcas de agua onduladas anti-IA y censura de datos
sensibles. Todo el procesamiento se ejecuta en tu navegador.

Autor: [Aitor Sánchez Gutiérrez](https://aitorsanchez.pages.dev)

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # genera ./dist
npm run lint     # comprobación de tipos
npm run audit:prod
```

`npm run icons` regenera los iconos PWA de `public/` (requiere Node 22.18+ o 24).

## Despliegue

Cloudflare Workers con assets estáticos (`wrangler.json`, directorio `./dist`).
Mantén `package.json` y `package-lock.json` sincronizados: el despliegue usa `npm ci`.

## Seguridad

- Cabeceras HTTP en `public/_headers` (HSTS, `X-Frame-Options`, COOP, `Permissions-Policy`, caché).
- La CSP se despliega en modo informe (`Content-Security-Policy-Report-Only`): no bloquea nada y
  solo avisa en la consola del navegador. Si tras navegar por toda la app (editor, bóveda, cámara,
  exportaciones, «Acerca de») no aparece ningún aviso `[Report Only] Refused to…`, renombra la
  cabecera a `Content-Security-Policy` para que pase a bloquear.
- Si añades un script, fuente, imagen o `fetch` a un dominio nuevo, añádelo a la CSP.
- El tracker de analítica solo se carga si el visitante lo acepta (`src/utils/analytics.ts`).
