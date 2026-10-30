import { ASSUMPTION_DEFAULTS, FIELD_LIMITS, type AssumptionKey, type AssumptionValues } from '@/config/rates';
import type { IrRates } from './finance';
import { parseInRange } from './validate';

export type TaxRules = {
  irRates: IrRates;
  stockTaxRate: number;
  fiiTaxRate: number;
  stockExemptionLimit: number;
  savingsSelicThreshold: number;
  savingsMonthlyAbove: number;
  savingsSelicShare: number;
};

export type Assumptions = {
  cdiAnnual: number;
  selicAnnual: number;
  ipcaAnnual: number;
  rules: TaxRules;
};

const parseField = (key: AssumptionKey, text: string) => {
  if (key === 'stockExemptionLimit') return parseInRange(text, 0, FIELD_LIMITS.amountMax);

  const percent = parseInRange(text, 0, FIELD_LIMITS.percentMax);
  return percent === null ? null : percent / 100;
};

export const isAssumptionValid = (key: AssumptionKey, text: string) => parseField(key, text) !== null;

export function parseAssumptions(values: AssumptionValues): Assumptions | null {
  const keys = Object.keys(values) as AssumptionKey[];
  if (!keys.every((key) => isAssumptionValid(key, values[key]))) return null;

  const read = (key: AssumptionKey) => parseField(key, values[key]) as number;
  return {
    cdiAnnual: read('cdiAnnual'),
    selicAnnual: read('selicAnnual'),
    ipcaAnnual: read('ipcaAnnual'),
    rules: {
      irRates: [read('irUpTo180'), read('irUpTo360'), read('irUpTo720'), read('irAbove720')],
      stockTaxRate: read('stockTaxRate'),
      fiiTaxRate: read('fiiTaxRate'),
      stockExemptionLimit: read('stockExemptionLimit'),
      savingsSelicThreshold: read('savingsSelicThreshold'),
      savingsMonthlyAbove: read('savingsMonthlyAbove'),
      savingsSelicShare: read('savingsSelicShare'),
    },
  };
}

export const DEFAULT_ASSUMPTIONS = parseAssumptions(ASSUMPTION_DEFAULTS) as Assumptions;
export const DEFAULT_TAX_RULES = DEFAULT_ASSUMPTIONS.rules;
