// Taxas de referência: Selic e CDI (estimado) do Copom de 16/09/2026 e IPCA do Focus de 26/10/2026.
// Os 90% da LCI/LCA, os 120% da caixinha e os 7% de juro real são apenas exemplos.
export const RATE_DEFAULTS = {
  cdiAnnual: '13,65',
  cdbCdiPercent: '100',
  lciCdiPercent: '90',
  caixinhaCdiPercent: '120',
  selicAnnual: '13,75',
  ipcaAnnual: '5,2',
  realAnnual: '7',
  reference: 'outubro de 2026',
};

export const FIELD_LIMITS = {
  amountMax: 1_000_000_000,
  monthsMax: 600,
  appreciationMin: -99,
  percentMax: 100,
};
