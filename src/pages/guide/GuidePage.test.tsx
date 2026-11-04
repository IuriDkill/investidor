import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

beforeEach(() => {
  localStorage.clear()
})

const nav = () => within(screen.getByRole('navigation', { name: 'Páginas' }))

test('o guia tem link no cabeçalho', async () => {
  renderApp('/simulador')
  expect(nav().getByRole('link', { name: 'Por onde começar' })).toHaveAttribute('href', '/')
  await userEvent.click(nav().getByRole('link', { name: 'Por onde começar' }))
  expect(screen.getByRole('heading', { level: 2, name: 'Por onde começar' })).toBeInTheDocument()
})

test('o guia apresenta os passos em ordem', () => {
  renderApp('/')
  const steps = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
  expect(steps).toEqual([
    '1. Organize as contas',
    '2. Monte a reserva de emergência',
    '3. Defina objetivos e prazos',
    '4. Entenda risco, liquidez e garantia',
    '5. Invista com regularidade',
    '6. Desconfie de promessas fáceis',
  ])
})

test('a tabela de garantia e liquidez cobre todos os produtos', () => {
  renderApp('/')
  const table = within(screen.getByRole('table', { name: 'Garantia, liquidez e risco de cada produto' }))
  for (const product of ['CDB', 'LCI/LCA', 'Caixinha', 'Poupança', 'Tesouro Selic', 'Tesouro IPCA+', 'Ações', 'FIIs']) {
    expect(table.getByRole('rowheader', { name: product })).toBeInTheDocument()
  }
})

test('o botão da reserva abre o simulador já preenchido', async () => {
  renderApp('/')
  await userEvent.click(screen.getByRole('button', { name: 'Simular uma reserva de emergência' }))
  expect(screen.getByRole('tab', { name: 'Renda fixa' })).toHaveAttribute('aria-selected', 'true')
  expect(within(screen.getByRole('tabpanel')).getByLabelText('Produto')).toHaveValue('tesouro-selic')
})

test('o botão de onde guardar a reserva abre a comparação com três opções', async () => {
  renderApp('/')
  await userEvent.click(screen.getByRole('button', { name: 'Comparar onde guardar a reserva' }))
  const groups = screen.getAllByRole('group', { name: /^\dº/ })
  expect(groups).toHaveLength(3)
  expect(groups.map((group) => (within(group).getByLabelText('Produto') as HTMLSelectElement).value)).toEqual([
    'poupanca',
    'tesouro-selic',
    'caixinha',
  ])
  expect(screen.getByLabelText('Valor inicial')).toHaveValue('10.000')
  expect(screen.getByRole('status')).toHaveTextContent(/a mais que/)
})

test('os outros exemplos também ficam a um clique', async () => {
  renderApp('/')
  for (const name of ['Simular a entrada de um apartamento', 'Simular uma aposentadoria', 'Simular renda com FIIs']) {
    expect(screen.getByRole('button', { name })).toBeInTheDocument()
  }
})
