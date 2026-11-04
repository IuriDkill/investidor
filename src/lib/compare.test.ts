import { DEFAULT_ASSUMPTIONS } from './assumptions'
import { compareVerdict, PRODUCT_LABELS, simulateChoice, type ProductChoice } from './compare'
import { simulateFixedIncome } from './fixedIncome'
import { simulateVariableIncome } from './variableIncome'

const base = { initial: 2000, monthly: 200, months: 60 }
const choice = (overrides: Partial<ProductChoice>): ProductChoice => ({
  product: 'cdb',
  cdiPercent: 1,
  realAnnual: 0.07,
  appreciationAnnual: 0,
  dividendAnnual: 0,
  reinvestDividends: true,
  ...overrides,
})
const { cdiAnnual, selicAnnual, ipcaAnnual, rules } = DEFAULT_ASSUMPTIONS

test('lista todos os produtos das duas abas', () => {
  expect(Object.values(PRODUCT_LABELS)).toEqual([
    'CDB',
    'LCI/LCA',
    'Caixinha',
    'Tesouro Selic',
    'Tesouro IPCA+',
    'Poupança',
    'Ações',
    'FIIs',
  ])
})

test('renda fixa usa a mesma simulação da aba de renda fixa', () => {
  const outcome = simulateChoice(choice({ product: 'lci-lca', cdiPercent: 0.9 }), base, DEFAULT_ASSUMPTIONS)
  const expected = simulateFixedIncome({
    ...base,
    product: 'lci-lca',
    cdiAnnual,
    cdiPercent: 0.9,
    selicAnnual,
    ipcaAnnual,
    realAnnual: 0.07,
    rules,
  })
  expect(outcome.net).toBe(expected.net)
  expect(outcome.series).toEqual(expected.series)
  expect(outcome.taxInfo).toMatch(/^LCI\/LCA · 5 anos/)
})

test('renda variável usa a mesma simulação da aba de renda variável', () => {
  const outcome = simulateChoice(
    choice({ product: 'fiis', appreciationAnnual: 0.08, dividendAnnual: 0.06, reinvestDividends: false }),
    base,
    DEFAULT_ASSUMPTIONS,
  )
  const expected = simulateVariableIncome({
    ...base,
    asset: 'fiis',
    appreciationAnnual: 0.08,
    dividendAnnual: 0.06,
    reinvestDividends: false,
    rules,
  })
  expect(outcome.net).toBe(expected.net)
  expect(outcome.tax).toBe(expected.tax)
  expect(outcome.taxInfo).toMatch(/^FIIs · venda de tudo/)
})

const normalize = (text: string) => text.replace(/\s/g, ' ')

test('o veredito diz quem termina com mais e quanto', () => {
  expect(normalize(compareVerdict({ label: 'X · CDB', net: 1000 }, { label: 'Y · LCI/LCA', net: 1100 }))).toBe(
    'Y · LCI/LCA termina com R$ 100,00 a mais que X · CDB, já descontado o imposto (10% a mais).',
  )
  expect(normalize(compareVerdict({ label: 'X · CDB', net: 1250 }, { label: 'Y · Poupança', net: 1000 }))).toBe(
    'X · CDB termina com R$ 250,00 a mais que Y · Poupança, já descontado o imposto (25% a mais).',
  )
})

test('diferença abaixo de meio centavo é empate', () => {
  expect(compareVerdict({ label: 'X · CDB', net: 1000 }, { label: 'Y · CDB', net: 1000.004 })).toBe(
    'X · CDB e Y · CDB terminam com o mesmo valor líquido.',
  )
})
