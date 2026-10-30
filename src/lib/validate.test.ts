import { parseDecimal, parseInRange, toMonths } from './validate'

test.each([
  ['1.000,50', 1000.5],
  ['1.000', 1000],
  ['1.000.000', 1000000],
  ['13,65', 13.65],
  ['13.65', 13.65],
  ['1000.5', 1000.5],
  ['13,', 13],
  [' 200 ', 200],
  ['-5', -5],
])('interpreta %s', (text, value) => {
  expect(parseDecimal(text)).toBe(value)
})

test.each([
  ['0.050', 0.05],
  ['0.100', 0.1],
  ['0.500', 0.5],
])('%s não é separador de milhar', (text, value) => {
  expect(parseDecimal(text)).toBe(value)
})

test.each(['', '-', 'abc', '1,2,3', '1,000.50', '1.00,50', '1.5,5'])('rejeita "%s"', (text) => {
  expect(parseDecimal(text)).toBeNull()
})

test('aplica os limites do intervalo', () => {
  expect(parseInRange('101', 0, 100)).toBeNull()
  expect(parseInRange('100', 0, 100)).toBe(100)
})

test('converte o prazo em meses', () => {
  expect(toMonths('1,5', 'years')).toBe(18)
  expect(toMonths('5', 'years')).toBe(60)
  expect(toMonths('50', 'years')).toBe(600)
})

test.each([
  ['51', 'years'],
  ['601', 'months'],
  ['0', 'months'],
  ['1,5', 'months'],
  ['0,01', 'years'],
] as const)('rejeita o prazo %s em %s', (text, unit) => {
  expect(toMonths(text, unit)).toBeNull()
})
