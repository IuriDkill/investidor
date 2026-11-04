import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PRESETS } from '@/content/presets'
import { renderApp } from '@/test/renderApp'

beforeEach(() => {
  localStorage.clear()
})

const scenarios = () => within(screen.getByRole('region', { name: 'Cenários prontos' }))
const groups = () => screen.getAllByRole('group', { name: /^\dº/ })
const products = () => groups().map((group) => (within(group).getByLabelText('Produto') as HTMLSelectElement).value)
const choose = (title: string) => userEvent.click(scenarios().getByRole('button', { name: new RegExp(`^${title.replace(/[?+]/g, '\\$&')}`) }))

const TITLES = [
  'Onde guardar a reserva',
  'CDB ou LCI/LCA?',
  'Poupança ou Tesouro Selic?',
  'Proteger da inflação',
  'Renda fixa ou renda variável?',
]

test('os cenários aparecem no topo da comparação', () => {
  renderApp('/comparar')
  const section = screen.getByRole('region', { name: 'Cenários prontos' })
  expect(section.compareDocumentPosition(screen.getByRole('heading', { name: 'Comparar investimentos' }))).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  )
  const titles = scenarios()
    .getAllByRole('button')
    .map((button) => button.querySelector('span')?.textContent)
    .filter(Boolean)
  expect(titles.slice(0, TITLES.length)).toEqual(TITLES)
  expect(titles.length).toBeGreaterThanOrEqual(10)
})

test('o simulador não mostra os cenários da comparação', () => {
  renderApp('/simulador')
  expect(screen.queryByRole('region', { name: 'Cenários prontos' })).not.toBeInTheDocument()
})

test('CDB ou LCI/LCA preenche as duas opções com as taxas do cenário', async () => {
  renderApp('/comparar')
  await choose('CDB ou LCI/LCA?')
  expect(products()).toEqual(['cdb', 'lci-lca'])
  expect(within(groups()[0]).getByLabelText('Percentual do CDI')).toHaveValue('110')
  expect(within(groups()[1]).getByLabelText('Percentual do CDI')).toHaveValue('90')
  expect(screen.getByLabelText('Prazo')).toHaveValue('3')
  expect(screen.getByRole('status')).toHaveTextContent(/a mais que/)
  expect(screen.getByText('Cenário aplicado: CDB ou LCI/LCA? Ajuste os valores como quiser.')).toBeInTheDocument()
})

test('o cenário de renda variável preenche a valorização e os dividendos', async () => {
  renderApp('/comparar')
  await choose('Renda fixa ou renda variável?')
  expect(products()).toEqual(['cdb', 'acoes', 'fiis'])
  expect(within(groups()[1]).getByLabelText('Valorização anual esperada')).toHaveValue('10')
  expect(within(groups()[1]).getByLabelText('Dividendos anuais esperados')).toHaveValue('4')
  expect(within(groups()[2]).getByLabelText('Dividendos anuais esperados')).toHaveValue('8')
  expect(screen.getByRole('status')).toHaveTextContent(/É o mais vantajoso entre os 3\.$/)
})

test.each(PRESETS.filter((preset) => preset.path === '/comparar').map((preset) => preset.title))(
  'o cenário "%s" mostra uma comparação completa',
  async (title) => {
  renderApp('/comparar')
  await choose(title)
  expect(screen.getByRole('table', { name: 'Comparação no fim do prazo' })).toBeInTheDocument()
  expect(screen.getByText(new RegExp(`^Cenário aplicado: ${title.replace(/[?+()/]/g, '\\$&')}`))).toBeInTheDocument()
  expect(document.body).not.toHaveTextContent(/NaN|undefined/)
  },
)

test('a faixa de cenários rola pelos botões sem quebrar', async () => {
  renderApp('/comparar')
  await userEvent.click(scenarios().getByRole('button', { name: 'Próximos' }))
  await userEvent.click(scenarios().getByRole('button', { name: 'Anteriores' }))
  expect(screen.getByRole('region', { name: 'Cenários prontos' })).toBeInTheDocument()
})

test('trocar de cenário substitui a lista inteira', async () => {
  renderApp('/comparar')
  await choose('Proteger da inflação')
  expect(products()).toEqual(['tesouro-ipca', 'tesouro-selic', 'cdb'])
  await choose('Poupança ou Tesouro Selic?')
  expect(products()).toEqual(['poupanca', 'tesouro-selic'])
})
