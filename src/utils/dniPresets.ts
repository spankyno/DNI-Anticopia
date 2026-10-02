import { RedactionBox, DocumentType, RedactionStyle } from '../types';

export function getPresetRedactions(type: DocumentType, style: RedactionStyle = 'solid_black'): RedactionBox[] {
  switch (type) {
    case 'dni_front':
      return [
        {
          id: 'preset-dni-signature',
          label: 'Firma del Titular',
          x: 10,
          y: 68,
          width: 30,
          height: 18,
          style,
        },
        {
          id: 'preset-dni-support',
          label: 'Nº Soporte (IDESP)',
          x: 48,
          y: 14,
          width: 28,
          height: 12,
          style,
        },
      ];

    case 'dni_back':
      return [
        {
          id: 'preset-dni-mrz',
          label: 'Zona Lectura Mecánica (MRZ)',
          x: 3,
          y: 67,
          width: 94,
          height: 30,
          style,
        },
        {
          id: 'preset-dni-fingerprint',
          label: 'Datos de Expedición / CAN',
          x: 72,
          y: 18,
          width: 24,
          height: 42,
          style,
        },
      ];

    case 'passport':
      return [
        {
          id: 'preset-passport-mrz',
          label: 'Zona MRZ Pasaporte',
          x: 4,
          y: 73,
          width: 92,
          height: 24,
          style,
        },
        {
          id: 'preset-passport-number',
          label: 'Nº Libreta / Documento',
          x: 68,
          y: 10,
          width: 28,
          height: 11,
          style,
        },
        {
          id: 'preset-passport-sig',
          label: 'Firma del Titular',
          x: 8,
          y: 54,
          width: 32,
          height: 16,
          style,
        },
      ];

    case 'payslip':
    case 'invoice':
      return [
        {
          id: 'preset-iban',
          label: 'Cuenta Bancaria / IBAN',
          x: 10,
          y: 80,
          width: 50,
          height: 10,
          style,
        },
      ];

    default:
      return [];
  }
}
