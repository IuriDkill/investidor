import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Tabs from '.'

const renderTabs = () =>
  render(
    <Tabs
      tabs={[
        { id: 'a', label: 'Primeira', content: <input aria-label="Campo" /> },
        { id: 'b', label: 'Segunda', content: <p>Conteúdo da segunda</p> },
      ]}
    />,
  )

test('começa na primeira aba', () => {
  renderTabs()
  const tabs = screen.getAllByRole('tab')
  expect(tabs).toHaveLength(2)
  expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByText('Conteúdo da segunda')).not.toBeVisible()
})

test('o clique mostra o painel da aba', async () => {
  renderTabs()
  await userEvent.click(screen.getByRole('tab', { name: 'Segunda' }))
  expect(screen.getByText('Conteúdo da segunda')).toBeVisible()
})

test('as setas trocam de aba e dão a volta', async () => {
  renderTabs()
  const [first, second] = screen.getAllByRole('tab')
  first.focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(second).toHaveAttribute('aria-selected', 'true')
  expect(second).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  expect(first).toHaveAttribute('aria-selected', 'true')
  await userEvent.keyboard('{ArrowLeft}')
  expect(second).toHaveAttribute('aria-selected', 'true')
})

test('trocar de aba mantém o que foi digitado', async () => {
  renderTabs()
  await userEvent.type(screen.getByLabelText('Campo'), '123')
  await userEvent.click(screen.getByRole('tab', { name: 'Segunda' }))
  await userEvent.click(screen.getByRole('tab', { name: 'Primeira' }))
  expect(screen.getByLabelText('Campo')).toHaveValue('123')
})
