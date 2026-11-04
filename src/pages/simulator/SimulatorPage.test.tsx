import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

const modal = () => within(screen.getByRole('dialog', { name: 'Premissas' }))
const openModal = () => userEvent.click(screen.getByRole('button', { name: 'Premissas' }))
const netValue = () =>
  screen.getAllByText('Valor líquido').find((element) => element.tagName === 'DT')?.parentElement?.textContent

const replace = async (input: HTMLElement, text: string) => {
  await userEvent.clear(input)
  await userEvent.type(input, text)
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.dataset.theme = 'dark'
})

test('o modal começa fechado', () => {
  renderApp('/simulador')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('o botão fica acima do produto e abre o modal', async () => {
  renderApp('/simulador')
  const button = screen.getByRole('button', { name: 'Premissas' })
  const product = within(screen.getByRole('tabpanel')).getByLabelText('Produto')
  expect(button.compareDocumentPosition(product)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  await openModal()
  expect(screen.getByRole('dialog', { name: 'Premissas' })).toBeInTheDocument()
})

test('a renda variável abre o mesmo modal, com o botão acima do ativo', async () => {
  renderApp('/simulador')
  await userEvent.click(screen.getByRole('tab', { name: 'Renda variável' }))
  const button = screen.getByRole('button', { name: 'Premissas' })
  const asset = within(screen.getByRole('tabpanel')).getByLabelText('Ativo')
  expect(button.compareDocumentPosition(asset)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  await openModal()
  expect(screen.getByRole('dialog', { name: 'Premissas' })).toBeInTheDocument()
})

test('o botão de fechar fecha o modal', async () => {
  renderApp('/simulador')
  await openModal()
  await userEvent.click(modal().getByRole('button', { name: 'Fechar' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('clicar fora do conteúdo fecha o modal', async () => {
  renderApp('/simulador')
  await openModal()
  await userEvent.click(screen.getByRole('dialog', { name: 'Premissas' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('clicar em um campo não fecha o modal', async () => {
  renderApp('/simulador')
  await openModal()
  await userEvent.click(modal().getByLabelText('CDI anual'))
  expect(screen.getByRole('dialog', { name: 'Premissas' })).toBeInTheDocument()
})

test('todas as premissas ficam editáveis', async () => {
  renderApp('/simulador')
  await openModal()
  for (const label of [
    'CDI anual',
    'Selic anual',
    'IPCA anual',
    'Até 180 dias',
    '181 a 360 dias',
    '361 a 720 dias',
    'Acima de 720 dias',
    'Lucro em ações',
    'Lucro em FIIs',
    'Limite de isenção em ações',
    'Selic de corte',
    'Rendimento acima do corte',
    'Percentual da Selic até o corte',
  ]) {
    expect(modal().getByLabelText(label)).toBeInTheDocument()
  }
})

test('mudar o CDI recalcula a renda fixa', async () => {
  renderApp('/simulador')
  const before = netValue()
  await openModal()
  await replace(modal().getByLabelText('CDI anual'), '5')
  expect(netValue()).not.toBe(before)
  expect(screen.getByText(/CDI de 5%/)).toBeInTheDocument()
})

test('mudar uma alíquota recalcula o imposto', async () => {
  renderApp('/simulador')
  const before = netValue()
  await openModal()
  await replace(modal().getByLabelText('Acima de 720 dias'), '0')
  await replace(modal().getByLabelText('361 a 720 dias'), '0')
  expect(netValue()).not.toBe(before)
})

test('mudar a regra de ações recalcula a renda variável', async () => {
  renderApp('/simulador')
  await userEvent.click(screen.getByRole('tab', { name: 'Renda variável' }))
  const tab = within(screen.getByRole('tabpanel'))
  await userEvent.type(tab.getByLabelText('Valorização anual esperada'), '8')
  await userEvent.type(tab.getByLabelText('Dividendos anuais esperados'), '0')
  const card = () => tab.getByText('Imposto', { selector: 'dt' }).parentElement
  expect(card()).toHaveTextContent(/R\$\s0,00/)
  await openModal()
  await replace(modal().getByLabelText('Limite de isenção em ações'), '0')
  expect(card()).not.toHaveTextContent(/R\$\s0,00/)
})

test('premissa inválida marca o campo e oculta o resultado', async () => {
  renderApp('/simulador')
  await openModal()
  await replace(modal().getByLabelText('Selic anual'), '200')
  expect(modal().getByLabelText('Selic anual')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.queryByText('Valor líquido', { selector: 'dt' })).not.toBeInTheDocument()
  expect(screen.getAllByText(/Corrija os campos em Premissas/)).toHaveLength(2)
  expect(document.body).not.toHaveTextContent('NaN')
})

test('restaurar padrões desfaz as alterações', async () => {
  renderApp('/simulador')
  const before = netValue()
  await openModal()
  await replace(modal().getByLabelText('CDI anual'), '5')
  await userEvent.click(modal().getByRole('button', { name: 'Restaurar padrões' }))
  expect(modal().getByLabelText('CDI anual')).toHaveValue('13,65')
  expect(netValue()).toBe(before)
})

test.each(['CDI anual', 'Selic anual', 'IPCA anual', 'Limite de isenção em ações', 'Selic de corte'])(
  'as premissas explicam %s',
  async (label) => {
    renderApp('/simulador')
    await openModal()
    expect(modal().getByRole('button', { name: `Explicação sobre ${label}` })).toBeInTheDocument()
  },
)
