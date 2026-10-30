export const monthlyRate = (annual: number) => Math.pow(1 + annual, 1 / 12) - 1;

// Tabela regressiva de IR da renda fixa.
export function incomeTaxRate(days: number) {
  if (days <= 180) return 0.225;
  if (days <= 360) return 0.2;
  if (days <= 720) return 0.175;
  return 0.15;
}
