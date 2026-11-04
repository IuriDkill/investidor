import { DEFAULT_TAX_RULES } from './assumptions'
import type { IrRates } from './finance'
import { simulateFixedIncome, type FixedIncomeInput } from './fixedIncome'
import { formatTerm, fixedTaxExplanation, variableTaxExplanation } from './taxExplanation'
import { simulateVariableIncome, type VariableIncomeInput } from './variableIncome'

const normalize = (text: string) => text.replace(/[^\S\n]/g, ' ')

const fixedBase: FixedIncomeInput = {
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
const explainFixed = (input: Partial<FixedIncomeInput>) => {
  const full = { ...fixedBase, ...input }
  return normalize(fixedTaxExplanation(full, simulateFixedIncome(full)))
}

test.each([
  [1, '1 mês'],
  [6, '6 meses'],
  [12, '1 ano'],
  [13, '1 ano e 1 mês'],
  [18, '1 ano e 6 meses'],
  [60, '5 anos'],
])('escreve o prazo de %i meses', (months, text) => {
  expect(formatTerm(months)).toBe(text)
})

test('CDB sem aportes mostra a fórmula com a alíquota do prazo', () => {
  expect(explainFixed({})).toBe(
    [
      'CDB · 1 ano (360 dias)',
      'Imposto = rendimento × alíquota',
      '',
      'Valor inicial: 360 dias',
      'R$ 120,00 × 20% = R$ 24,00',
    ].join('\n'),
  )
})

test('acima de 720 dias usa a menor alíquota', () => {
  expect(explainFixed({ product: 'tesouro-selic', months: 25 })).toContain(
    'Tesouro Selic · 2 anos e 1 mês (750 dias)',
  )
  expect(explainFixed({ product: 'tesouro-selic', months: 25 })).toContain('Valor inicial: 750 dias')
})

test('com aportes, mostra uma conta por faixa e o total', () => {
  const lines = explainFixed({ monthly: 100, months: 25 }).split('\n')
  expect(lines.slice(0, 3)).toEqual(['CDB · 2 anos e 1 mês (750 dias)', 'Imposto = rendimento × alíquota', ''])
  expect(lines[3]).toBe('Valor inicial: 750 dias')
  expect(lines[4]).toMatch(/^R\$ [\d.,]+ × 15% = R\$ [\d.,]+$/)
  expect(lines).toContain('12 aportes de 361 a 720 dias')
  expect(lines).toContain('6 aportes de 181 a 360 dias')
  expect(lines).toContain('7 aportes até 180 dias')
  expect(lines[lines.indexOf('12 aportes de 361 a 720 dias') + 1]).toMatch(/^R\$ [\d.,]+ × 17,5% = R\$ [\d.,]+$/)
  expect(lines[lines.indexOf('7 aportes até 180 dias') + 1]).toMatch(/^R\$ [\d.,]+ × 22,5% = R\$ [\d.,]+$/)
  expect(lines.at(-2)).toBe('')
  expect(lines.at(-1)).toMatch(/^Total = R\$ [\d.,]+ \([\d,]+% do rendimento de R\$ [\d.,]+\)$/)
})

test('cada faixa soma rendimento e imposto dos próprios aportes', () => {
  const full = { ...fixedBase, initial: 0, monthly: 100, months: 7 }
  const result = simulateFixedIncome(full)
  const lots = result.lots.filter((lot) => lot.kind === 'monthly')
  const gain = lots.reduce((sum, lot) => sum + lot.gain, 0)
  const tax = lots.reduce((sum, lot) => sum + lot.tax, 0)
  const brl = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  expect(normalize(fixedTaxExplanation(full, result))).toContain(`7 aportes até 180 dias\nR$ ${brl(gain)} × 22,5% = R$ ${brl(tax)}`)
})

test('sem valor inicial, não mostra a linha do valor inicial', () => {
  expect(explainFixed({ initial: 0, monthly: 100, months: 6 })).not.toContain('Valor inicial')
})

test('um único aporte fica no singular', () => {
  expect(explainFixed({ initial: 0, monthly: 100, months: 1 })).toContain('1 aporte até 180 dias')
})

test('LCI/LCA mostra que o imposto é zero', () => {
  expect(explainFixed({ product: 'lci-lca', cdiPercent: 0.9 })).toBe(
    [
      'LCI/LCA · 1 ano (360 dias)',
      'Isenta de imposto de renda para pessoa física',
      '',
      'Imposto = R$ 0,00',
      'Rendimento de R$ 108,00 fica inteiro com você',
    ].join('\n'),
  )
})

test('poupança mostra que o imposto é zero', () => {
  expect(explainFixed({ product: 'poupanca', selicAnnual: 0.06 })).toMatch(
    /^Poupança · 1 ano \(360 dias\)\nIsenta de imposto de renda\n\nImposto = R\$ 0,00\nRendimento de R\$ [\d.,]+ fica inteiro com você$/,
  )
})

test('caixinha avisa que foi tratada como CDB', () => {
  const text = explainFixed({ product: 'caixinha', cdiPercent: 1.2 })
  expect(text).toMatch(/^Caixinha · 1 ano/)
  expect(text.split('\n').at(-1)).toBe('Caixinha tratada como CDB; confira se a sua é isenta.')
})

test('usa as alíquotas das premissas', () => {
  const full = { ...fixedBase, rules: { ...DEFAULT_TAX_RULES, irRates: [0.3, 0.1, 0.1, 0.1] as IrRates } }
  expect(normalize(fixedTaxExplanation(full, simulateFixedIncome(full)))).toContain('R$ 120,00 × 10% = R$ 12,00')
})

const variableBase: VariableIncomeInput = {
  asset: 'acoes',
  initial: 30000,
  monthly: 0,
  months: 12,
  appreciationAnnual: 0.1,
  dividendAnnual: 0,
  reinvestDividends: false,
}
const explainVariable = (input: Partial<VariableIncomeInput>) => {
  const full = { ...variableBase, ...input }
  return normalize(variableTaxExplanation(full, simulateVariableIncome(full)))
}

test('ações acima do limite pagam sobre o lucro', () => {
  expect(explainVariable({})).toBe(
    [
      'Ações · venda de tudo depois de 1 ano',
      'Lucro = venda − custo',
      'R$ 33.000,00 − R$ 30.000,00 = R$ 3.000,00',
      '',
      'Venda de R$ 33.000,00 > limite de R$ 20.000,00',
      'Imposto = lucro × alíquota',
      'R$ 3.000,00 × 15% = R$ 450,00',
    ].join('\n'),
  )
})

test('ações dentro do limite ficam isentas', () => {
  expect(explainVariable({ initial: 10000 })).toBe(
    [
      'Ações · venda de tudo depois de 1 ano',
      'Lucro = venda − custo',
      'R$ 11.000,00 − R$ 10.000,00 = R$ 1.000,00',
      '',
      'Venda de R$ 11.000,00 ≤ limite de R$ 20.000,00',
      'Lucro isento: imposto = R$ 0,00',
    ].join('\n'),
  )
})

test('FIIs pagam sobre o lucro em qualquer valor', () => {
  expect(explainVariable({ asset: 'fiis', initial: 10000 })).toBe(
    [
      'FIIs · venda de tudo depois de 1 ano',
      'Lucro = venda − custo',
      'R$ 11.000,00 − R$ 10.000,00 = R$ 1.000,00',
      '',
      'FIIs não têm limite de isenção',
      'Imposto = lucro × alíquota',
      'R$ 1.000,00 × 20% = R$ 200,00',
    ].join('\n'),
  )
})

test('prejuízo não paga imposto', () => {
  expect(explainVariable({ asset: 'fiis', initial: 10000, appreciationAnnual: -0.2 })).toBe(
    [
      'FIIs · venda de tudo depois de 1 ano',
      'Lucro = venda − custo',
      'R$ 8.000,00 − R$ 10.000,00 = -R$ 2.000,00',
      '',
      'Prejuízo: imposto = R$ 0,00',
    ].join('\n'),
  )
})

test('dividendos aparecem como isentos', () => {
  expect(explainVariable({ initial: 12000, appreciationAnnual: 0, dividendAnnual: 0.12 }).split('\n').slice(-3)).toEqual([
    'Sem lucro na venda: imposto = R$ 0,00',
    '',
    'Dividendos de R$ 1.440,00: isentos',
  ])
})

test('a simulação informa o valor e o lucro da venda', () => {
  const r = simulateVariableIncome(variableBase)
  expect(r.saleValue).toBeCloseTo(33000, 6)
  expect(r.saleProfit).toBeCloseTo(3000, 6)
})
