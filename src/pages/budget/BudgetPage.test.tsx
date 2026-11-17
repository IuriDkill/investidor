import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

beforeEach(() => {
  localStorage.clear()
})

const card = (label: string) => screen.queryAllByText(label).find((element) => element.tagName === 'DT')?.parentElement
const advice = () => within(screen.getByRole('list', { name: 'Conselhos' }))
type Typist = { type: (element: Element, text: string) => Promise<unknown> }
const typeSalary = (text: string, user: Typist = userEvent) => user.type(screen.getByLabelText('Salário líquido'), text)

test('a página tem link no menu, entre o guia e o simulador', async () => {
  renderApp('/')
  const nav = within(screen.getByRole('navigation', { name: 'Páginas' }))
  expect(nav.getAllByRole('link').map((link) => link.textContent)).toEqual([
    'Por onde começar',
    'Meu orçamento',
    'Simulador',
    'Comparar',
  ])
  await userEvent.click(nav.getByRole('link', { name: 'Meu orçamento' }))
  expect(screen.getByRole('heading', { level: 2, name: 'Meu orçamento' })).toBeInTheDocument()
})

test('sem salário, pede o salário', () => {
  renderApp('/orcamento')
  expect(screen.getByText('Informe seu salário líquido para ver a sugestão.')).toBeInTheDocument()
  expect(card('Para investir')).toBeUndefined()
})

test('com o salário, mostra a divisão, a reserva e os conselhos', async () => {
  renderApp('/orcamento')
  await typeSalary('5.000')
  expect(card('Para essenciais')).toHaveTextContent('2.500,00')
  expect(card('Para desejos')).toHaveTextContent('1.500,00')
  expect(card('Para investir')).toHaveTextContent('1.000,00')
  expect(screen.getByRole('img', { name: /Divisão do salário/ })).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Reserva de emergência' })).toBeInTheDocument()
  expect(advice().getByText('Comece pela reserva de emergência')).toBeInTheDocument()
})

test('os campos opcionais personalizam o conselho', async () => {
  renderApp('/orcamento')
  await typeSalary('5.000')
  await userEvent.type(screen.getByLabelText('Gastos essenciais por mês'), '3.500')
  expect(advice().getByText(/Gastos essenciais em 70% do salário/)).toBeInTheDocument()
  await userEvent.click(screen.getByLabelText('Tenho dívida no rotativo do cartão ou no cheque especial'))
  expect(advice().getAllByRole('listitem')[0]).toHaveTextContent('Quite a dívida cara primeiro')
  expect(screen.queryByRole('button', { name: 'Simular esse valor' })).not.toBeInTheDocument()
})

test('simular esse valor abre o simulador com o aporte sugerido', async () => {
  renderApp('/orcamento')
  await typeSalary('5.000')
  await userEvent.type(screen.getByLabelText('Gastos essenciais por mês'), '2.000')
  await userEvent.type(screen.getByLabelText('Reserva que já tenho'), '3.000')
  await userEvent.click(screen.getByRole('button', { name: 'Simular esse valor' }))
  const panel = within(screen.getByRole('tabpanel'))
  expect(panel.getByLabelText('Produto')).toHaveValue('tesouro-selic')
  expect(panel.getByLabelText('Valor inicial')).toHaveValue('3.000,00')
  expect(panel.getByLabelText('Aporte mensal')).toHaveValue('1.500,00')
  expect(panel.getByLabelText('Prazo')).toHaveValue('6')
  expect(panel.getByLabelText('Unidade')).toHaveValue('months')
})

test('com a reserva completa, simula um objetivo de longo prazo', async () => {
  renderApp('/orcamento')
  await typeSalary('5.000')
  await userEvent.type(screen.getByLabelText('Gastos essenciais por mês'), '2.000')
  await userEvent.type(screen.getByLabelText('Reserva que já tenho'), '20.000')
  expect(advice().getByText('Reserva completa: hora dos objetivos')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Simular esse valor' }))
  expect(within(screen.getByRole('tabpanel')).getByLabelText('Produto')).toHaveValue('tesouro-ipca')
})

test('o salário nunca vai no link compartilhado', async () => {
  const user = userEvent.setup()
  renderApp('/orcamento')
  await typeSalary('5.000', user)
  await user.click(screen.getByRole('button', { name: 'Copiar link' }))
  const link = new URL(await navigator.clipboard.readText())
  expect(link.pathname).toBe('/orcamento')
  expect(link.search).toBe('')
})

test('os dados continuam ao ir e voltar de outra página', async () => {
  renderApp('/orcamento')
  await typeSalary('4.200')
  await userEvent.click(screen.getByRole('link', { name: 'Simulador' }))
  await userEvent.click(screen.getByRole('link', { name: 'Meu orçamento' }))
  expect(screen.getByLabelText('Salário líquido')).toHaveValue('4.200')
})

test('salário inválido mostra erro sem quebrar', async () => {
  renderApp('/orcamento')
  await typeSalary('abc')
  expect(screen.getByLabelText('Salário líquido')).toHaveAttribute('aria-invalid', 'true')
  expect(document.body).not.toHaveTextContent(/NaN|undefined/)
})

test('o guia leva ao orçamento', async () => {
  renderApp('/')
  await userEvent.click(screen.getByRole('link', { name: 'Monte seu orçamento' }))
  expect(screen.getByRole('heading', { level: 2, name: 'Meu orçamento' })).toBeInTheDocument()
})
