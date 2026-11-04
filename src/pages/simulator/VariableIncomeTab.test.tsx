import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VariableIncomeTab from './VariableIncomeTab'

const card = (label: string) => screen.queryAllByText(label).find((element) => element.tagName === 'DT')?.parentElement
const field = (label: string) => screen.getByLabelText(label)
const APPRECIATION = 'Valorização anual esperada'
const DIVIDENDS = 'Dividendos anuais esperados'

const fill = async (appreciation: string, dividends: string) => {
  await userEvent.type(field(APPRECIATION), appreciation)
  await userEvent.type(field(DIVIDENDS), dividends)
}

test('pede o cenário antes de mostrar resultado', () => {
  render(<VariableIncomeTab />)
  expect(field(APPRECIATION)).toHaveValue('')
  expect(field(DIVIDENDS)).toHaveValue('')
  expect(screen.getByText(/preencha.*valorização.*dividendos/i)).toBeInTheDocument()
  expect(card('Valor líquido')).toBeUndefined()
})

test('mostra o resultado depois de preenchido', async () => {
  render(<VariableIncomeTab />)
  await fill('8', '6')
  expect(card('Total investido')).toHaveTextContent('14.000,00')
  expect(card('Ganho bruto')).toBeInTheDocument()
  expect(card('Imposto')).toBeInTheDocument()
  expect(card('Valor líquido')).toBeInTheDocument()
  expect(screen.getByText(/de valorização/)).toBeInTheDocument()
  expect(screen.getByText(/de dividendos/)).toBeInTheDocument()
})

test('uma perda aparece como negativa', async () => {
  render(<VariableIncomeTab />)
  await fill('-20', '0')
  expect(card('Perda bruta')).toHaveTextContent('-R$')
  expect(card('Ganho bruto')).toBeUndefined()
})

test.each([
  [APPRECIATION, '-100'],
  [DIVIDENDS, '101'],
])('%s rejeita %s', async (label, text) => {
  render(<VariableIncomeTab />)
  await userEvent.type(field(label), text)
  expect(field(label)).toHaveAttribute('aria-invalid', 'true')
})

test('a valorização abre um teclado com sinal de menos', () => {
  render(<VariableIncomeTab />)
  expect(field(APPRECIATION)).toHaveAttribute('inputmode', 'text')
  expect(field(DIVIDENDS)).toHaveAttribute('inputmode', 'decimal')
})

test('sinal de menos sozinho não vira NaN', async () => {
  render(<VariableIncomeTab />)
  await fill('-', '6')
  expect(document.body).not.toHaveTextContent('NaN')
  expect(card('Valor líquido')).toBeUndefined()
})

test('trocar de ações para FIIs mantém os campos', async () => {
  render(<VariableIncomeTab />)
  await fill('8', '6')
  await userEvent.selectOptions(field('Ativo'), 'FIIs')
  expect(field(APPRECIATION)).toHaveValue('8')
  expect(field(DIVIDENDS)).toHaveValue('6')
})

test('FIIs pagam imposto onde ações ficam isentas', async () => {
  render(<VariableIncomeTab />)
  await fill('8', '0')
  expect(card('Imposto')).toHaveTextContent(/R\$\s0,00/)
  await userEvent.selectOptions(field('Ativo'), 'FIIs')
  expect(card('Imposto')).toHaveTextContent(/R\$/)
  expect(card('Imposto')).not.toHaveTextContent(/R\$\s0,00/)
})

test('reinvestir dividendos começa ligado e muda o resultado', async () => {
  render(<VariableIncomeTab />)
  await fill('8', '6')
  const reinvest = field('Reinvestir dividendos')
  expect(reinvest).toBeChecked()
  const before = card('Valor líquido')?.textContent
  await userEvent.click(reinvest)
  expect(card('Valor líquido')?.textContent).not.toBe(before)
})

test('a explicação vem antes do formulário', () => {
  render(<VariableIncomeTab />)
  const explanation = screen.getByRole('heading', { name: 'O que é renda variável?' })
  expect(explanation.compareDocumentPosition(field('Valor inicial'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})

test.each(['Ativo', 'Valorização anual esperada', 'Dividendos anuais esperados', 'Reinvestir dividendos'])(
  'explica %s',
  (label) => {
    render(<VariableIncomeTab />)
    expect(screen.getByRole('button', { name: `Explicação sobre ${label}` })).toBeInTheDocument()
  },
)

test('explica a perda bruta', async () => {
  render(<VariableIncomeTab />)
  await fill('-20', '0')
  expect(screen.getByRole('button', { name: 'Explicação sobre Perda bruta' })).toBeInTheDocument()
})

const taxInfo = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Explicação sobre Imposto' }))
  return screen.getByRole('note').textContent
}

test('o imposto de ações compara a venda com o limite de isenção', async () => {
  render(<VariableIncomeTab />)
  await fill('8', '0')
  expect(await taxInfo()).toMatch(/^Ações · venda de tudo depois de 5 anos\n[\s\S]*≤ limite de R\$\s20\.000,00\nLucro isento/)
})

test('o imposto de FIIs explica que não há limite', async () => {
  render(<VariableIncomeTab />)
  await fill('8', '0')
  await userEvent.selectOptions(field('Ativo'), 'FIIs')
  expect(await taxInfo()).toContain('FIIs não têm limite de isenção\nImposto = lucro × alíquota')
})
