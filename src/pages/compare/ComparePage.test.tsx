import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

beforeEach(() => {
  localStorage.clear()
})

const side = (order: number) => within(screen.getByRole('group', { name: new RegExp(`^${order}º`) }))
const choose = (order: number, product: string) => userEvent.selectOptions(side(order).getByLabelText('Produto'), product)
const verdict = () => screen.queryByRole('status')
const table = () => screen.queryByRole('table', { name: 'Comparação no fim do prazo' })
const headers = () => within(table()!).getAllByRole('columnheader')

const replace = async (input: HTMLElement, text: string) => {
  await userEvent.clear(input)
  await userEvent.type(input, text)
}

test('a explicação vem antes do formulário', () => {
  renderApp('/comparar')
  const heading = screen.getByRole('heading', { name: 'Comparar investimentos' })
  expect(heading.compareDocumentPosition(screen.getByLabelText('Valor inicial'))).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  )
})

test('começa comparando CDB com LCI/LCA, cada um pelo nome e pela taxa', () => {
  renderApp('/comparar')
  expect(side(1).getByLabelText('Produto')).toHaveValue('cdb')
  expect(side(2).getByLabelText('Produto')).toHaveValue('lci-lca')
  expect(screen.getByRole('group', { name: /^1º/ })).toHaveAccessibleName('1º CDB 100% do CDI')
  expect(screen.getByRole('group', { name: /^2º/ })).toHaveAccessibleName('2º LCI/LCA 90% do CDI')
  expect(headers()).toHaveLength(2)
  expect(headers()[0]).toHaveTextContent(/^CDB 100% do CDI$/)
  expect(headers()[1]).toHaveTextContent(/^LCI\/LCA 90% do CDI/)
  for (const row of ['Total investido', 'Ganho bruto', 'Imposto', 'Valor líquido']) {
    expect(within(table()!).getByRole('rowheader', { name: row })).toBeInTheDocument()
  }
  expect(verdict()).toHaveTextContent(/^LCI\/LCA 90% do CDI termina com R\$\s[\d.,]+ a mais que CDB 100% do CDI/)
  expect(document.body).not.toHaveTextContent(/Investimento [XY]|[XY] ·/)
})

test('cada lado mostra só os campos do próprio produto', async () => {
  renderApp('/comparar')
  await choose(2, 'Tesouro IPCA+')
  expect(side(2).getByLabelText('Juro real anual')).toBeInTheDocument()
  expect(side(2).queryByLabelText('Percentual do CDI')).not.toBeInTheDocument()
  expect(side(1).getByLabelText('Percentual do CDI')).toHaveValue('100')
  expect(headers()[1]).toHaveTextContent('Tesouro IPCA+ (IPCA + 7%)')
})

test('a caixinha começa com 120% do CDI', async () => {
  renderApp('/comparar')
  await choose(2, 'Caixinha')
  expect(side(2).getByLabelText('Percentual do CDI')).toHaveValue('120')
})

test('dois CDBs se diferenciam pela taxa', async () => {
  renderApp('/comparar')
  await choose(2, 'CDB')
  await replace(side(2).getByLabelText('Percentual do CDI'), '120')
  expect(headers()[0]).toHaveTextContent(/^CDB 100% do CDI$/)
  expect(headers()[1]).toHaveTextContent(/^CDB 120% do CDI/)
  expect(verdict()).toHaveTextContent(/^CDB 120% do CDI termina com/)
})

test('investimentos idênticos ganham a ordem e empatam', async () => {
  renderApp('/comparar')
  await choose(2, 'CDB')
  expect(verdict()).toHaveTextContent('CDB 100% do CDI (1º) e CDB 100% do CDI (2º) terminam com o mesmo valor líquido.')
})

test('renda variável pede o cenário antes de comparar', async () => {
  renderApp('/comparar')
  await choose(1, 'Ações')
  expect(
    screen.getByText('Preencha a valorização e os dividendos esperados do 1º investimento para comparar.'),
  ).toBeInTheDocument()
  expect(table()).not.toBeInTheDocument()
  await userEvent.type(side(1).getByLabelText('Valorização anual esperada'), '8')
  await userEvent.type(side(1).getByLabelText('Dividendos anuais esperados'), '6')
  expect(headers()[0]).toHaveTextContent(/^Ações \(8% ao ano\)/)
  expect(side(1).getByLabelText('Reinvestir dividendos')).toBeChecked()
})

test('os dois lados sem cenário pedem os dois', async () => {
  renderApp('/comparar')
  await choose(1, 'Ações')
  await choose(2, 'FIIs')
  expect(
    screen.getByText('Preencha a valorização e os dividendos esperados dos dois investimentos para comparar.'),
  ).toBeInTheDocument()
})

test('campo comum inválido oculta a comparação', async () => {
  renderApp('/comparar')
  await userEvent.clear(screen.getByLabelText('Prazo'))
  expect(table()).not.toBeInTheDocument()
  expect(screen.getByText('Corrija os campos destacados para comparar.')).toBeInTheDocument()
  expect(document.body).not.toHaveTextContent('NaN')
})

test('cada lado explica o próprio imposto', async () => {
  renderApp('/comparar')
  await userEvent.click(screen.getByRole('button', { name: 'Explicação sobre Imposto de CDB 100% do CDI' }))
  expect(screen.getByRole('note')).toHaveTextContent(/^CDB · 5 anos/)
  await userEvent.click(screen.getByRole('button', { name: 'Explicação sobre Imposto de LCI/LCA 90% do CDI' }))
  expect(screen.getByRole('note')).toHaveTextContent(/^LCI\/LCA · 5 anos/)
})

test('o gráfico compara os dois e o total investido', () => {
  renderApp('/comparar')
  const legend = within(screen.getByRole('list', { name: 'Legenda' }))
  expect(legend.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'CDB 100% do CDI',
    'LCI/LCA 90% do CDI',
    'Total investido',
  ])
})

test('tem o botão de premissas', () => {
  renderApp('/comparar')
  expect(screen.getByRole('button', { name: 'Premissas' })).toBeInTheDocument()
})

const columnCells = (index: number) =>
  within(table()!)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[index])

test('o ganhador fica destacado na tabela', () => {
  renderApp('/comparar')
  const [first, second] = headers()
  expect(second).toHaveTextContent('Mais vantajoso')
  expect(first).not.toHaveTextContent('Mais vantajoso')
  expect(second).toHaveAttribute('data-winner')
  for (const cell of columnCells(1)) expect(cell).toHaveAttribute('data-winner')
  for (const cell of columnCells(0)) expect(cell).not.toHaveAttribute('data-winner')
  const net = within(table()!).getByRole('row', { name: /^Valor líquido/ })
  expect(within(net).getAllByRole('cell')[1]).toHaveTextContent(/\+R\$\s[\d.,]+ a mais$/)
})

test('o destaque acompanha quem passa a ganhar', async () => {
  renderApp('/comparar')
  await choose(2, 'Poupança')
  expect(headers()[0]).toHaveTextContent('Mais vantajoso')
  expect(headers()[1]).not.toHaveTextContent('Mais vantajoso')
})

test('no empate, nenhum lado fica destacado', async () => {
  renderApp('/comparar')
  await choose(2, 'CDB')
  expect(table()).not.toHaveTextContent('Mais vantajoso')
  expect(table()!.querySelector('[data-winner]')).toBeNull()
})

test('a tabela mostra os dois valores em dinheiro de hoje', async () => {
  renderApp('/comparar')
  const row = within(table()!).getByRole('row', { name: /^Em dinheiro de hoje/ })
  expect(within(row).getAllByRole('cell')).toHaveLength(2)
  await userEvent.click(screen.getByRole('button', { name: 'Explicação sobre Em dinheiro de hoje de CDB 100% do CDI' }))
  expect(screen.getByRole('note')).toHaveTextContent(/Em dinheiro de hoje = valor líquido ÷ \(1 \+ IPCA\) \^ anos/)
})

const addButton = () => screen.getByRole('button', { name: /Adicionar investimento/ })

test('dá para adicionar mais investimentos à comparação', async () => {
  renderApp('/comparar')
  expect(screen.queryByRole('button', { name: /^Remover/ })).not.toBeInTheDocument()
  await userEvent.click(addButton())
  expect(side(3).getByLabelText('Produto')).toHaveValue('tesouro-selic')
  expect(headers()).toHaveLength(3)
  expect(headers()[2]).toHaveTextContent(/^Tesouro Selic/)
  const legend = within(screen.getByRole('list', { name: 'Legenda' }))
  expect(legend.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'CDB 100% do CDI',
    'LCI/LCA 90% do CDI',
    'Tesouro Selic',
    'Total investido',
  ])
})

test('com três ou mais, o veredito aponta o mais vantajoso entre todos', async () => {
  renderApp('/comparar')
  await userEvent.click(addButton())
  expect(verdict()).toHaveTextContent(/É o mais vantajoso entre os 3\.$/)
  const winners = headers().filter((cell) => cell.hasAttribute('data-winner'))
  expect(winners).toHaveLength(1)
  expect(winners[0]).toHaveTextContent('Mais vantajoso')
})

test('a comparação vai até 4 investimentos', async () => {
  renderApp('/comparar')
  await userEvent.click(addButton())
  await userEvent.click(addButton())
  expect(headers()).toHaveLength(4)
  expect(addButton()).toBeDisabled()
  expect(screen.getByText('Compare até 4 investimentos, para o gráfico continuar legível.')).toBeInTheDocument()
})

test('remover um investimento tira ele da tabela e do gráfico', async () => {
  renderApp('/comparar')
  await userEvent.click(addButton())
  await userEvent.click(screen.getByRole('button', { name: 'Remover LCI/LCA 90% do CDI' }))
  expect(headers().map((cell) => cell.textContent)).toEqual([
    expect.stringMatching(/^CDB 100% do CDI/),
    expect.stringMatching(/^Tesouro Selic/),
  ])
  expect(screen.queryByRole('button', { name: /^Remover/ })).not.toBeInTheDocument()
})

test('o 3º sem cenário é citado pela ordem', async () => {
  renderApp('/comparar')
  await userEvent.click(addButton())
  await choose(3, 'Ações')
  expect(
    screen.getByText('Preencha a valorização e os dividendos esperados do 3º investimento para comparar.'),
  ).toBeInTheDocument()
})

test('com três, cada valor da tabela diz de qual investimento é', async () => {
  renderApp('/comparar')
  await userEvent.click(addButton())
  const net = within(table()!).getByRole('row', { name: /^Valor líquido/ })
  expect(within(net).getAllByRole('cell').map((cell) => cell.getAttribute('data-label'))).toEqual([
    'CDB 100% do CDI',
    'LCI/LCA 90% do CDI',
    'Tesouro Selic',
  ])
})
