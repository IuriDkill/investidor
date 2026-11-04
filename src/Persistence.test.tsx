import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

beforeEach(() => {
  localStorage.clear()
})

const nav = () => within(screen.getByRole('navigation', { name: 'Páginas' }))
const goTo = (page: 'Simulador' | 'Comparar') => userEvent.click(nav().getByRole('link', { name: page }))
const panel = () => within(screen.getByRole('tabpanel'))

const replace = async (input: HTMLElement, text: string) => {
  await userEvent.clear(input)
  await userEvent.type(input, text)
}

test('a renda fixa mantém os dados ao ir e voltar da comparação', async () => {
  renderApp('/simulador')
  await replace(panel().getByLabelText('Aporte mensal'), '350')
  await userEvent.selectOptions(panel().getByLabelText('Produto'), 'Caixinha')
  await replace(panel().getByLabelText('Percentual do CDI'), '115')

  await goTo('Comparar')
  await goTo('Simulador')

  expect(panel().getByLabelText('Aporte mensal')).toHaveValue('350')
  expect(panel().getByLabelText('Produto')).toHaveValue('caixinha')
  expect(panel().getByLabelText('Percentual do CDI')).toHaveValue('115')
})

test('a renda variável e a aba escolhida continuam ao voltar', async () => {
  renderApp('/simulador')
  await userEvent.click(screen.getByRole('tab', { name: 'Renda variável' }))
  await userEvent.selectOptions(panel().getByLabelText('Ativo'), 'FIIs')
  await userEvent.type(panel().getByLabelText('Valorização anual esperada'), '7')
  await userEvent.type(panel().getByLabelText('Dividendos anuais esperados'), '9')
  await userEvent.click(panel().getByLabelText('Reinvestir dividendos'))

  await goTo('Comparar')
  await goTo('Simulador')

  expect(screen.getByRole('tab', { name: 'Renda variável' })).toHaveAttribute('aria-selected', 'true')
  expect(panel().getByLabelText('Ativo')).toHaveValue('fiis')
  expect(panel().getByLabelText('Valorização anual esperada')).toHaveValue('7')
  expect(panel().getByLabelText('Dividendos anuais esperados')).toHaveValue('9')
  expect(panel().getByLabelText('Reinvestir dividendos')).not.toBeChecked()
})

test('a comparação mantém os dois investimentos ao ir e voltar do simulador', async () => {
  renderApp('/comparar')
  const side = (order: number) => within(screen.getByRole('group', { name: new RegExp(`^${order}º`) }))
  await replace(screen.getByLabelText('Prazo'), '3')
  await userEvent.selectOptions(side(2).getByLabelText('Produto'), 'Ações')
  await userEvent.type(side(2).getByLabelText('Valorização anual esperada'), '12')
  await userEvent.type(side(2).getByLabelText('Dividendos anuais esperados'), '4')
  const verdict = screen.getByRole('status').textContent

  await goTo('Simulador')
  await goTo('Comparar')

  expect(screen.getByLabelText('Prazo')).toHaveValue('3')
  expect(side(2).getByLabelText('Produto')).toHaveValue('acoes')
  expect(side(2).getByLabelText('Valorização anual esperada')).toHaveValue('12')
  expect(screen.getByRole('status').textContent).toBe(verdict)
})

test('cada página guarda os próprios dados', async () => {
  renderApp('/simulador')
  await replace(panel().getByLabelText('Aporte mensal'), '999')
  await goTo('Comparar')
  expect(screen.getByLabelText('Aporte mensal')).toHaveValue('200')
})
