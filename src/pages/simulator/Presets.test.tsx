import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PRESETS } from '@/content/presets'
import { renderApp } from '@/test/renderApp'

beforeEach(() => {
  localStorage.clear()
})

const panel = () => within(screen.getByRole('tabpanel'))
const examples = () => within(screen.getByRole('region', { name: 'Exemplos prontos' }))

test('os exemplos aparecem antes das abas', () => {
  renderApp('/simulador')
  const section = screen.getByRole('region', { name: 'Exemplos prontos' })
  expect(section.compareDocumentPosition(screen.getByRole('tab', { name: 'Renda fixa' }))).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  )
  for (const title of ['Reserva de emergência', 'Entrada de um apartamento', 'Aposentadoria', 'Renda com FIIs']) {
    expect(examples().getByRole('button', { name: new RegExp(`^${title}`) })).toBeInTheDocument()
  }
})

test('um exemplo de renda fixa preenche a aba e mostra o resultado', async () => {
  renderApp('/simulador')
  await userEvent.click(examples().getByRole('button', { name: /^Reserva de emergência/ }))
  expect(screen.getByRole('tab', { name: 'Renda fixa' })).toHaveAttribute('aria-selected', 'true')
  expect(panel().getByLabelText('Produto')).toHaveValue('tesouro-selic')
  expect(panel().getByLabelText('Valor inicial')).toHaveValue('1.000')
  expect(panel().getByLabelText('Aporte mensal')).toHaveValue('500')
  expect(panel().getByLabelText('Prazo')).toHaveValue('1')
  expect(panel().getByText('Valor líquido', { selector: 'dt' })).toBeInTheDocument()
  expect(screen.getByText('Exemplo aplicado: Reserva de emergência. Ajuste os valores como quiser.')).toBeInTheDocument()
})

test('um exemplo de renda variável troca de aba e preenche o cenário', async () => {
  renderApp('/simulador')
  await userEvent.click(examples().getByRole('button', { name: /^Renda com FIIs/ }))
  expect(screen.getByRole('tab', { name: 'Renda variável' })).toHaveAttribute('aria-selected', 'true')
  expect(panel().getByLabelText('Ativo')).toHaveValue('fiis')
  expect(panel().getByLabelText('Valorização anual esperada')).toHaveValue('3')
  expect(panel().getByLabelText('Dividendos anuais esperados')).toHaveValue('8')
  expect(panel().getByLabelText('Reinvestir dividendos')).toBeChecked()
  expect(panel().getByText('Valor líquido', { selector: 'dt' })).toBeInTheDocument()
})

test('o exemplo do Tesouro IPCA+ usa o juro real dele', async () => {
  renderApp('/simulador')
  await userEvent.click(examples().getByRole('button', { name: /^Aposentadoria/ }))
  expect(panel().getByLabelText('Produto')).toHaveValue('tesouro-ipca')
  expect(panel().getByLabelText('Juro real anual')).toHaveValue('6')
  expect(panel().getByLabelText('Prazo')).toHaveValue('30')
})

test('o exemplo continua aplicado ao ir e voltar da comparação', async () => {
  renderApp('/simulador')
  await userEvent.click(examples().getByRole('button', { name: /^Entrada de um apartamento/ }))
  await userEvent.click(screen.getByRole('link', { name: 'Comparar' }))
  await userEvent.click(screen.getByRole('link', { name: 'Simulador' }))
  expect(panel().getByLabelText('Produto')).toHaveValue('lci-lca')
  expect(panel().getByLabelText('Aporte mensal')).toHaveValue('1.500')
})

const simulatorPresets = PRESETS.filter((preset) => preset.path === '/simulador')

test('há muitos exemplos prontos', () => {
  expect(simulatorPresets.length).toBeGreaterThanOrEqual(15)
})

test.each(simulatorPresets.map((preset) => preset.title))('o exemplo "%s" mostra um resultado completo', async (title) => {
  renderApp('/simulador')
  const escaped = title.replace(/[?+()/]/g, '\\$&')
  await userEvent.click(examples().getByRole('button', { name: new RegExp(`^${escaped}`) }))
  expect(panel().getByText('Valor líquido', { selector: 'dt' })).toBeInTheDocument()
  expect(document.body).not.toHaveTextContent(/NaN|undefined/)
})

test('a faixa de exemplos tem botões para rolar', async () => {
  renderApp('/simulador')
  await userEvent.click(examples().getByRole('button', { name: 'Próximos' }))
  await userEvent.click(examples().getByRole('button', { name: 'Anteriores' }))
  expect(examples().getAllByRole('button').length).toBeGreaterThan(15)
})
