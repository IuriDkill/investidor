// Taxas de referência: Selic e CDI (estimado) do Copom de 16/09/2026 e IPCA do Focus de 26/10/2026.
// Os 90% da LCI/LCA, os 120% da caixinha e os 7% de juro real são apenas exemplos.
export const RATE_DEFAULTS = {
  cdbCdiPercent: '100',
  lciCdiPercent: '90',
  caixinhaCdiPercent: '120',
  realAnnual: '7',
  reference: 'outubro de 2026',
};

// Padrões do painel Premissas. As regras de imposto seguem o que valia em outubro de 2026.
export const ASSUMPTION_DEFAULTS = {
  cdiAnnual: '13,65',
  selicAnnual: '13,75',
  ipcaAnnual: '5,2',
  irUpTo180: '22,5',
  irUpTo360: '20',
  irUpTo720: '17,5',
  irAbove720: '15',
  stockTaxRate: '15',
  fiiTaxRate: '20',
  stockExemptionLimit: '20.000',
  savingsSelicThreshold: '8,5',
  savingsMonthlyAbove: '0,5',
  savingsSelicShare: '70',
};

export type AssumptionValues = typeof ASSUMPTION_DEFAULTS;
export type AssumptionKey = keyof AssumptionValues;

export const FIELD_LIMITS = {
  amountMax: 1_000_000_000,
  monthsMax: 600,
  appreciationMin: -99,
  percentMax: 100,
};
