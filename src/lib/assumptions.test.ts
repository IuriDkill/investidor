import { ASSUMPTION_DEFAULTS } from '@/config/rates'
import { DEFAULT_ASSUMPTIONS, isAssumptionValid, parseAssumptions } from './assumptions'

test('converte os padrões em decimais', () => {
  expect(DEFAULT_ASSUMPTIONS.ipcaAnnual).toBeCloseTo(0.052, 10)
  expect(DEFAULT_ASSUMPTIONS).toMatchObject({
    cdiAnnual: 0.1365,
    selicAnnual: 0.1375,
    rules: {
      irRates: [0.225, 0.2, 0.175, 0.15],
      stockTaxRate: 0.15,
      fiiTaxRate: 0.2,
      stockExemptionLimit: 20000,
      savingsSelicThreshold: 0.085,
      savingsMonthlyAbove: 0.005,
      savingsSelicShare: 0.7,
    },
  })
})

test('um campo inválido invalida as premissas', () => {
  expect(parseAssumptions({ ...ASSUMPTION_DEFAULTS, cdiAnnual: '' })).toBeNull()
  expect(parseAssumptions({ ...ASSUMPTION_DEFAULTS, stockExemptionLimit: '-1' })).toBeNull()
})

test('valida cada campo pelo próprio limite', () => {
  expect(isAssumptionValid('irUpTo180', '101')).toBe(false)
  expect(isAssumptionValid('irUpTo180', '100')).toBe(true)
  expect(isAssumptionValid('stockExemptionLimit', '35.000')).toBe(true)
})
