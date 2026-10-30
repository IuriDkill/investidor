import { render, screen, within } from '@testing-library/react'
import GrowthChart from '.'

const series = [
  { month: 0, invested: 1000, gross: 1000 },
  { month: 1, invested: 1200, gross: 1210 },
  { month: 2, invested: 1400, gross: 1425.5 },
]

test('oferece tabela alternativa com todos os meses', () => {
  render(<GrowthChart series={series} />)
  const rows = within(screen.getByRole('table', { hidden: true })).getAllByRole('row', { hidden: true })
  expect(rows).toHaveLength(4)
  expect(rows[3]).toHaveTextContent('R$ 1.425,50')
})

test('a tabela fica dentro de um contêiner oculto', () => {
  // Tabelas ignoram height e overflow: ocultar o próprio <table> faz ele aumentar a página.
  render(<GrowthChart series={series} />)
  expect(screen.getByRole('table', { hidden: true }).parentElement).toHaveClass('srOnly')
})

test('identifica as duas séries na legenda', () => {
  render(<GrowthChart series={series} />)
  const legend = within(screen.getByRole('list'))
  expect(legend.getByText('Patrimônio bruto')).toBeInTheDocument()
  expect(legend.getByText('Total investido')).toBeInTheDocument()
})
