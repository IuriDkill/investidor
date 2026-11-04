import { DEFAULT_TAX_RULES, type TaxRules } from './assumptions';
import { incomeTaxRate, monthlyRate } from './finance';

export type SimulationPoint = { month: number; invested: number; gross: number };

export type FixedIncomeProduct = 'cdb' | 'lci-lca' | 'caixinha' | 'tesouro-selic' | 'tesouro-ipca' | 'poupanca';

export type FixedIncomeInput = {
  product: FixedIncomeProduct;
  initial: number;
  monthly: number;
  months: number;
  cdiAnnual: number;
  cdiPercent: number;
  selicAnnual: number;
  ipcaAnnual: number;
  realAnnual: number;
  rules?: TaxRules;
};

// Uma aplicação: o valor inicial ou um aporte, com a idade em meses no resgate.
export type FixedIncomeLot = {
  kind: 'initial' | 'monthly';
  amount: number;
  age: number;
  gain: number;
  rate: number;
  tax: number;
};

export type FixedIncomeResult = {
  invested: number;
  grossGain: number;
  tax: number;
  net: number;
  lots: FixedIncomeLot[];
  series: SimulationPoint[];
};

function monthlyYield(input: FixedIncomeInput, rules: TaxRules) {
  switch (input.product) {
    case 'cdb':
    case 'lci-lca':
    case 'caixinha':
      return monthlyRate(input.cdiAnnual * input.cdiPercent);
    case 'tesouro-selic':
      return monthlyRate(input.selicAnnual);
    case 'tesouro-ipca':
      return monthlyRate((1 + input.ipcaAnnual) * (1 + input.realAnnual) - 1);
    case 'poupanca':
      return input.selicAnnual > rules.savingsSelicThreshold
        ? rules.savingsMonthlyAbove
        : (rules.savingsSelicShare * input.selicAnnual) / 12;
  }
}

export function simulateFixedIncome(input: FixedIncomeInput): FixedIncomeResult {
  const { product, initial, monthly, months, rules = DEFAULT_TAX_RULES } = input;
  const rate = monthlyYield(input, rules);
  const taxExempt = product === 'lci-lca' || product === 'poupanca';

  // Cada aplicação é um lote: a idade dele define a alíquota do seu rendimento.
  const lot = (kind: FixedIncomeLot['kind'], amount: number, age: number): FixedIncomeLot => {
    const gain = amount * (Math.pow(1 + rate, age) - 1);
    const lotRate = taxExempt ? 0 : incomeTaxRate(age * 30, rules.irRates);
    return { kind, amount, age, gain, rate: lotRate, tax: gain * lotRate };
  };

  const lots = [lot('initial', initial, months)];
  let invested = initial;
  let gross = initial;
  const series: SimulationPoint[] = [{ month: 0, invested, gross }];

  for (let month = 1; month <= months; month++) {
    gross = gross * (1 + rate) + monthly;
    invested += monthly;
    lots.push(lot('monthly', monthly, months - month));
    series.push({ month, invested, gross });
  }

  const tax = lots.reduce((sum, current) => sum + current.tax, 0);
  return { invested, grossGain: gross - invested, tax, net: gross - tax, lots, series };
}
