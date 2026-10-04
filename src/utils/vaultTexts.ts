import { SupportedLanguage } from '../types';

const es = {
  title: 'Bóveda cifrada',
  subtitleLocked: 'Tus copias se guardan cifradas (AES-256-GCM) solo en este dispositivo.',
  subtitleOpen: 'Cifrada con AES-256-GCM. Se bloquea sola tras 5 minutos de inactividad.',
  lock: 'Bloquear',
  close: 'Cerrar',
  cancel: 'Cancelar',
  loading: 'Cargando…',

  setupTitle: 'Crea la clave de tu bóveda',
  setupIntro:
    'Tus documentos se cifran en este dispositivo con una clave derivada de la contraseña que elijas. Sin ella nadie puede leerlos, ni siquiera quien acceda al navegador.',
  setupLegacy: (n: number) =>
    `Tienes ${n} documento${n === 1 ? '' : 's'} guardado${n === 1 ? '' : 's'} sin cifrar de una versión anterior. Se cifrarán y se borrarán las copias en claro al crear la clave.`,
  setupPending: 'El documento que acabas de proteger se guardará en cuanto crees la clave.',
  passLabel: 'Contraseña de la bóveda',
  passConfirm: 'Repite la contraseña',
  show: 'Mostrar',
  hide: 'Ocultar',
  passHint:
    'Mínimo 8 caracteres. Mejor una frase larga (4 palabras) que un PIN corto: quien copie los datos del navegador podría probar claves sin límite.',
  strength: ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'],
  errShort: 'Debe tener al menos 8 caracteres.',
  errCommon: 'Es demasiado común o predecible. Elige otra.',
  errWeak: 'Es demasiado débil. Alarga la contraseña o mezcla letras, números y símbolos.',
  errMismatch: 'Las contraseñas no coinciden.',
  ackLabel:
    'Entiendo que si olvido la contraseña NO hay forma de recuperar los documentos (no existe restablecimiento).',
  errAck: 'Debes confirmar que has entendido este aviso.',
  limits:
    'Protege tus copias si alguien accede a este dispositivo o navegador. No protege si el dispositivo ya tiene malware, ni cifra lo que descargues o envíes.',
  createBtn: 'Crear bóveda cifrada',
  creating: 'Cifrando…',

  lockedTitle: 'Bóveda bloqueada',
  lockedIntro: 'Introduce tu contraseña para ver tus documentos.',
  unlockBtn: 'Desbloquear',
  unlocking: 'Descifrando…',
  errWrong: 'Contraseña incorrecta.',
  errWait: (s: number) => `Demasiados intentos. Espera ${s} s antes de volver a probar.`,
  errGeneric: 'No se pudo completar la operación. Inténtalo de nuevo.',
  errCrypto: 'Este navegador no permite cifrado seguro (se requiere HTTPS).',
  forgot: 'He olvidado la contraseña',
  resetTitle: 'Restablecer la bóveda',
  resetBody:
    'Se borrarán TODOS los documentos guardados y la contraseña. Los datos cifrados no se pueden recuperar sin ella. Después podrás crear una bóveda nueva.',
  resetConfirm: 'Sí, borrar todo y empezar de nuevo',

  empty: 'Bóveda vacía',
  emptyHint: 'Cuando protejas un documento, pulsa «Guardar en mi Bóveda Cifrada» para archivarlo.',
  clearAll: 'Borrar todos los documentos',
  clearConfirm: '¿Seguro que quieres borrar todos los documentos de tu bóveda? Se conservará la contraseña.',
  clearYes: 'Sí, borrar todo',
  noPurpose: 'Sin propósito específico',
  downloadPng: 'Descargar PNG',
  downloadPdf: 'Descargar PDF DNI (85.6×54mm)',
  deleteTitle: 'Eliminar de la bóveda',
  savedNotice: 'Documento guardado cifrado en tu bóveda.',
  migratedNotice: (n: number) =>
    `${n} documento${n === 1 ? '' : 's'} antiguo${n === 1 ? '' : 's'} cifrado${n === 1 ? '' : 's'} correctamente.`,
  decrypting: 'Descifrando…',
};

const en: typeof es = {
  title: 'Encrypted vault',
  subtitleLocked: 'Your copies are stored encrypted (AES-256-GCM) on this device only.',
  subtitleOpen: 'Encrypted with AES-256-GCM. Locks itself after 5 minutes of inactivity.',
  lock: 'Lock',
  close: 'Close',
  cancel: 'Cancel',
  loading: 'Loading…',

  setupTitle: 'Create your vault password',
  setupIntro:
    'Your documents are encrypted on this device with a key derived from the password you choose. Without it nobody can read them, not even someone with access to the browser.',
  setupLegacy: (n: number) =>
    `You have ${n} unencrypted document${n === 1 ? '' : 's'} saved by an earlier version. ${n === 1 ? 'It' : 'They'} will be encrypted and the plain copies deleted when you create the password.`,
  setupPending: 'The document you just protected will be saved as soon as you create the password.',
  passLabel: 'Vault password',
  passConfirm: 'Repeat the password',
  show: 'Show',
  hide: 'Hide',
  passHint:
    'At least 8 characters. A long phrase (4 words) beats a short PIN: anyone who copies the browser data could try passwords without limit.',
  strength: ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'],
  errShort: 'It must be at least 8 characters long.',
  errCommon: 'That is too common or predictable. Pick another one.',
  errWeak: 'That is too weak. Make it longer or mix letters, numbers and symbols.',
  errMismatch: 'The passwords do not match.',
  ackLabel:
    'I understand that if I forget the password there is NO way to recover the documents (there is no reset).',
  errAck: 'You must confirm you understood this warning.',
  limits:
    'It protects your copies if someone gets access to this device or browser. It does not protect against malware already on the device, nor does it encrypt what you download or send.',
  createBtn: 'Create encrypted vault',
  creating: 'Encrypting…',

  lockedTitle: 'Vault locked',
  lockedIntro: 'Enter your password to see your documents.',
  unlockBtn: 'Unlock',
  unlocking: 'Decrypting…',
  errWrong: 'Wrong password.',
  errWait: (s: number) => `Too many attempts. Wait ${s} s before trying again.`,
  errGeneric: 'The operation could not be completed. Please try again.',
  errCrypto: 'This browser does not allow secure encryption (HTTPS required).',
  forgot: 'I forgot my password',
  resetTitle: 'Reset the vault',
  resetBody:
    'ALL saved documents and the password will be deleted. Encrypted data cannot be recovered without it. You can then create a new vault.',
  resetConfirm: 'Yes, delete everything and start over',

  empty: 'Empty vault',
  emptyHint: 'After protecting a document, press “Save to my Encrypted Vault” to archive it.',
  clearAll: 'Delete all documents',
  clearConfirm: 'Are you sure you want to delete all documents from your vault? The password will be kept.',
  clearYes: 'Yes, delete all',
  noPurpose: 'No specific purpose',
  downloadPng: 'Download PNG',
  downloadPdf: 'Download ID PDF (85.6×54mm)',
  deleteTitle: 'Remove from vault',
  savedNotice: 'Document saved encrypted in your vault.',
  migratedNotice: (n: number) =>
    `${n} older document${n === 1 ? '' : 's'} encrypted successfully.`,
  decrypting: 'Decrypting…',
};

export const vaultTexts = { es, en };
export type VaultTexts = typeof es;
export const getVaultTexts = (lang: SupportedLanguage): VaultTexts => vaultTexts[lang];
