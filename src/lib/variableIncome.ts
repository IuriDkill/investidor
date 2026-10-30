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

const STOCK_EXEMPTION_LIMIT = 20000;
const STOCK_TAX_RATE = 0.15;
const FII_TAX_RATE = 0.2;

export function saleTax(asset: VariableAsset, position: number, cost: number) {
  const profit = position - cost;
  if (profit <= 0) return 0;
  if (asset === 'fiis') return profit * FII_TAX_RATE;
  return position > STOCK_EXEMPTION_LIMIT ? profit * STOCK_TAX_RATE : 0;
}

export function simulateVariableIncome(input: VariableIncomeInput): VariableIncomeResult {
  const { asset, initial, monthly, months, appreciationAnnual, dividendAnnual, reinvestDividends } = input;
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
  const tax = saleTax(asset, position, cost);
  return { invested, grossGain: gross - invested, tax, net: gross - tax, appreciationGain, dividends, series };
}
