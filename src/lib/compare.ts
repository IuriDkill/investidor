import type { Assumptions } from './assumptions';
import { simulateFixedIncome, type FixedIncomeProduct, type SimulationPoint } from './fixedIncome';
import { formatCurrency, formatPercent } from './format';
import { todayValue, todayValueExplanation } from './inflation';
import { fixedTaxExplanation, variableTaxExplanation } from './taxExplanation';
import { simulateVariableIncome, type VariableAsset } from './variableIncome';

export type ProductId = FixedIncomeProduct | VariableAsset;

export const PRODUCT_LABELS: Record<ProductId, string> = {
  cdb: 'CDB',
  'lci-lca': 'LCI/LCA',
  caixinha: 'Caixinha',
  'tesouro-selic': 'Tesouro Selic',
  'tesouro-ipca': 'Tesouro IPCA+',
  poupanca: 'Poupança',
  acoes: 'Ações',
  fiis: 'FIIs',
};

export const isVariableProduct = (product: ProductId): product is VariableAsset =>
  product === 'acoes' || product === 'fiis';

// Taxas em decimal; cada produto usa só as que lhe dizem respeito.
export type ProductChoice = {
  product: ProductId;
  cdiPercent: number;
  realAnnual: number;
  appreciationAnnual: number;
  dividendAnnual: number;
  reinvestDividends: boolean;
};

export type CommonInput = { initial: number; monthly: number; months: number };

export type Outcome = {
  invested: number;
  grossGain: number;
  tax: number;
  net: number;
  series: SimulationPoint[];
  taxInfo: string;
  today: number;
  todayInfo: string;
};

const inToday = (net: number, base: CommonInput, assumptions: Assumptions) => ({
  today: todayValue(net, assumptions.ipcaAnnual, base.months),
  todayInfo: todayValueExplanation(net, assumptions.ipcaAnnual, base.months),
});

export function simulateChoice(choice: ProductChoice, base: CommonInput, assumptions: Assumptions): Outcome {
  const { product } = choice;
  const { rules } = assumptions;

  if (isVariableProduct(product)) {
    const input = {
      ...base,
      asset: product,
      appreciationAnnual: choice.appreciationAnnual,
      dividendAnnual: choice.dividendAnnual,
      reinvestDividends: choice.reinvestDividends,
      rules,
    };
    const result = simulateVariableIncome(input);
    return { ...result, taxInfo: variableTaxExplanation(input, result), ...inToday(result.net, base, assumptions) };
  }

  const input = {
    ...base,
    product,
    cdiAnnual: assumptions.cdiAnnual,
    cdiPercent: choice.cdiPercent,
    selicAnnual: assumptions.selicAnnual,
    ipcaAnnual: assumptions.ipcaAnnual,
    realAnnual: choice.realAnnual,
    rules,
  };
  const result = simulateFixedIncome(input);
  return { ...result, taxInfo: fixedTaxExplanation(input, result), ...inToday(result.net, base, assumptions) };
}

// Diferenças abaixo de meio centavo contam como empate.
const CENT = 0.005;

export function compareVerdict(x: { label: string; net: number }, y: { label: string; net: number }) {
  const difference = x.net - y.net;
  if (Math.abs(difference) < CENT) return `${x.label} e ${y.label} terminam com o mesmo valor líquido.`;

  const [winner, loser] = difference > 0 ? [x, y] : [y, x];
  const share = loser.net > 0 ? ` (${formatPercent(Math.abs(difference) / loser.net)} a mais)` : '';
  return (
    `${winner.label} termina com ${formatCurrency(Math.abs(difference))} a mais que ${loser.label}, ` +
    `já descontado o imposto${share}.`
  );
}
