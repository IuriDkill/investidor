import { formatCurrency, formatPercent } from './format';

// Quanto um valor futuro compraria hoje, descontada a inflação (IPCA) do período.
export const todayValue = (value: number, ipcaAnnual: number, months: number) =>
  value / Math.pow(1 + ipcaAnnual, months / 12);

const formatYears = (months: number) =>
  (months / 12).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export function todayValueExplanation(value: number, ipcaAnnual: number, months: number) {
  return [
    'Em dinheiro de hoje = valor líquido ÷ (1 + IPCA) ^ anos',
    `${formatCurrency(value)} ÷ (1 + ${formatPercent(ipcaAnnual)}) ^ ${formatYears(months)} = ${formatCurrency(
      todayValue(value, ipcaAnnual, months),
    )}`,
    '',
    `Com inflação de ${formatPercent(ipcaAnnual)} ao ano, é o que esse dinheiro compraria hoje.`,
  ].join('\n');
}
