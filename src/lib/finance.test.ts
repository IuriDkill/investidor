import { incomeTaxRate, monthlyRate } from './finance'

test('converte taxa anual em mensal equivalente', () => {
  expect(monthlyRate(0.12)).toBeCloseTo(0.0094888, 6)
})

test.each([
  [180, 0.225],
  [181, 0.2],
  [360, 0.2],
  [361, 0.175],
  [720, 0.175],
  [721, 0.15],
])('alíquota de IR em %i dias', (days, rate) => {
  expect(incomeTaxRate(days)).toBe(rate)
})
