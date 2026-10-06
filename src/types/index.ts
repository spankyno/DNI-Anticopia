export type DocumentType = 
  | 'dni_front' 
  | 'dni_back' 
  | 'passport' 
  | 'driver_license' 
  | 'contract' 
  | 'payslip' 
  | 'invoice' 
  | 'generic';

export type WatermarkPreset = 
  | 'saferlayer_waves' 
  | 'neon_security' 
  | 'subtle_stamp' 
  | 'high_security_red' 
  | 'flag_undulation';

export type RedactionStyle = 
  | 'solid_black' 
  | 'caution_tape' 
  | 'blur' 
  | 'white_bar';

export interface RedactionBox {
  id: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
  label: string;
  style: RedactionStyle;
}

export interface WatermarkConfig {
  text: string;
  preset: WatermarkPreset;
  opacity: number; // 0.1 to 1.0
  angle: number; // -45 to 45 deg
  density: number; // 1 to 5
  fontSize: number; // 12 to 40
  waveFrequency: number; // 1 to 10
  waveAmplitude: number; // 0 to 40
  colorTheme: 'cyan_magenta' | 'emerald_cyan' | 'red_amber' | 'slate_mono' | 'custom';
  customColor: string;
  includeDate: boolean;
  customDate: string;
  grayscale: boolean;
  microNoise: boolean;
  guillocheCurves: boolean;
  moireInterference: boolean;
  steganographicMicroprint: boolean;
  subtleEmboss: boolean;
  /** Símbolos «@» diminutos dispuestos en clotoides que nacen en el centro del documento. */
  micropunteado: boolean;
  stampBorder: boolean;
  subtletyLevel: 'subtle' | 'balanced' | 'intense';
}

export interface DocumentItem {
  id: string;
  name: string;
  originalFile?: File;
  originalDataUrl: string;
  processedDataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  type: DocumentType;
  redactions: RedactionBox[];
  config: WatermarkConfig;
  status: 'idle' | 'processing' | 'done';
}

export interface VaultItem {
  id: string;
  name: string;
  type: DocumentType;
  date: string;
  timestamp: number;
  thumbnail: string;
  dataUrl: string;
  fileSizeFormatted: string;
  purpose: string;
}

/** Datos de un documento del Vault que se muestran en la lista (sin la imagen completa). */
export type VaultItemMeta = Omit<VaultItem, 'dataUrl'>;

export type SupportedLanguage = 'es' | 'en';
