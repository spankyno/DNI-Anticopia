/**
 * Núcleo criptográfico del Vault (WebCrypto, sin dependencias externas).
 *
 * Diseño:
 *  - Se genera una CLAVE MAESTRA aleatoria AES-256-GCM.
 *  - La clave maestra se guarda "envuelta" (wrapKey) con una clave derivada de la
 *    contraseña del usuario mediante PBKDF2-SHA256 (600 000 iteraciones, sal aleatoria).
 *  - Una contraseña incorrecta hace fallar el desenvuelto (la etiqueta GCM no valida), así
 *    que no hace falta guardar ningún verificador de contraseña.
 *  - Cada documento se cifra con la clave maestra, con IV aleatorio de 96 bits propio y con
 *    datos autenticados adicionales (AAD) que atan el cifrado al id del registro y a su
 *    función: un atacante no puede intercambiar ni reutilizar registros entre sí.
 *  - La clave de sesión se reimporta como NO extraíble: ni el código de la propia app puede
 *    exportar su material en bruto.
 */

export const KDF_ITERATIONS = 600_000;
export const FORMAT_VERSION = 1;

const SALT_BYTES = 16;
const IV_BYTES = 12;
const WRAP_AAD = 'dni-anticopia:vault-key:v1';

export class VaultCryptoUnavailableError extends Error {
  constructor() {
    super('WebCrypto no está disponible (se requiere HTTPS o localhost).');
    this.name = 'VaultCryptoUnavailableError';
  }
}

export class WrongPassphraseError extends Error {
  constructor() {
    super('Clave incorrecta.');
    this.name = 'WrongPassphraseError';
  }
}

export class VaultCorruptedError extends Error {
  constructor(message = 'Datos del Vault dañados o manipulados.') {
    super(message);
    this.name = 'VaultCorruptedError';
  }
}

export interface VaultConfig {
  v: number;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: Uint8Array;
  wrapIv: Uint8Array;
  wrappedKey: Uint8Array;
}

export interface EncryptedBlob {
  iv: Uint8Array;
  ct: Uint8Array;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new VaultCryptoUnavailableError();
  return subtle;
}

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  globalThis.crypto.getRandomValues(out);
  return out;
}

// TypeScript 5.7+ distingue Uint8Array<ArrayBuffer>; WebCrypto exige BufferSource.
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

async function deriveWrappingKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const material = await subtle.importKey(
    'raw',
    bs(enc.encode(passphrase.normalize('NFKC'))),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: bs(salt), iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey']
  );
}

async function unwrapMasterKey(
  wrappingKey: CryptoKey,
  wrappedKey: Uint8Array,
  wrapIv: Uint8Array
): Promise<CryptoKey> {
  return getSubtle().unwrapKey(
    'raw',
    bs(wrappedKey),
    wrappingKey,
    { name: 'AES-GCM', iv: bs(wrapIv), additionalData: bs(enc.encode(WRAP_AAD)) },
    { name: 'AES-GCM', length: 256 },
    false, // NO extraíble
    ['encrypt', 'decrypt']
  );
}

/** Crea un Vault nuevo: devuelve la configuración a persistir y la clave de sesión. */
export async function createVaultKeys(
  passphrase: string
): Promise<{ config: VaultConfig; key: CryptoKey }> {
  const subtle = getSubtle();
  const salt = randomBytes(SALT_BYTES);
  const wrapIv = randomBytes(IV_BYTES);

  // La clave maestra solo es extraíble en este instante, para poder envolverla.
  const master = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
  const wrappingKey = await deriveWrappingKey(passphrase, salt, KDF_ITERATIONS);
  const wrapped = await subtle.wrapKey('raw', master, wrappingKey, {
    name: 'AES-GCM',
    iv: bs(wrapIv),
    additionalData: bs(enc.encode(WRAP_AAD)),
  });
  const wrappedKey = new Uint8Array(wrapped);

  // La clave de sesión se reimporta como NO extraíble.
  const key = await unwrapMasterKey(wrappingKey, wrappedKey, wrapIv);

  return {
    config: {
      v: FORMAT_VERSION,
      kdf: 'PBKDF2-SHA256',
      iterations: KDF_ITERATIONS,
      salt,
      wrapIv,
      wrappedKey,
    },
    key,
  };
}

/** Desbloquea un Vault existente. Lanza WrongPassphraseError si la clave no es válida. */
export async function unlockVaultKey(
  passphrase: string,
  config: VaultConfig
): Promise<CryptoKey> {
  if (config.v !== FORMAT_VERSION || config.kdf !== 'PBKDF2-SHA256') {
    throw new VaultCorruptedError('Formato de Vault no soportado.');
  }
  const wrappingKey = await deriveWrappingKey(passphrase, config.salt, config.iterations);
  try {
    return await unwrapMasterKey(wrappingKey, config.wrappedKey, config.wrapIv);
  } catch {
    throw new WrongPassphraseError();
  }
}

const aadFor = (recordId: string, purpose: 'meta' | 'data') =>
  enc.encode(`dni-anticopia:v${FORMAT_VERSION}:${recordId}:${purpose}`);

export async function encryptBytes(
  key: CryptoKey,
  plain: Uint8Array,
  recordId: string,
  purpose: 'meta' | 'data'
): Promise<EncryptedBlob> {
  const iv = randomBytes(IV_BYTES);
  const ct = await getSubtle().encrypt(
    { name: 'AES-GCM', iv: bs(iv), additionalData: bs(aadFor(recordId, purpose)) },
    key,
    bs(plain)
  );
  return { iv, ct: new Uint8Array(ct) };
}

export async function decryptBytes(
  key: CryptoKey,
  blob: EncryptedBlob,
  recordId: string,
  purpose: 'meta' | 'data'
): Promise<Uint8Array> {
  try {
    const plain = await getSubtle().decrypt(
      { name: 'AES-GCM', iv: bs(blob.iv), additionalData: bs(aadFor(recordId, purpose)) },
      key,
      bs(blob.ct)
    );
    return new Uint8Array(plain);
  } catch {
    throw new VaultCorruptedError();
  }
}

export async function encryptText(
  key: CryptoKey,
  text: string,
  recordId: string,
  purpose: 'meta' | 'data'
): Promise<EncryptedBlob> {
  return encryptBytes(key, enc.encode(text), recordId, purpose);
}

export async function decryptText(
  key: CryptoKey,
  blob: EncryptedBlob,
  recordId: string,
  purpose: 'meta' | 'data'
): Promise<string> {
  return dec.decode(await decryptBytes(key, blob, recordId, purpose));
}

// ---------------------------------------------------------------------------
// Política de contraseña
// ---------------------------------------------------------------------------

export interface PassphraseCheck {
  ok: boolean;
  /** 0 (muy débil) a 4 (fuerte) */
  score: 0 | 1 | 2 | 3 | 4;
  reason?: 'too_short' | 'too_common' | 'too_weak';
}

const COMMON = [
  'password', 'contraseña', 'contrasena', 'qwertyui', 'qwerty123', 'abc12345',
  'iloveyou', 'letmein1', 'admin123', 'welcome1', 'dni12345', 'anticopia',
];

export function checkPassphrase(pass: string): PassphraseCheck {
  const p = pass.normalize('NFKC');
  if (p.length < 8) return { ok: false, score: 0, reason: 'too_short' };

  const lower = p.toLowerCase();
  const sequential = '01234567890123456789';
  if (
    COMMON.some((c) => lower.includes(c)) ||
    /^(.)\1+$/.test(p) ||
    sequential.includes(lower) ||
    sequential.split('').reverse().join('').includes(lower)
  ) {
    return { ok: false, score: 0, reason: 'too_common' };
  }

  const classes =
    Number(/[a-zñáéíóúü]/.test(p)) +
    Number(/[A-ZÑÁÉÍÓÚÜ]/.test(p)) +
    Number(/[0-9]/.test(p)) +
    Number(/[^A-Za-z0-9ñáéíóúüÑÁÉÍÓÚÜ]/.test(p));

  let score = 1; // longitud >= 8
  if (p.length >= 12) score += 1;
  if (classes >= 2) score += 1;
  if (classes >= 3 || p.length >= 16) score += 1;

  const s = Math.min(4, score) as 1 | 2 | 3 | 4;
  return s >= 2 ? { ok: true, score: s } : { ok: false, score: s, reason: 'too_weak' };
}
