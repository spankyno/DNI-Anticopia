import { VaultItem, VaultItemMeta } from '../types';
import {
  EncryptedBlob,
  VaultConfig,
  VaultCorruptedError,
  WrongPassphraseError,
  createVaultKeys,
  decryptText,
  encryptText,
  unlockVaultKey,
} from './vaultCrypto';
import { makeThumbnail } from './vaultThumb';

export { VaultCorruptedError, WrongPassphraseError, VaultCryptoUnavailableError } from './vaultCrypto';

const DB_NAME = 'dni_anticopia_vault';
const DB_VERSION = 2;
/** v1: documentos SIN cifrar (se migran y se borran al crear/desbloquear el Vault). */
const STORE_LEGACY = 'documents';
const STORE_CONFIG = 'vault_config';
const STORE_ITEMS = 'vault_items';
const CONFIG_KEY = 'config';

/** El Vault se bloquea solo tras este tiempo sin actividad. */
export const IDLE_LOCK_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Errores
// ---------------------------------------------------------------------------

export class VaultLockedError extends Error {
  constructor() {
    super('El Vault está bloqueado.');
    this.name = 'VaultLockedError';
  }
}

export class TooManyAttemptsError extends Error {
  retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super('Demasiados intentos fallidos.');
    this.name = 'TooManyAttemptsError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class VaultAlreadyExistsError extends Error {
  constructor() {
    super('El Vault ya está creado.');
    this.name = 'VaultAlreadyExistsError';
  }
}

// ---------------------------------------------------------------------------
// Estado de sesión (solo en memoria; nunca se persiste)
// ---------------------------------------------------------------------------

let sessionKey: CryptoKey | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let failedAttempts = 0;
let blockedUntil = 0;
const listeners = new Set<(unlocked: boolean) => void>();

function armIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => lockVault(), IDLE_LOCK_MS);
}

function setSessionKey(key: CryptoKey | null) {
  const changed = (sessionKey === null) !== (key === null);
  sessionKey = key;
  if (key) {
    armIdleTimer();
  } else if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  if (changed) listeners.forEach((cb) => cb(key !== null));
}

function requireKey(): CryptoKey {
  if (!sessionKey) throw new VaultLockedError();
  armIdleTimer();
  return sessionKey;
}

export function isVaultUnlocked(): boolean {
  return sessionKey !== null;
}

/** Reinicia el temporizador de inactividad (llamar ante interacción del usuario). */
export function touchVault(): void {
  if (sessionKey) armIdleTimer();
}

export function lockVault(): void {
  setSessionKey(null);
}

export function onVaultLockChange(cb: (unlocked: boolean) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

if (typeof window !== 'undefined') {
  // Al cerrar o recargar la pestaña la clave desaparece de la memoria.
  window.addEventListener('pagehide', () => lockVault());
}

// ---------------------------------------------------------------------------
// IndexedDB
// ---------------------------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_LEGACY)) {
        db.createObjectStore(STORE_LEGACY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CONFIG)) {
        db.createObjectStore(STORE_CONFIG);
      }
      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      // Si otra pestaña pide actualizar el esquema, liberamos esta conexión.
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IndexedDB blocked by another tab'));
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Ejecuta una transacción y CIERRA siempre la conexión al terminar.
 * `work` solo debe encadenar peticiones IndexedDB (nada de awaits ajenos, como crypto,
 * dentro de la transacción: se autocierra).
 */
async function withTx<T>(
  stores: string | string[],
  mode: IDBTransactionMode,
  work: (tx: IDBTransaction) => Promise<T> | T
): Promise<T> {
  const db = await openDB();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(stores, mode);
      let result: T;
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'));
      Promise.resolve(work(tx)).then(
        (r) => {
          result = r;
        },
        (e) => {
          try {
            tx.abort();
          } catch {
            /* ya finalizada */
          }
          reject(e);
        }
      );
    });
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// Formato de los registros cifrados
// ---------------------------------------------------------------------------

interface EncryptedRecord {
  id: string;
  v: number;
  meta: EncryptedBlob;
  data: EncryptedBlob;
}

async function encryptRecord(key: CryptoKey, item: VaultItem): Promise<EncryptedRecord> {
  const { dataUrl, ...meta } = item;
  return {
    id: item.id,
    v: 1,
    meta: await encryptText(key, JSON.stringify(meta), item.id, 'meta'),
    data: await encryptText(key, dataUrl, item.id, 'data'),
  };
}

async function decryptMeta(key: CryptoKey, rec: EncryptedRecord): Promise<VaultItemMeta> {
  const parsed = JSON.parse(await decryptText(key, rec.meta, rec.id, 'meta'));
  return { ...parsed, id: rec.id } as VaultItemMeta;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export interface VaultStatus {
  /** Existe un Vault con contraseña creada. */
  initialized: boolean;
  /** Documentos cifrados almacenados. */
  itemCount: number;
  /** Documentos antiguos guardados SIN cifrar (versión anterior de la app). */
  legacyCount: number;
}

export async function getVaultStatus(): Promise<VaultStatus> {
  return withTx([STORE_CONFIG, STORE_ITEMS, STORE_LEGACY], 'readonly', async (tx) => {
    const [config, itemCount, legacyCount] = await Promise.all([
      reqToPromise(tx.objectStore(STORE_CONFIG).count()),
      reqToPromise(tx.objectStore(STORE_ITEMS).count()),
      reqToPromise(tx.objectStore(STORE_LEGACY).count()),
    ]);
    return { initialized: config > 0, itemCount, legacyCount };
  });
}

/** Nº de documentos guardados (no requiere desbloquear). Para la insignia de la cabecera. */
export async function getVaultCount(): Promise<number> {
  const s = await getVaultStatus();
  return s.itemCount + s.legacyCount;
}

/** Cifra los documentos antiguos en claro y los borra del almacén antiguo (atómico). */
async function migrateLegacyItems(): Promise<number> {
  const key = requireKey();
  const legacy = await withTx(STORE_LEGACY, 'readonly', (tx) =>
    reqToPromise(tx.objectStore(STORE_LEGACY).getAll() as IDBRequest<VaultItem[]>)
  );
  if (legacy.length === 0) return 0;

  const records: EncryptedRecord[] = [];
  for (const item of legacy) {
    let thumbnail = item.thumbnail;
    try {
      thumbnail = await makeThumbnail(item.dataUrl);
    } catch {
      /* se conserva la miniatura original */
    }
    records.push(await encryptRecord(key, { ...item, thumbnail }));
  }

  // Un solo commit: o se guardan TODOS los cifrados y se borran los antiguos, o no cambia nada.
  await withTx([STORE_ITEMS, STORE_LEGACY], 'readwrite', async (tx) => {
    const items = tx.objectStore(STORE_ITEMS);
    await Promise.all(records.map((r) => reqToPromise(items.put(r))));
    await reqToPromise(tx.objectStore(STORE_LEGACY).clear());
  });
  return records.length;
}

/** Crea el Vault con una contraseña nueva, lo deja desbloqueado y cifra lo que hubiera antiguo. */
export async function setupVault(passphrase: string): Promise<{ migrated: number }> {
  const status = await getVaultStatus();
  if (status.initialized) throw new VaultAlreadyExistsError();

  const { config, key } = await createVaultKeys(passphrase);
  await withTx(STORE_CONFIG, 'readwrite', (tx) =>
    // add (no put): si otra pestaña lo creó entretanto, falla en vez de sobrescribir
    reqToPromise(tx.objectStore(STORE_CONFIG).add(config, CONFIG_KEY))
  );

  setSessionKey(key);
  failedAttempts = 0;
  blockedUntil = 0;
  const migrated = await migrateLegacyItems();

  // Mejor esfuerzo: evita que el navegador desaloje el almacenamiento y se pierda el Vault.
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* no crítico */
  }
  return { migrated };
}

/**
 * Desbloquea el Vault. Tras 3 fallos seguidos se aplica una espera creciente (máx. 30 s).
 * Nota: es una barrera de interfaz; la protección real frente a quien copie la base de datos
 * es el coste de PBKDF2 (600 000 iteraciones) y la fortaleza de la contraseña.
 */
export async function unlockVault(passphrase: string): Promise<{ migrated: number }> {
  const now = Date.now();
  if (now < blockedUntil) throw new TooManyAttemptsError(blockedUntil - now);

  const config = await withTx(STORE_CONFIG, 'readonly', (tx) =>
    reqToPromise(tx.objectStore(STORE_CONFIG).get(CONFIG_KEY) as IDBRequest<VaultConfig | undefined>)
  );
  if (!config) throw new VaultCorruptedError('No hay ningún Vault creado.');

  let key: CryptoKey;
  try {
    key = await unlockVaultKey(passphrase, config);
  } catch (e) {
    if (e instanceof WrongPassphraseError) {
      failedAttempts += 1;
      if (failedAttempts >= 3) {
        const wait = Math.min(30_000, 1000 * 2 ** (failedAttempts - 3));
        blockedUntil = Date.now() + wait;
        // Se avisa en el momento en que se activa la espera, no en el intento siguiente.
        throw new TooManyAttemptsError(wait);
      }
    }
    throw e;
  }

  failedAttempts = 0;
  blockedUntil = 0;
  setSessionKey(key);
  const migrated = await migrateLegacyItems();
  return { migrated };
}

export async function saveToVault(item: VaultItem): Promise<void> {
  const key = requireKey();
  const record = await encryptRecord(key, item);
  await withTx(STORE_ITEMS, 'readwrite', (tx) => reqToPromise(tx.objectStore(STORE_ITEMS).put(record)));
}

/** Lista de documentos (descifra solo los metadatos y la miniatura). */
export async function getVaultItems(): Promise<VaultItemMeta[]> {
  const key = requireKey();
  const records = await withTx(STORE_ITEMS, 'readonly', (tx) =>
    reqToPromise(tx.objectStore(STORE_ITEMS).getAll() as IDBRequest<EncryptedRecord[]>)
  );

  const items: VaultItemMeta[] = [];
  for (const rec of records) {
    try {
      items.push(await decryptMeta(key, rec));
    } catch (e) {
      // Un registro dañado o manipulado no debe impedir abrir el resto.
      console.warn('Vault: registro ilegible omitido', rec.id, e);
    }
  }
  items.sort((a, b) => b.timestamp - a.timestamp);
  return items;
}

/** Descifra la imagen completa de un documento (bajo demanda). */
export async function getVaultItemData(id: string): Promise<string> {
  const key = requireKey();
  const rec = await withTx(STORE_ITEMS, 'readonly', (tx) =>
    reqToPromise(tx.objectStore(STORE_ITEMS).get(id) as IDBRequest<EncryptedRecord | undefined>)
  );
  if (!rec) throw new VaultCorruptedError('Documento no encontrado.');
  return decryptText(key, rec.data, rec.id, 'data');
}

export async function deleteVaultItem(id: string): Promise<void> {
  await withTx(STORE_ITEMS, 'readwrite', (tx) => reqToPromise(tx.objectStore(STORE_ITEMS).delete(id)));
}

/** Borra todos los documentos, pero conserva la contraseña del Vault. */
export async function clearVault(): Promise<void> {
  await withTx([STORE_ITEMS, STORE_LEGACY], 'readwrite', async (tx) => {
    await reqToPromise(tx.objectStore(STORE_ITEMS).clear());
    await reqToPromise(tx.objectStore(STORE_LEGACY).clear());
  });
}

/**
 * Restablece el Vault por completo: borra documentos Y contraseña.
 * Es la única salida si se olvida la contraseña (los datos no son recuperables).
 */
export async function resetVault(): Promise<void> {
  lockVault();
  failedAttempts = 0;
  blockedUntil = 0;
  await withTx([STORE_ITEMS, STORE_LEGACY, STORE_CONFIG], 'readwrite', async (tx) => {
    await reqToPromise(tx.objectStore(STORE_ITEMS).clear());
    await reqToPromise(tx.objectStore(STORE_LEGACY).clear());
    await reqToPromise(tx.objectStore(STORE_CONFIG).clear());
  });
}
