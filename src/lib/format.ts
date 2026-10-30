const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 });

export const formatCurrency = (value: number) => currency.format(value);
export const formatPercent = (value: number) => percent.format(value);

const compactCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 2,
});

export const formatCompactCurrency = (value: number) => compactCurrency.format(value);
