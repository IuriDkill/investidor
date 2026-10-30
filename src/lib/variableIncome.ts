import { DEFAULT_TAX_RULES, type TaxRules } from './assumptions';
import { monthlyRate } from './finance';
import type { SimulationPoint } from './fixedIncome';

export type VariableAsset = 'acoes' | 'fiis';

export type VariableIncomeInput = {
  asset: VariableAsset;
  initial: number;
  monthly: number;
  months: number;
  appreciationAnnual: number;
  dividendAnnual: number;
  reinvestDividends: boolean;
  rules?: TaxRules;
};

export type VariableIncomeResult = {
  invested: number;
  grossGain: number;
  tax: number;
  net: number;
  appreciationGain: number;
  dividends: number;
  series: SimulationPoint[];
};

export function saleTax(asset: VariableAsset, position: number, cost: number, rules = DEFAULT_TAX_RULES) {
  const profit = position - cost;
  if (profit <= 0) return 0;
  if (asset === 'fiis') return profit * rules.fiiTaxRate;
  return position > rules.stockExemptionLimit ? profit * rules.stockTaxRate : 0;
}

export function simulateVariableIncome(input: VariableIncomeInput): VariableIncomeResult {
  const { asset, initial, monthly, months, appreciationAnnual, dividendAnnual, reinvestDividends, rules } = input;
  const rate = monthlyRate(appreciationAnnual);

  let position = initial;
  let cost = initial;
  let cash = 0;
  let invested = initial;
  let appreciationGain = 0;
  let dividends = 0;
  const series: SimulationPoint[] = [{ month: 0, invested, gross: initial }];

  for (let month = 1; month <= months; month++) {
    const appreciation = position * rate;
    position += appreciation;
    appreciationGain += appreciation;

    const dividend = (position * dividendAnnual) / 12;
    dividends += dividend;
    if (reinvestDividends) {
      position += dividend;
      cost += dividend;
    } else {
      cash += dividend;
    }

    position += monthly;
    cost += monthly;
    invested += monthly;
    series.push({ month, invested, gross: position + cash });
  }

  const gross = position + cash;
  const tax = saleTax(asset, position, cost, rules);
  return { invested, grossGain: gross - invested, tax, net: gross - tax, appreciationGain, dividends, series };
}
