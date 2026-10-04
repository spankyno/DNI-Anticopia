/**
 * Analítica de visitas con consentimiento previo (Aitor's Analytics).
 *
 * - El script remoto NO se descarga ni se ejecuta hasta que el visitante acepta.
 * - Lo único que se guarda en el navegador es su elección (clave de localStorage),
 *   necesaria para no volver a preguntar. El tracker no usa cookies ni almacenamiento.
 * - Si el visitante cambia de opinión, la elección se actualiza y el tracker deja de
 *   cargarse en las siguientes visitas.
 */

const CONSENT_STORAGE_KEY = 'dni-anticopia:analytics-consent';
/** Súbelo si cambia lo que se recoge: volverá a pedirse el consentimiento. */
const CONSENT_VERSION = 1;

const TRACKER_SRC = 'https://aitors-hub-dashboard.asanchezgu.workers.dev/tracker.js';
const TRACKER_APP = 'dni-anticopia';
// Clave de ingesta de visitas (pública por diseño: va en el HTML de cualquier sitio con el tracker).
const TRACKER_KEY = 'ak_1a1e70cb420242b0820c528ed19c8e55';

export type ConsentChoice = 'granted' | 'denied';

interface StoredConsent {
  v: number;
  choice: ConsentChoice;
  ts: number;
}

/** Devuelve la elección guardada, o null si aún no ha decidido (o cambió la versión). */
export function getConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.v !== CONSENT_VERSION) return null;
    return parsed.choice === 'granted' || parsed.choice === 'denied' ? parsed.choice : null;
  } catch {
    return null;
  }
}

let trackerLoaded = false;

function loadTracker(): void {
  if (trackerLoaded) return;
  trackerLoaded = true;

  const script = document.createElement('script');
  script.src = TRACKER_SRC;
  script.async = true;
  script.setAttribute('data-app', TRACKER_APP);
  script.setAttribute('data-key', TRACKER_KEY);
  document.head.appendChild(script);
}

/** Guarda la elección. Solo si es 'granted' se carga el tracker. */
export function setConsent(choice: ConsentChoice): void {
  try {
    const value: StoredConsent = { v: CONSENT_VERSION, choice, ts: Date.now() };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible: la elección vale solo para esta sesión */
  }
  if (choice === 'granted') loadTracker();
}

/** Llamar una vez al arrancar: carga el tracker únicamente si ya hay consentimiento. */
export function initAnalytics(): void {
  if (getConsent() === 'granted') loadTracker();
}
