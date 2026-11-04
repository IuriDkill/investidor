import { DEFAULT_TAX_RULES } from './assumptions';
import { taxBracket } from './finance';
import type { FixedIncomeInput, FixedIncomeLot, FixedIncomeProduct, FixedIncomeResult } from './fixedIncome';
import { formatCurrency, formatPercent } from './format';
import type { VariableIncomeInput, VariableIncomeResult } from './variableIncome';

// Explicações do imposto em fórmulas, uma conta por linha, com os números da própria simulação.
// A caixa de explicação mostra as quebras de linha.

const PRODUCT_NAMES: Record<FixedIncomeProduct, string> = {
  cdb: 'CDB',
  'lci-lca': 'LCI/LCA',
  caixinha: 'Caixinha',
  'tesouro-selic': 'Tesouro Selic',
  'tesouro-ipca': 'Tesouro IPCA+',
  poupanca: 'Poupança',
};
const BRACKET_RANGES = ['até 180 dias', 'de 181 a 360 dias', 'de 361 a 720 dias', 'acima de 720 dias'];

const plural = (count: number, singular: string, many: string) => `${count} ${count === 1 ? singular : many}`;
const formatDays = (months: number) => `${(months * 30).toLocaleString('pt-BR')} dias`;
const formula = (gain: number, rate: number, tax: number) =>
  `${formatCurrency(gain)} × ${formatPercent(rate)} = ${formatCurrency(tax)}`;

export function formatTerm(months: number) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearText = years > 0 ? plural(years, 'ano', 'anos') : '';
  const monthText = rest > 0 ? plural(rest, 'mês', 'meses') : '';
  return [yearText, monthText].filter(Boolean).join(' e ');
}

const sum = (lots: FixedIncomeLot[], field: 'gain' | 'tax') => lots.reduce((total, lot) => total + lot[field], 0);

export function fixedTaxExplanation(input: FixedIncomeInput, result: FixedIncomeResult) {
  const { product, initial, monthly, months } = input;
  const header = `${PRODUCT_NAMES[product]} · ${formatTerm(months)} (${formatDays(months)})`;

  if (product === 'lci-lca' || product === 'poupanca') {
    const exemption =
      product === 'lci-lca' ? 'Isenta de imposto de renda para pessoa física' : 'Isenta de imposto de renda';
    return [
      header,
      exemption,
      '',
      `Imposto = ${formatCurrency(0)}`,
      `Rendimento de ${formatCurrency(result.grossGain)} fica inteiro com você`,
    ].join('\n');
  }

  const lines = [header, 'Imposto = rendimento × alíquota'];
  const [initialLot, ...monthlyLots] = result.lots;

  if (initial > 0) {
    lines.push(
      '',
      `Valor inicial: ${formatDays(months)}`,
      formula(initialLot.gain, initialLot.rate, initialLot.tax),
    );
  }

  if (monthly > 0) {
    // Do grupo que ficou mais tempo aplicado (menor alíquota) ao mais recente.
    for (const bracket of [3, 2, 1, 0]) {
      const group = monthlyLots.filter((lot) => taxBracket(lot.age * 30) === bracket);
      if (group.length === 0) continue;
      lines.push(
        '',
        `${plural(group.length, 'aporte', 'aportes')} ${BRACKET_RANGES[bracket]}`,
        formula(sum(group, 'gain'), group[0].rate, sum(group, 'tax')),
      );
    }

    const share = result.grossGain > 0 ? result.tax / result.grossGain : 0;
    lines.push(
      '',
      `Total = ${formatCurrency(result.tax)} (${formatPercent(share)} do rendimento de ${formatCurrency(result.grossGain)})`,
    );
  }

  if (product === 'caixinha') lines.push('', 'Caixinha tratada como CDB; confira se a sua é isenta.');
  return lines.join('\n');
}

// Lucros ou prejuízos abaixo de meio centavo contam como zero.
const CENT = 0.005;

export function variableTaxExplanation(input: VariableIncomeInput, result: VariableIncomeResult) {
  const { asset, months, rules = DEFAULT_TAX_RULES } = input;
  const profit = result.saleProfit;
  const cost = result.saleValue - profit;
  const lines = [
    `${asset === 'fiis' ? 'FIIs' : 'Ações'} · venda de tudo depois de ${formatTerm(months)}`,
    'Lucro = venda − custo',
    `${formatCurrency(result.saleValue)} − ${formatCurrency(cost)} = ${formatCurrency(profit)}`,
    '',
  ];

  if (profit < -CENT) {
    lines.push(`Prejuízo: imposto = ${formatCurrency(0)}`);
  } else if (profit <= CENT) {
    lines.push(`Sem lucro na venda: imposto = ${formatCurrency(0)}`);
  } else if (asset === 'fiis') {
    lines.push('FIIs não têm limite de isenção', 'Imposto = lucro × alíquota', formula(profit, rules.fiiTaxRate, result.tax));
  } else if (result.saleValue <= rules.stockExemptionLimit) {
    lines.push(
      `Venda de ${formatCurrency(result.saleValue)} ≤ limite de ${formatCurrency(rules.stockExemptionLimit)}`,
      `Lucro isento: imposto = ${formatCurrency(0)}`,
    );
  } else {
    lines.push(
      `Venda de ${formatCurrency(result.saleValue)} > limite de ${formatCurrency(rules.stockExemptionLimit)}`,
      'Imposto = lucro × alíquota',
      formula(profit, rules.stockTaxRate, result.tax),
    );
  }

  if (result.dividends > CENT) lines.push('', `Dividendos de ${formatCurrency(result.dividends)}: isentos`);
  return lines.join('\n');
}
