import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Field from '@/components/Field'
import ResultCards from '@/components/ResultCards'
import SelectField from '@/components/SelectField'

const button = (label: string) => screen.getByRole('button', { name: `Explicação sobre ${label}` })

test('o campo abre e fecha a explicação pelo botão', async () => {
  render(<Field label="Aporte mensal" value="" onChange={() => {}} info="Quanto você acrescenta todo mês." />)
  expect(button('Aporte mensal')).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByText('Quanto você acrescenta todo mês.')).not.toBeInTheDocument()

  await userEvent.click(button('Aporte mensal'))
  expect(button('Aporte mensal')).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText('Quanto você acrescenta todo mês.')).toBeVisible()

  // O segundo clique solta a caixa; com o mouse ainda em cima, ela só fecha quando ele sai.
  await userEvent.click(button('Aporte mensal'))
  await userEvent.unhover(button('Aporte mensal'))
  expect(screen.queryByText('Quanto você acrescenta todo mês.')).not.toBeInTheDocument()
})

test('Esc fecha a explicação', async () => {
  render(<Field label="Prazo" value="" onChange={() => {}} info="Tempo aplicado." />)
  await userEvent.click(button('Prazo'))
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByText('Tempo aplicado.')).not.toBeInTheDocument()
  expect(button('Prazo')).toHaveFocus()
})

test('o botão aponta para a caixa que controla', async () => {
  render(<Field label="Prazo" value="" onChange={() => {}} info="Tempo aplicado." />)
  await userEvent.click(button('Prazo'))
  expect(document.getElementById(button('Prazo').getAttribute('aria-controls') ?? '')).toHaveTextContent('Tempo aplicado.')
})

test('o botão não muda o rótulo do campo', () => {
  render(<Field label="Prazo" value="5" onChange={() => {}} info="Tempo aplicado." />)
  expect(screen.getByLabelText('Prazo')).toHaveValue('5')
})

test('campo sem explicação não tem botão', () => {
  render(<Field label="Prazo" value="" onChange={() => {}} />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('o seletor também pode ter explicação', async () => {
  render(
    <SelectField label="Ativo" value="a" options={[{ value: 'a', label: 'Ações' }]} onChange={() => {}} info="Ações e FIIs." />,
  )
  await userEvent.click(button('Ativo'))
  expect(screen.getByText('Ações e FIIs.')).toBeVisible()
})

test('o cartão de resultado mantém o rótulo e abre a explicação', async () => {
  render(<ResultCards items={[{ label: 'Imposto', value: 'R$ 10,00', info: 'Imposto de renda.' }]} />)
  expect(screen.getByText('Imposto', { selector: 'dt' })).toBeInTheDocument()
  await userEvent.click(button('Imposto'))
  expect(screen.getByText('Imposto de renda.')).toBeVisible()
})

test('passar o mouse abre a explicação e sair fecha', async () => {
  render(<Field label="Prazo" value="" onChange={() => {}} info="Tempo aplicado." />)
  await userEvent.hover(button('Prazo'))
  expect(screen.getByText('Tempo aplicado.')).toBeVisible()
  expect(button('Prazo')).toHaveAttribute('aria-expanded', 'true')
  await userEvent.unhover(button('Prazo'))
  expect(screen.queryByText('Tempo aplicado.')).not.toBeInTheDocument()
})

test('clicar fixa a explicação aberta depois que o mouse sai', async () => {
  render(<Field label="Prazo" value="" onChange={() => {}} info="Tempo aplicado." />)
  await userEvent.click(button('Prazo'))
  await userEvent.unhover(button('Prazo'))
  expect(screen.getByText('Tempo aplicado.')).toBeVisible()
})

test('no toque, cada toque abre ou fecha', async () => {
  render(<Field label="Prazo" value="" onChange={() => {}} info="Tempo aplicado." />)
  const tap = () => userEvent.pointer({ keys: '[TouchA]', target: button('Prazo') })
  await tap()
  expect(screen.getByText('Tempo aplicado.')).toBeVisible()
  await tap()
  expect(screen.queryByText('Tempo aplicado.')).not.toBeInTheDocument()
})

test('clicar fora fecha a explicação fixada', async () => {
  render(
    <>
      <Field label="Prazo" value="" onChange={() => {}} info="Tempo aplicado." />
      <p>Fora</p>
    </>,
  )
  await userEvent.click(button('Prazo'))
  await userEvent.click(screen.getByText('Fora'))
  expect(screen.queryByText('Tempo aplicado.')).not.toBeInTheDocument()
})

test('tocar na explicação fixada fecha, para ela não travar o que está embaixo', async () => {
  render(<Field label="Prazo" value="" onChange={() => {}} info="Tempo aplicado." />)
  await userEvent.click(button('Prazo'))
  await userEvent.pointer({ keys: '[TouchA]', target: screen.getByText('Tempo aplicado.') })
  expect(screen.queryByText('Tempo aplicado.')).not.toBeInTheDocument()
})
