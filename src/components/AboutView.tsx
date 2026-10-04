import React from 'react';
import { SupportedLanguage } from '../types';
import { translations } from '../utils/translations';
import { ShieldCheck, Lock, Cpu, AlertTriangle, CheckCircle2, ShieldAlert, Heart, ExternalLink, Globe, FileCheck, Sparkles, BookOpen, LayoutGrid, Mail, User } from 'lucide-react';
import { AUTHOR } from '../utils/author';
import { ConsentChoice } from '../utils/analytics';

interface AboutViewProps {
  lang: SupportedLanguage;
  onNavigateToEditor: () => void;
  consent?: ConsentChoice | null;
  onOpenConsent?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ lang, onNavigateToEditor, consent = null, onOpenConsent }) => {
  const t = translations[lang];
  const es = lang === 'es';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12 text-slate-200">
      {/* Hero Banner */}
      <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0c1427] via-[#090d16] to-[#131124] p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/60 text-cyan-300 text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>{lang === 'es' ? 'Compromiso de Privacidad y Ciberseguridad' : 'Privacy & Cybersecurity Commitment'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            {lang === 'es' ? 'La verdad sobre compartir tu DNI en internet' : 'The Truth About Sharing Your ID Online'}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            {t.secIntro}
          </p>

          <button
            onClick={onNavigateToEditor}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t.ctaProtect}</span>
          </button>
        </div>
      </div>

      {/* 1. Privacidad Total: 100% Local Browser Engine */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {lang === 'es' ? '1. Privacidad por Diseño: 100% Procesado en tu Dispositivo' : '1. Privacy by Design: 100% Client-Side Processing'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'es' ? 'Tus documentos nunca tocan ningún servidor' : 'Your documents never touch any server'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'es' ? 'Sin Servidores de Subida' : 'Zero Cloud Uploads'}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'es'
                ? 'DNI Anticopia no sube tus documentos a ningún servidor ni los guarda en la nube. Todas las operaciones de cálculo de ondas, dibujo y exportación se ejecutan en la memoria de tu navegador (HTML5 Canvas).'
                : 'DNI Anticopia never uploads your documents or stores them in the cloud. All wave calculations, drawing and exports run in your browser memory (HTML5 Canvas).'}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'es' ? 'Comprobable en Modo Avión' : 'Verifiable in Airplane Mode'}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'es'
                ? 'Puedes abrir la web, activar el Modo Avión o desconectar tu Wi-Fi por completo, y comprobarás que el procesamiento del DNI, la marca de agua y la descarga de PDF siguen funcionando exactamente igual.'
                : 'Turn on Airplane mode or unplug your internet: document watermarking and PDF generation will continue to function seamlessly.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'es' ? 'Auditable con Inspector de Red' : 'Network Inspector Auditable'}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'es'
                ? 'Cualquier desarrollador o usuario avanzado puede abrir las Herramientas de Desarrollador (F12) > Pestaña Red (Network) para certificar que no se emite ninguna petición HTTP con las imágenes tratadas.'
                : 'Open Browser DevTools (F12) > Network Tab: zero image payloads or POST requests are dispatched during the entire flow.'}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Por qué la marca de agua ondulada es resistente a la IA */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {lang === 'es' ? '2. ¿Por qué la Marca de Agua Ondulada Dificulta el Borrado por IA?' : '2. Why Undulating Watermarks Make AI Erasing Harder'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'es' ? 'Tecnología matemática inspirada en billetes bancarios e isolíneas' : 'Mathematical security inspired by banknote guilloché'}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d1527] space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {lang === 'es'
              ? 'Las herramientas de "borrado mágico" de IA generativa (como Photoshop Generative Fill, Magic Eraser de Google o modelos Inpainting Stable Diffusion) funcionan analizando los píxeles circundantes para "adivinar" y rellenar lo que había debajo de una marca de agua recta tradicional.'
              : 'Generative AI inpainting and object erasers work by interpolating surrounding pixels to infer what was underneath traditional straight watermarks.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-rose-950 bg-rose-950/20">
              <h4 className="text-xs font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                {lang === 'es' ? 'Marca de Agua Tradicional (Fácil de Borrar con IA)' : 'Traditional Watermark (Easily Erased by AI)'}
              </h4>
              <p className="text-xs text-slate-400">
                Líneas rectas, tipografía uniforme y ángulos fijos. La IA reconoce el patrón fácilmente, identifica la máscara de texto y reconstruye la textura plana del documento en milisegundos.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-cyan-950 bg-cyan-950/20">
              <h4 className="text-xs font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                {lang === 'es' ? 'Marca Ondulada DNI Anticopia (Resistente a IA)' : 'DNI Anticopia Undulating Wave (AI-Resistant)'}
              </h4>
              <p className="text-xs text-slate-400">
                Deformación senoidal continua, isolíneas guilloché multicolores y micro-tramas de interferencia. Si una IA intenta eliminarla, suele alterar la coherencia espacial de las letras del documento y dejar artefactos visibles, lo que dificulta hacer pasar una versión manipulada por auténtica.
              </p>
            </div>
          </div>

          {/* Subtle Security Features Breakdown */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'es' ? 'Nuevas Capas Sutiles de Seguridad Documental (Inspiradas en Billetes y Saferlayer)' : 'Subtle Document Security Layers'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-cyan-300 block mb-1">Micro-impresión Esteganográfica</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Micro-texto de 7-8 píxeles distribuido en filas desfasadas ("DNI ANTICOPIA • NO VÁLIDO PARA CRÉDITOS"). A simple vista parece una trama suave, y a esa escala los modelos de difusión de IA suelen tener dificultades para reproducir caracteres legibles.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-emerald-300 block mb-1">Retícula Moiré de Fase</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Doble retícula con desvío angular armónico de 3.2° que genera franjas de interferencia óptica. Si el documento se reescala o se intenta clonar con IA, se producen manchas destructivas de aliasing.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-indigo-300 block mb-1">Relieve de Agua 3D</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Variación sutil de gradientes de luz y sombra (filtro de relieve refractivo) que añade una marca táctil digital oficial sin impedir la lectura de los datos por ojos humanos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Recomendaciones Oficiales Policía Nacional e INCIBE */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {lang === 'es' ? '3. Recomendaciones Oficiales de Policía Nacional e INCIBE' : '3. Official Police & INCIBE Recommendations'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'es' ? 'Guía práctica para trámites seguros en España' : 'Best practices for safe identity sharing'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
              <span className="font-bold text-xs">01</span>
            </div>
            <div className="text-xs sm:text-sm">
              <h4 className="font-bold text-white mb-1">
                {lang === 'es' ? 'Pasa la imagen a escala de grises (Blanco y Negro)' : 'Convert Image to Grayscale'}
              </h4>
              <p className="text-slate-400 leading-relaxed">{t.incibeRec1}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 mt-0.5">
              <span className="font-bold text-xs">02</span>
            </div>
            <div className="text-xs sm:text-sm">
              <h4 className="font-bold text-white mb-1">
                {lang === 'es' ? 'Tacha la firma del titular y el Nº de Soporte (IDESP)' : 'Redact Bearer Signature and Card Support (IDESP)'}
              </h4>
              <p className="text-slate-400 leading-relaxed">{t.incibeRec2}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
              <span className="font-bold text-xs">03</span>
            </div>
            <div className="text-xs sm:text-sm">
              <h4 className="font-bold text-white mb-1">
                {lang === 'es' ? 'Estampa el motivo exacto y la fecha de validez' : 'Stamp Exact Purpose and Validity Date'}
              </h4>
              <p className="text-slate-400 leading-relaxed">{t.incibeRec3}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Por qué es mejor que editar a mano en un editor de fotos */}
      <section className="p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0d1424] to-slate-900 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          <span>{lang === 'es' ? '¿Por qué no basta con dibujar una línea con el móvil o Paint?' : 'Why is a simple phone doodle not enough?'}</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {lang === 'es'
            ? 'Cuando editas una foto en un editor genérico (como la app de fotos del móvil), muchas veces la marca de agua solo cubre una pequeña esquina o deja intactos los metadatos EXIF. Además, las líneas rectas simples son triviales de eliminar con un borrador mágico de un smartphone moderno. DNI Anticopia aplica matemáticas de ondulación vectoriales continuas y exporta un archivo aplanado sin metadatos residuales, lo que desalienta su reutilización.'
            : 'Standard phone markup tools draw simple flat strokes that modern phone AI can remove in 1 tap. DNI Anticopia flattens continuous vector ripples across the entirety of the document and strips residual metadata.'}
        </p>
      </section>

      {/* Privacidad y datos */}
      <section id="privacidad" className="space-y-4 scroll-mt-24">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{es ? 'Privacidad y datos' : 'Privacy and data'}</h2>
            <p className="text-xs text-slate-400">
              {es ? 'Qué sale de tu dispositivo y qué no' : 'What leaves your device and what does not'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{es ? 'Tus documentos' : 'Your documents'}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {es
                ? 'Las imágenes se procesan en la memoria de tu navegador y nunca se envían a ningún servidor. Si usas la bóveda, se guardan cifradas (AES-256-GCM) en este navegador y solo se descifran con tu contraseña.'
                : 'Images are processed in your browser memory and are never sent to any server. If you use the vault, they are stored encrypted (AES-256-GCM) in this browser and only decrypted with your password.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>{es ? 'Analítica de visitas (solo si la aceptas)' : 'Visit analytics (only if you accept)'}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {es
                ? 'Si aceptas, al cargar la página se envía a un servidor del autor: tu dirección IP (que recibe cualquier servidor al conectarte), el nombre de la aplicación, la ruta de la página y la hora. No se envían tus documentos, su contenido ni los nombres de tus archivos.'
                : 'If you accept, when the page loads the author’s server receives: your IP address (which any server receives when you connect), the application name, the page path and the time. Your documents, their content and your file names are not sent.'}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {es
                ? 'Finalidad: contar visitas. Base jurídica: tu consentimiento, que puedes retirar cuando quieras. Conservación: solo el tiempo necesario para las estadísticas. Responsable: '
                : 'Purpose: counting visits. Legal basis: your consent, which you can withdraw at any time. Retention: only as long as needed for statistics. Controller: '}
              <a href={AUTHOR.contact} target="_blank" rel="noopener" className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2">
                {AUTHOR.name}
              </a>
              .
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {es
                ? 'Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad a través del formulario de contacto, y reclamar ante la '
                : 'You can exercise your rights of access, rectification, erasure, objection, restriction and portability through the contact form, and lodge a complaint with the '}
              <a href="https://www.aepd.es" target="_blank" rel="noopener" className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2">
                AEPD
              </a>
              .
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>{es ? 'Sin cookies ni servicios de terceros' : 'No cookies or third-party services'}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {es
                ? 'La app no usa cookies. En tu navegador solo se guarda tu elección sobre la analítica (para no volver a preguntarte) y, si la creas, tu bóveda cifrada. Las tipografías se sirven desde la propia app, sin conexión a Google. La app y las estadísticas se alojan en Cloudflare, como proveedor de infraestructura. Los enlaces al blog, al Hub y al contacto del autor llevan a sitios externos con su propia política.'
                : 'The app does not use cookies. Your browser only stores your analytics choice (so you are not asked again) and, if you create it, your encrypted vault. Fonts are served from the app itself, with no connection to Google. The app and the statistics are hosted on Cloudflare as an infrastructure provider. Links to the author’s blog, Hub and contact lead to external sites with their own policies.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-amber-900/40 bg-amber-950/10 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{es ? 'Alcance y límites' : 'Scope and limits'}</span>
            </h3>
            <ul className="text-xs text-slate-400 leading-relaxed space-y-1.5 list-disc pl-4">
              <li>
                {es
                  ? 'La marca de agua ondulada dificulta y desalienta el uso indebido del documento, pero ninguna técnica puede impedir por completo que alguien intente eliminarla.'
                  : 'The undulating watermark makes misuse harder and discourages it, but no technique can completely prevent someone from trying to remove it.'}
              </li>
              <li>
                {es
                  ? 'La bóveda cifrada protege tus copias si alguien accede a este dispositivo. No protege si el dispositivo ya tiene malware o si eliges una contraseña débil, y si la olvidas no hay forma de recuperar los datos.'
                  : 'The encrypted vault protects your copies if someone gets access to this device. It does not protect against malware already on the device or a weak password, and if you forget the password the data cannot be recovered.'}
              </li>
              <li>
                {es
                  ? 'Lo que descargues o envíes fuera de la app deja de estar bajo la protección de la bóveda.'
                  : 'What you download or send outside the app is no longer covered by the vault.'}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/40 text-xs">
          <p className="text-slate-300">
            {es ? 'Tu elección sobre la analítica: ' : 'Your analytics choice: '}
            <strong className="text-white">
              {consent === 'granted'
                ? es ? 'Aceptada' : 'Accepted'
                : consent === 'denied'
                  ? es ? 'Rechazada' : 'Rejected'
                  : es ? 'Sin decidir' : 'Not decided'}
            </strong>
          </p>
          {onOpenConsent && (
            <button
              type="button"
              onClick={onOpenConsent}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-950/70 text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 font-semibold transition"
            >
              {es ? 'Cambiar preferencia' : 'Change preference'}
            </button>
          )}
        </div>
      </section>

      {/* Autor */}
      <section className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          <span>{lang === 'es' ? 'Sobre el autor' : 'About the author'}</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {lang === 'es'
            ? <>DNI Anticopia ha sido creado y mantenido por <strong className="text-white">{AUTHOR.name}</strong> como herramienta gratuita de ciberseguridad ciudadana. Puedes conocer más proyectos, leer el blog o ponerte en contacto a través de estos enlaces.</>
            : <>DNI Anticopia is created and maintained by <strong className="text-white">{AUTHOR.name}</strong> as a free citizen cybersecurity tool. Find more projects, read the blog or get in touch through the links below.</>}
        </p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <a
            href={AUTHOR.blog}
            target="_blank"
            rel="author noopener"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-950/70 text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>{lang === 'es' ? 'Blog de Aitor' : "Aitor's Blog"}</span>
          </a>
          <a
            href={AUTHOR.hub}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-950/70 text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 transition"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Aitor Hub</span>
          </a>
          <a
            href={AUTHOR.contact}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-950/70 text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 transition"
          >
            <Mail className="w-4 h-4" />
            <span>{lang === 'es' ? 'Contacto' : 'Contact'}</span>
          </a>
        </div>
      </section>

      {/* 5. Créditos y Disclaimer Legal */}
      <section className="pt-6 border-t border-slate-800 space-y-4">
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-950/80 text-xs text-slate-400 space-y-3">
          <h4 className="font-bold text-slate-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{t.disclaimerTitle}</span>
          </h4>
          <p className="leading-relaxed">{t.disclaimerText}</p>
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-500">
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
              <span>{t.creditsText}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              <span>DNI Anticopia v1.0 • {AUTHOR.name} • PWA Standalone • Client-Side</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
