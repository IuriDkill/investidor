import { todayValue, todayValueExplanation } from './inflation'

const normalize = (text: string) => text.replace(/[^\S\n]/g, ' ')

test('desconta a inflação do período', () => {
  expect(todayValue(1102.5, 0.05, 24)).toBeCloseTo(1000, 9)
  expect(todayValue(1000, 0, 60)).toBe(1000)
})

test('meses que não fecham um ano usam a fração do ano', () => {
  expect(todayValue(1000 * 1.1 ** 1.5, 0.1, 18)).toBeCloseTo(1000, 9)
})

test('explica a conta em fórmulas', () => {
  expect(normalize(todayValueExplanation(1102.5, 0.05, 24))).toBe(
    [
      'Em dinheiro de hoje = valor líquido ÷ (1 + IPCA) ^ anos',
      'R$ 1.102,50 ÷ (1 + 5%) ^ 2 = R$ 1.000,00',
      '',
      'Com inflação de 5% ao ano, é o que esse dinheiro compraria hoje.',
    ].join('\n'),
  )
})

test('anos fracionados aparecem com vírgula', () => {
  expect(normalize(todayValueExplanation(1000, 0.1, 18))).toContain('^ 1,5 =')
})
