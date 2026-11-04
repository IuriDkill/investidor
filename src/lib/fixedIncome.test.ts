import { DEFAULT_TAX_RULES } from './assumptions'
import type { IrRates } from './finance'
import { simulateFixedIncome, type FixedIncomeInput } from './fixedIncome'

const base: FixedIncomeInput = {
  product: 'cdb',
  initial: 1000,
  monthly: 0,
  months: 12,
  cdiAnnual: 0.12,
  cdiPercent: 1,
  selicAnnual: 0.12,
  ipcaAnnual: 0.05,
  realAnnual: 0.07,
}

test('exemplo da spec', () => {
  const r = simulateFixedIncome(base)
  expect(r.invested).toBe(1000)
  expect(r.grossGain).toBeCloseTo(120, 6)
  expect(r.tax).toBeCloseTo(24, 6)
  expect(r.net).toBeCloseTo(1096, 6)
})

test.each([
  [6, 0.225],
  [7, 0.2],
  [12, 0.2],
  [13, 0.175],
  [24, 0.175],
  [25, 0.15],
])('fronteira do IR em %i meses', (months, rate) => {
  const r = simulateFixedIncome({ ...base, months })
  expect(r.tax).toBeCloseTo(r.grossGain * rate, 6)
})

test('cada lote tem a própria alíquota', () => {
  const r = simulateFixedIncome({ ...base, monthly: 1000, months: 7 })
  const i = 1.12 ** (1 / 12) - 1
  let expected = 1000 * ((1 + i) ** 7 - 1) * 0.2
  for (let age = 1; age <= 6; age++) expected += 1000 * ((1 + i) ** age - 1) * 0.225
  expect(r.tax).toBeCloseTo(expected, 6)
  expect(r.invested).toBe(8000)
})

test('LCI/LCA é isenta e usa o percentual do CDI', () => {
  const r = simulateFixedIncome({ ...base, product: 'lci-lca', cdiPercent: 0.9 })
  expect(r.tax).toBe(0)
  expect(r.net).toBeCloseTo(1000 * (1 + 0.12 * 0.9), 6)
})

test.each([
  [0.1375, 1.005],
  [0.06, 1.0035],
  [0.085, 1 + (0.7 * 0.085) / 12],
])('poupança com Selic de %d', (selicAnnual, factor) => {
  const r = simulateFixedIncome({ ...base, product: 'poupanca', selicAnnual })
  expect(r.tax).toBe(0)
  expect(r.net).toBeCloseTo(1000 * factor ** 12, 6)
})

test('caixinha rende o percentual do CDI e paga IR como o CDB', () => {
  const r = simulateFixedIncome({ ...base, product: 'caixinha', cdiPercent: 1.2 })
  expect(r.grossGain).toBeCloseTo(144, 6)
  expect(r.tax).toBeCloseTo(28.8, 6)
  expect(r.net).toBeCloseTo(1115.2, 6)
})

test('usa as alíquotas de IR das regras', () => {
  const rules = { ...DEFAULT_TAX_RULES, irRates: [0.5, 0.1, 0.1, 0.1] as IrRates }
  const r = simulateFixedIncome({ ...base, months: 6, rules })
  expect(r.tax).toBeCloseTo(r.grossGain * 0.5, 6)
})

test('usa a regra de poupança acima do corte', () => {
  const rules = { ...DEFAULT_TAX_RULES, savingsMonthlyAbove: 0.01 }
  const r = simulateFixedIncome({ ...base, product: 'poupanca', selicAnnual: 0.1375, rules })
  expect(r.net).toBeCloseTo(1000 * 1.01 ** 12, 6)
})

test('usa a regra de poupança até o corte', () => {
  const rules = { ...DEFAULT_TAX_RULES, savingsSelicThreshold: 0.2, savingsSelicShare: 0.5 }
  const r = simulateFixedIncome({ ...base, product: 'poupanca', selicAnnual: 0.12, rules })
  expect(r.net).toBeCloseTo(1000 * 1.005 ** 12, 6)
})

test('Tesouro IPCA+ compõe inflação e juro real', () => {
  const r = simulateFixedIncome({ ...base, product: 'tesouro-ipca' })
  expect(r.grossGain).toBeCloseTo(123.5, 6)
})

test('Tesouro Selic usa a Selic e paga IR', () => {
  const r = simulateFixedIncome({ ...base, product: 'tesouro-selic', cdiAnnual: 0, selicAnnual: 0.1 })
  expect(r.grossGain).toBeCloseTo(100, 6)
  expect(r.tax).toBeCloseTo(20, 6)
})

test('prazo de 1 mês usa a maior alíquota', () => {
  const r = simulateFixedIncome({ ...base, months: 1 })
  expect(r.tax).toBeCloseTo(r.grossGain * 0.225, 6)
})

test('prazo de 600 meses com aporte', () => {
  const r = simulateFixedIncome({ ...base, monthly: 200, months: 600 })
  expect(Number.isFinite(r.net)).toBe(true)
  expect(r.series).toHaveLength(601)
})

test('a série vai do valor inicial ao patrimônio bruto', () => {
  const r = simulateFixedIncome({ ...base, monthly: 100 })
  expect(r.series[0]).toEqual({ month: 0, invested: 1000, gross: 1000 })
  const last = r.series[r.series.length - 1]
  expect(last.invested).toBe(r.invested)
  expect(last.gross).toBeCloseTo(r.invested + r.grossGain, 6)
})

test('informa rendimento e imposto de cada aplicação', () => {
  const r = simulateFixedIncome({ ...base, monthly: 100, months: 7 })
  expect(r.lots).toHaveLength(8)
  expect(r.lots[0]).toMatchObject({ kind: 'initial', amount: 1000, age: 7, rate: 0.2 })
  expect(r.lots[1]).toMatchObject({ kind: 'monthly', amount: 100, age: 6, rate: 0.225 })
  expect(r.lots[7]).toMatchObject({ kind: 'monthly', age: 0, gain: 0, tax: 0 })
  expect(r.lots.reduce((sum, lot) => sum + lot.tax, 0)).toBeCloseTo(r.tax, 9)
  expect(r.lots.reduce((sum, lot) => sum + lot.gain, 0)).toBeCloseTo(r.grossGain, 9)
})

test('aplicações isentas têm alíquota zero', () => {
  const r = simulateFixedIncome({ ...base, product: 'lci-lca' })
  expect(r.lots[0]).toMatchObject({ rate: 0, tax: 0 })
})

test('o último aporte não rende', () => {
  const r = simulateFixedIncome({ ...base, initial: 0, monthly: 100, months: 1 })
  expect(r.grossGain).toBeCloseTo(0, 6)
})
