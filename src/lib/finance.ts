import { DEFAULT_TAX_RULES } from './assumptions';

export type IrRates = [number, number, number, number];

export const monthlyRate = (annual: number) => Math.pow(1 + annual, 1 / 12) - 1;

// Tabela regressiva de IR da renda fixa.
export function incomeTaxRate(days: number, rates: IrRates = DEFAULT_TAX_RULES.irRates) {
  if (days <= 180) return rates[0];
  if (days <= 360) return rates[1];
  if (days <= 720) return rates[2];
  return rates[3];
}
