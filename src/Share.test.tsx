import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

beforeEach(() => {
  localStorage.clear()
})

const side = (order: number) => within(screen.getByRole('group', { name: new RegExp(`^${order}º`) }))
const panel = () => within(screen.getByRole('tabpanel'))

const replace = async (user: ReturnType<typeof userEvent.setup>, input: HTMLElement, text: string) => {
  await user.clear(input)
  await user.type(input, text)
}

const copyLink = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Copiar link' }))
  return new URL(await navigator.clipboard.readText())
}

test('o link da comparação reabre os mesmos investimentos', async () => {
  const user = userEvent.setup()
  const { unmount } = renderApp('/comparar')
  await user.selectOptions(side(2).getByLabelText('Produto'), 'Caixinha')
  await replace(user, side(2).getByLabelText('Percentual do CDI'), '110')
  await replace(user, screen.getByLabelText('Prazo'), '3')
  const verdict = screen.getByRole('status').textContent
  const link = await copyLink(user)
  expect(screen.getByRole('button', { name: 'Copiar link' })).toHaveTextContent('Link copiado')
  expect(link.pathname).toBe('/comparar')
  unmount()

  renderApp(link.pathname + link.search)
  expect(side(2).getByLabelText('Produto')).toHaveValue('caixinha')
  expect(side(2).getByLabelText('Percentual do CDI')).toHaveValue('110')
  expect(screen.getByLabelText('Prazo')).toHaveValue('3')
  expect(screen.getByRole('status').textContent).toBe(verdict)
})

test('o link leva também os investimentos adicionados', async () => {
  const user = userEvent.setup()
  const { unmount } = renderApp('/comparar')
  await user.click(screen.getByRole('button', { name: /Adicionar investimento/ }))
  await user.selectOptions(side(3).getByLabelText('Produto'), 'FIIs')
  const link = await copyLink(user)
  unmount()

  renderApp(link.pathname + link.search)
  expect(side(3).getByLabelText('Produto')).toHaveValue('fiis')
  expect(screen.getAllByRole('group', { name: /^\dº/ })).toHaveLength(3)
})

test('o link do simulador reabre a aba e os campos', async () => {
  const user = userEvent.setup()
  const { unmount } = renderApp('/simulador')
  await user.click(screen.getByRole('tab', { name: 'Renda variável' }))
  await user.selectOptions(panel().getByLabelText('Ativo'), 'FIIs')
  await user.type(panel().getByLabelText('Valorização anual esperada'), '6')
  const link = await copyLink(user)
  expect(link.pathname).toBe('/simulador')
  unmount()

  renderApp(link.pathname + link.search)
  expect(screen.getByRole('tab', { name: 'Renda variável' })).toHaveAttribute('aria-selected', 'true')
  expect(panel().getByLabelText('Ativo')).toHaveValue('fiis')
  expect(panel().getByLabelText('Valorização anual esperada')).toHaveValue('6')
})

test('sem alterações, o link é o endereço da página', async () => {
  const user = userEvent.setup()
  renderApp('/comparar')
  const link = await copyLink(user)
  expect(link.search).toBe('')
})

test('o link do simulador não leva os dados da comparação', async () => {
  const user = userEvent.setup()
  renderApp('/comparar')
  await user.selectOptions(side(2).getByLabelText('Produto'), 'Poupança')
  await user.click(screen.getByRole('link', { name: 'Simulador' }))
  const link = await copyLink(user)
  expect(link.search).toBe('')
})

test.each([
  '/comparar?s=nao-e-json',
  '/comparar?s=' + encodeURIComponent('{"compare.items":[{"product":"cdb"}]}'),
  '/comparar?s=' + encodeURIComponent('{"compare.items":"muitos"}'),
  '/comparar?s=' + encodeURIComponent('{"compare.x":{"product":"inventado"}}'),
  '/comparar?s=' +
    encodeURIComponent(
      JSON.stringify({
        'compare.items': [{
          id: 'a',
          product: 'toString',
          cdiPercents: { cdb: '100', 'lci-lca': '90', caixinha: '120' },
          realAnnual: '7',
          appreciation: '',
          dividends: '',
          reinvest: true,
        }, {
          id: 'b',
          product: 'cdb',
          cdiPercents: { cdb: '100', 'lci-lca': '90', caixinha: '120' },
          realAnnual: '7',
          appreciation: '',
          dividends: '',
          reinvest: true,
        }],
      }),
    ),
  '/comparar?s=' + encodeURIComponent('{"compare.common":{"initial":"1","monthly":"1","term":"1","unit":"semanas"}}'),
  '/simulador?s=' + encodeURIComponent('{"fixed.product":"bitcoin","simulator.tab":7,"variable.asset":42}'),
])('link inválido (%s) cai nos valores iniciais sem quebrar', (path) => {
  renderApp(path)
  expect(document.body).not.toHaveTextContent('NaN')
  expect(document.body).not.toHaveTextContent('undefined')
  if (path.startsWith('/comparar')) {
    expect(side(1).getByLabelText('Produto')).toHaveValue('cdb')
    expect(screen.getByLabelText('Unidade')).toHaveValue('years')
  } else {
    expect(screen.getByRole('tab', { name: 'Renda fixa' })).toHaveAttribute('aria-selected', 'true')
    expect(panel().getByLabelText('Produto')).toHaveValue('cdb')
  }
})
