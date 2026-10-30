import { FIELD_LIMITS } from '@/config/rates';

export type TermUnit = 'months' | 'years';

const THOUSANDS = /^-?[1-9]\d{0,2}(\.\d{3})+$/;
const DECIMAL_COMMA = /^-?(\d+|[1-9]\d{0,2}(\.\d{3})+),\d*$/;

export function parseDecimal(text: string) {
  let normalized = text.trim();
  if (normalized.includes(',')) {
    if (!DECIMAL_COMMA.test(normalized)) return null;
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (THOUSANDS.test(normalized)) {
    normalized = normalized.replace(/\./g, '');
  }
  return /^-?\d+(\.\d*)?$/.test(normalized) ? Number(normalized) : null;
}

export function parseInRange(text: string, min: number, max: number) {
  const value = parseDecimal(text);
  return value !== null && value >= min && value <= max ? value : null;
}

export function toMonths(text: string, unit: TermUnit) {
  const value = parseDecimal(text);
  if (value === null) return null;
  if (unit === 'months' && !Number.isInteger(value)) return null;

  const months = unit === 'years' ? Math.round(value * 12) : value;
  return months >= 1 && months <= FIELD_LIMITS.monthsMax ? months : null;
}
