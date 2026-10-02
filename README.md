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
