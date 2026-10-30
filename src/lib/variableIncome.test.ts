import { DEFAULT_TAX_RULES } from './assumptions'
import { saleTax, simulateVariableIncome, type VariableIncomeInput } from './variableIncome'

const base: VariableIncomeInput = {
  asset: 'acoes',
  initial: 12000,
  monthly: 0,
  months: 12,
  appreciationAnnual: 0,
  dividendAnnual: 0.12,
  reinvestDividends: false,
}

describe('saleTax', () => {
  test('ações até R$ 20 mil são isentas', () => {
    expect(saleTax('acoes', 20000, 15000)).toBe(0)
  })

  test('ações acima de R$ 20 mil pagam 15% do lucro', () => {
    expect(saleTax('acoes', 20000.01, 15000)).toBeCloseTo(750.0015, 4)
  })

  test('FIIs pagam 20% em qualquer valor', () => {
    expect(saleTax('fiis', 1000, 500)).toBeCloseTo(100, 6)
  })

  test('usa as regras informadas', () => {
    const rules = { ...DEFAULT_TAX_RULES, stockTaxRate: 0.1, fiiTaxRate: 0.3, stockExemptionLimit: 500 }
    expect(saleTax('acoes', 1000, 500, rules)).toBeCloseTo(50, 6)
    expect(saleTax('acoes', 500, 400, rules)).toBe(0)
    expect(saleTax('fiis', 1000, 500, rules)).toBeCloseTo(150, 6)
  })

  test('prejuízo não paga imposto', () => {
    expect(saleTax('acoes', 30000, 40000)).toBe(0)
    expect(saleTax('fiis', 900, 1000)).toBe(0)
  })
})

test('dividendos sem reinvestimento ficam em caixa', () => {
  const r = simulateVariableIncome(base)
  expect(r.dividends).toBeCloseTo(1440, 6)
  expect(r.grossGain).toBeCloseTo(1440, 6)
  expect(r.tax).toBe(0)
  expect(r.net).toBeCloseTo(13440, 6)
})

test('dividendos reinvestidos entram no custo e não geram imposto', () => {
  const r = simulateVariableIncome({ ...base, asset: 'fiis', reinvestDividends: true })
  expect(r.net).toBeCloseTo(12000 * 1.01 ** 12, 6)
  expect(r.tax).toBeCloseTo(0, 6)
})

test('perda em FIIs não paga imposto', () => {
  const r = simulateVariableIncome({
    ...base,
    asset: 'fiis',
    initial: 10000,
    dividendAnnual: 0,
    appreciationAnnual: -0.2,
  })
  expect(r.net).toBeCloseTo(8000, 6)
  expect(r.grossGain).toBeCloseTo(-2000, 6)
  expect(r.appreciationGain).toBeCloseTo(-2000, 6)
  expect(r.tax).toBe(0)
})

test('a simulação repassa as regras', () => {
  const rules = { ...DEFAULT_TAX_RULES, stockTaxRate: 0.1 }
  const r = simulateVariableIncome({
    ...base,
    initial: 30000,
    dividendAnnual: 0,
    appreciationAnnual: 0.1,
    rules,
  })
  expect(r.tax).toBeCloseTo(300, 6)
})

test('ganho em ações acima do limite paga imposto', () => {
  const r = simulateVariableIncome({ ...base, initial: 30000, dividendAnnual: 0, appreciationAnnual: 0.1 })
  expect(r.tax).toBeCloseTo(450, 6)
})

test('o aporte entra no fim do mês', () => {
  const r = simulateVariableIncome({
    ...base,
    initial: 0,
    monthly: 100,
    months: 1,
    appreciationAnnual: 0.12,
    dividendAnnual: 0.12,
  })
  expect(r.net).toBeCloseTo(100, 6)
  expect(r.grossGain).toBeCloseTo(0, 6)
})

test('os dividendos incidem sobre a posição já valorizada', () => {
  const r = simulateVariableIncome({ ...base, initial: 1000, months: 1, appreciationAnnual: 0.12 })
  expect(r.dividends).toBeCloseTo(1000 * 1.12 ** (1 / 12) * 0.01, 6)
})

test('a série soma posição e caixa', () => {
  const r = simulateVariableIncome(base)
  expect(r.series).toHaveLength(13)
  expect(r.series[0]).toEqual({ month: 0, invested: 12000, gross: 12000 })
  expect(r.series[12].gross).toBeCloseTo(13440, 6)
})

test('prazo de 600 meses com alta valorização', () => {
  const r = simulateVariableIncome({ ...base, months: 600, appreciationAnnual: 1 })
  expect(Number.isFinite(r.net)).toBe(true)
})
