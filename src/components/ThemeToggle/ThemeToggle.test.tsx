import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeToggle from '.'

beforeEach(() => {
  document.documentElement.dataset.theme = 'dark'
})

test('mostra um ícone em vez de texto', () => {
  render(<ThemeToggle />)
  const button = screen.getByRole('button', { name: 'Usar tema claro' })
  expect(button.textContent).toBe('')
  expect(button.querySelector('svg')).toBeInTheDocument()
})

test('alterna o tema e atualiza o nome do botão', async () => {
  render(<ThemeToggle />)
  await userEvent.click(screen.getByRole('button', { name: 'Usar tema claro' }))
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(screen.getByRole('button', { name: 'Usar tema escuro' })).toBeInTheDocument()
})
