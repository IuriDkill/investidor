import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FixedIncomeTab from './FixedIncomeTab'

const card = (label: string) => screen.queryAllByText(label).find((element) => element.tagName === 'DT')?.parentElement
const field = (label: string) => screen.getByLabelText(label)
const choose = (product: string) => userEvent.selectOptions(field('Produto'), product)

const replace = async (label: string, text: string) => {
  await userEvent.clear(field(label))
  if (text) await userEvent.type(field(label), text)
}

test('mostra o resultado com os valores iniciais', () => {
  render(<FixedIncomeTab />)
  expect(card('Total investido')).toHaveTextContent('14.000,00')
  expect(card('Ganho bruto')).toBeInTheDocument()
  expect(card('Imposto')).toBeInTheDocument()
  expect(card('Valor líquido')).toBeInTheDocument()
})

test('a explicação vem antes do formulário', () => {
  render(<FixedIncomeTab />)
  const explanation = screen.getByRole('heading', { name: 'O que é renda fixa?' })
  expect(explanation.compareDocumentPosition(field('Valor inicial'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})

test('informa a data de referência das taxas', () => {
  render(<FixedIncomeTab />)
  expect(screen.getByText(/outubro de 2026/)).toBeInTheDocument()
})

test('indica os valores de exemplo', async () => {
  render(<FixedIncomeTab />)
  await choose('LCI/LCA')
  expect(screen.getByText(/90%.*exemplo/i)).toBeInTheDocument()
  await choose('Tesouro IPCA+')
  expect(screen.getByText(/7%.*exemplo/i)).toBeInTheDocument()
})

test.each([
  ['CDB', ['Percentual do CDI']],
  ['LCI/LCA', ['Percentual do CDI']],
  ['Caixinha', ['Percentual do CDI']],
  ['Tesouro Selic', []],
  ['Tesouro IPCA+', ['Juro real anual']],
  ['Poupança', []],
])('%s mostra só as próprias taxas', async (product, visible: string[]) => {
  render(<FixedIncomeTab />)
  await choose(product)
  for (const label of ['Percentual do CDI', 'Juro real anual']) {
    expect(screen.queryByLabelText(label) !== null).toBe(visible.includes(label))
  }
})

test('entrada incompleta mostra erro em vez de NaN', async () => {
  render(<FixedIncomeTab />)
  await replace('Valor inicial', '-')
  expect(field('Valor inicial')).toHaveAttribute('aria-invalid', 'true')
  expect(card('Valor líquido')).toBeUndefined()
  expect(document.body).not.toHaveTextContent('NaN')
})

test('valor inicial e aporte zerados ocultam o resultado', async () => {
  render(<FixedIncomeTab />)
  await replace('Valor inicial', '0')
  await replace('Aporte mensal', '0')
  expect(screen.getByText(/valor inicial ou um aporte/i)).toBeInTheDocument()
  expect(card('Valor líquido')).toBeUndefined()
})

test('taxa ainda sendo digitada continua calculando', async () => {
  render(<FixedIncomeTab />)
  await replace('Percentual do CDI', '13,')
  expect(card('Valor líquido')).toBeInTheDocument()
})

test.each([
  ['CDB', /CDI de 13,65%/],
  ['Tesouro Selic', /Selic de 13,75%/],
  ['Tesouro IPCA+', /IPCA de 5,2%/],
])('%s informa a taxa usada', async (product, note) => {
  render(<FixedIncomeTab />)
  await choose(product)
  expect(screen.getByText(note)).toBeInTheDocument()
})

test('premissas inválidas ocultam o resultado', () => {
  render(<FixedIncomeTab assumptions={null} />)
  expect(card('Valor líquido')).toBeUndefined()
  expect(screen.getByText(/Corrija os campos em Premissas/)).toBeInTheDocument()
})

test('prazo em anos fora do limite mostra erro', async () => {
  render(<FixedIncomeTab />)
  await replace('Prazo', '51')
  expect(field('Prazo')).toHaveAttribute('aria-invalid', 'true')
})

test('trocar de produto mantém o aporte', async () => {
  render(<FixedIncomeTab />)
  await replace('Aporte mensal', '350')
  await choose('Tesouro IPCA+')
  await choose('CDB')
  expect(field('Aporte mensal')).toHaveValue('350')
})

test('CDB e LCI/LCA guardam percentuais separados', async () => {
  render(<FixedIncomeTab />)
  expect(field('Percentual do CDI')).toHaveValue('100')
  await choose('LCI/LCA')
  expect(field('Percentual do CDI')).toHaveValue('90')
  await replace('Percentual do CDI', '95')
  await choose('CDB')
  expect(field('Percentual do CDI')).toHaveValue('100')
})

test('caixinha começa com 120% do CDI de exemplo e aceita outro valor', async () => {
  render(<FixedIncomeTab />)
  await choose('Caixinha')
  expect(field('Percentual do CDI')).toHaveValue('120')
  expect(screen.getByText(/120%.*exemplo/i)).toBeInTheDocument()
  await replace('Percentual do CDI', '105')
  await choose('CDB')
  await choose('Caixinha')
  expect(field('Percentual do CDI')).toHaveValue('105')
})

test('caixinha paga imposto', async () => {
  render(<FixedIncomeTab />)
  await choose('Caixinha')
  expect(card('Imposto')).not.toHaveTextContent(/R\$\s0,00/)
})

test('LCI/LCA não mostra imposto', async () => {
  render(<FixedIncomeTab />)
  await choose('LCI/LCA')
  expect(card('Imposto')).toHaveTextContent('0,00')
})

test.each(['Produto', 'Valor inicial', 'Aporte mensal', 'Prazo', 'Percentual do CDI', 'Total investido', 'Ganho bruto', 'Imposto', 'Valor líquido'])(
  'explica %s',
  (label) => {
    render(<FixedIncomeTab />)
    expect(screen.getByRole('button', { name: `Explicação sobre ${label}` })).toBeInTheDocument()
  },
)

test('explica o juro real do Tesouro IPCA+', async () => {
  render(<FixedIncomeTab />)
  await choose('Tesouro IPCA+')
  expect(screen.getByRole('button', { name: 'Explicação sobre Juro real anual' })).toBeInTheDocument()
})

const taxInfo = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Explicação sobre Imposto' }))
  return screen.getByRole('note').textContent
}

test('o imposto explica o valor inicial e os aportes do prazo escolhido', async () => {
  render(<FixedIncomeTab />)
  const text = await taxInfo()
  expect(text).toMatch(/^CDB · 5 anos \(1\.800 dias\)\nImposto = rendimento × alíquota\n/)
  expect(text).toContain('Valor inicial: 1.800 dias')
  expect(text).toContain('35 aportes acima de 720 dias')
  expect(text).toMatch(/\nTotal = R\$\s[\d.,]+ /)
})

test('o imposto acompanha o produto e o prazo', async () => {
  render(<FixedIncomeTab />)
  await choose('Tesouro Selic')
  await replace('Aporte mensal', '0')
  await replace('Prazo', '1')
  expect(await taxInfo()).toMatch(
    /^Tesouro Selic · 1 ano \(360 dias\)\nImposto = rendimento × alíquota\n\nValor inicial: 360 dias\nR\$\s[\d.,]+ × 20% = R\$\s[\d.,]+$/,
  )
})

test('o imposto da LCI/LCA explica a isenção', async () => {
  render(<FixedIncomeTab />)
  await choose('LCI/LCA')
  expect(await taxInfo()).toMatch(/^LCI\/LCA · 5 anos \(1\.800 dias\)\nIsenta de imposto de renda/)
})
