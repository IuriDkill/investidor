import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.dataset.theme = 'dark'
})

const nav = () => within(screen.getByRole('navigation', { name: 'Páginas' }))

test('a página inicial é o guia, e o menu leva às outras páginas', () => {
  renderApp('/')
  expect(screen.getByRole('heading', { level: 2, name: 'Por onde começar' })).toBeInTheDocument()
  const links = nav().getAllByRole('link')
  expect(links.map((link) => link.textContent)).toEqual(['Por onde começar', 'Simulador', 'Comparar'])
  expect(nav().getByRole('link', { name: 'Por onde começar' })).toHaveAttribute('aria-current', 'page')
  expect(nav().getByRole('link', { name: 'Simulador' })).toHaveAttribute('href', '/simulador')
  expect(nav().getByRole('link', { name: 'Comparar' })).toHaveAttribute('href', '/comparar')
})

test('o link leva à página de comparação e volta', async () => {
  renderApp('/simulador')
  await userEvent.click(nav().getByRole('link', { name: 'Comparar' }))
  expect(screen.getByRole('heading', { name: 'Comparar investimentos' })).toBeInTheDocument()
  expect(nav().getByRole('link', { name: 'Comparar' })).toHaveAttribute('aria-current', 'page')
  await userEvent.click(nav().getByRole('link', { name: 'Simulador' }))
  expect(screen.getByRole('tab', { name: 'Renda fixa' })).toBeInTheDocument()
})

test('endereço desconhecido volta à página inicial', () => {
  renderApp('/nao-existe')
  expect(screen.getByRole('heading', { level: 2, name: 'Por onde começar' })).toBeInTheDocument()
})

test('as premissas valem também na comparação', async () => {
  renderApp('/comparar')
  const netRow = () => screen.getByRole('row', { name: /^Valor líquido/ }).textContent
  const before = netRow()
  await userEvent.click(screen.getByRole('button', { name: 'Premissas' }))
  const modal = within(screen.getByRole('dialog', { name: 'Premissas' }))
  await userEvent.clear(modal.getByLabelText('CDI anual'))
  await userEvent.type(modal.getByLabelText('CDI anual'), '5')
  expect(netRow()).not.toBe(before)
})

test('o IPCA das premissas muda o valor em dinheiro de hoje', async () => {
  renderApp('/simulador')
  const today = () =>
    screen.getAllByText('Em dinheiro de hoje').find((element) => element.tagName === 'DT')?.parentElement?.textContent
  const before = today()
  await userEvent.click(screen.getByRole('button', { name: 'Premissas' }))
  const modal = within(screen.getByRole('dialog', { name: 'Premissas' }))
  await userEvent.clear(modal.getByLabelText('IPCA anual'))
  await userEvent.type(modal.getByLabelText('IPCA anual'), '10')
  expect(today()).not.toBe(before)
})
