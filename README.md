# DNI Anticopia

Protector de DNI, pasaporte y documentos de identidad: añade **marcas de agua onduladas anti-IA**,
**capas de seguridad sutiles** y **censura de datos sensibles**, todo procesado en tu navegador.
Tus documentos nunca se suben a ningún servidor.

- Web: https://dni-anticopia.kbo1.workers.dev
- Autor: [Aitor Sánchez Gutiérrez](https://aitorsanchez.pages.dev) ·
  [Aitor Hub](https://aitorhub.vercel.app) · [Contacto](https://aitorsanchez.pages.dev/contacto)

## Características

- **Marca de agua ondulada anti-IA** con texto, fecha y propósito del documento.
- **Censura de datos sensibles** (firma, número de soporte, CAN…) con barras opacas o «blur»
  irreversible. Del contenido tapado no sobrevive detalle alguno.
- **Exportación** a PNG, JPG, WebP, PDF (formato DNI 85,6 × 54 mm, A4 u original) y paquete ZIP.
  Los PDF no incluyen metadatos de herramienta ni fechas.
- **Bóveda cifrada** local (AES-256-GCM) protegida por contraseña.
- **PWA instalable** que funciona sin conexión. Interfaz en español e inglés.

### Capas de seguridad sutil anti-IA

| Capa | Qué hace |
|---|---|
| Micro-trama de interferencia | Ruido de alta frecuencia que dificulta el inpainting por difusión |
| Isolíneas guilloché | Curvas onduladas continuas tipo billete |
| Micro-impresión esteganográfica | Micro-texto en filas desfasadas |
| Retícula moiré de fase | Doble retícula con desvío angular; produce aliasing al reescalar |
| Relieve óptico de agua | Sello de relieve 3D sutil |
| **Micropunteado en clotoide** | Símbolos «@» de pocos píxeles (casi puntos) a lo largo de clotoides que nacen en el centro del documento |

Todas tienen tres niveles de sutileza (sutil, equilibrado, alta visibilidad).

**Micropunteado.** La clotoide (espiral de Euler o de Cornu) tiene curvatura proporcional al arco:
`x(t) = a·∫cos(πu²/2)du`, `y(t) = a·∫sin(πu²/2)du`. Arranca recta en el centro y se enrosca cada vez
más, de modo que cada familia dibuja una «S» de dos brazos simétricos respecto al centro. Los puntos
se reparten a distancia de arco constante; el nivel de sutileza fija el número de familias (1, 2 o 3)
y la opacidad. La capa es opcional y está desactivada por defecto.

> Ninguna marca de agua puede impedir por completo que alguien intente eliminarla: estas capas
> **dificultan y desalientan** el uso indebido del documento, no lo impiden.

## Privacidad

- Los documentos se procesan en la memoria del navegador y **nunca se envían** a un servidor.
- **Bóveda cifrada:** AES-256-GCM con una clave maestra aleatoria protegida por la contraseña del
  usuario (PBKDF2-SHA256, 600 000 iteraciones). Un registro manipulado se detecta y se descarta.
  Se bloquea sola tras 5 minutos de inactividad. **Si se olvida la contraseña no hay recuperación.**
- **Analítica de visitas opcional**, solo con consentimiento previo y sin cookies: si se acepta, se
  recibe la IP (como en cualquier petición), el nombre de la app, la ruta y la hora. Ver
  `src/utils/analytics.ts` y el apartado «Privacidad y datos» de la página «Acerca de».
- Tipografías alojadas en la propia app (sin peticiones a Google).

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # genera ./dist
npm run lint         # comprobación de tipos (tsc)
npm run audit:prod   # auditoría de dependencias
npm run icons        # regenera los iconos PWA (Node 22.18+ o 24)
```

Coloca en `public/og-image.png` la imagen social (recomendado 1200 × 630 px, < 1 MB). Se usa para
Open Graph, Twitter Cards y en la página «Acerca de»; si falta, esa imagen simplemente no se muestra.

### Estructura

```
src/
  components/   Editor, bóveda, «Acerca de», banner de consentimiento, cámara…
  utils/
    watermark.ts      Pipeline de renderizado (capas, censura, clotoide)
    vaultCrypto.ts    Cifrado WebCrypto de la bóveda
    db.ts             IndexedDB: bóveda cifrada, sesión y bloqueo
    fileValidation.ts Validación de subidas y saneado de nombres
    analytics.ts      Analítica con consentimiento
public/           Iconos PWA, robots.txt, sitemap.xml, _headers…
```

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
- Subidas validadas por formato real (cabecera), tamaño y dimensiones.

## Novedades

- **Micropunteado en clotoide**: nueva capa anti-IA con símbolos «@» diminutos desde el centro.
- **Bóveda cifrada** (AES-256-GCM) con migración automática de los documentos antiguos sin cifrar.
- **Censura «blur» irreversible**, cámara que siempre se apaga, PDF sin metadatos y subidas validadas.
- **Privacidad:** analítica con consentimiento, tipografías locales y textos revisados.
- **SEO:** Open Graph, Twitter Cards, JSON-LD, `robots.txt` y `sitemap.xml`.
- **Seguridad:** cabeceras HTTP y CSP estricta.
