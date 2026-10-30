import { formatCompactCurrency, formatCurrency, formatPercent } from './format'

const normalize = (text: string) => text.replace(/\s/g, ' ')

test('formata moeda em pt-BR', () => {
  expect(normalize(formatCurrency(1096))).toBe('R$ 1.096,00')
  expect(normalize(formatCurrency(-2000))).toBe('-R$ 2.000,00')
})

test('abrevia moeda para o eixo do gráfico', () => {
  expect(normalize(formatCompactCurrency(20000))).toBe('R$ 20 mil')
  expect(normalize(formatCompactCurrency(1125))).toBe('R$ 1,13 mil')
})

test('formata decimal como percentual', () => {
  expect(formatPercent(0.1365)).toBe('13,65%')
})
