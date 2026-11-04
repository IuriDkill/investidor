import { DEFAULT_TAX_RULES } from './assumptions';

export type IrRates = [number, number, number, number];

export const monthlyRate = (annual: number) => Math.pow(1 + annual, 1 / 12) - 1;

// Faixa da tabela regressiva de IR da renda fixa: 0 (até 180 dias) a 3 (acima de 720 dias).
export function taxBracket(days: number) {
  if (days <= 180) return 0;
  if (days <= 360) return 1;
  if (days <= 720) return 2;
  return 3;
}

export function incomeTaxRate(days: number, rates: IrRates = DEFAULT_TAX_RULES.irRates) {
  return rates[taxBracket(days)];
}
