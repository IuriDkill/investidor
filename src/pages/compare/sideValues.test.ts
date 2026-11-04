import { choiceLabel, defaultSide, itemLabels, nextItem } from './sideValues'

test.each([
  ['cdb', 'CDB 100% do CDI'],
  ['lci-lca', 'LCI/LCA 90% do CDI'],
  ['caixinha', 'Caixinha 120% do CDI'],
  ['tesouro-selic', 'Tesouro Selic'],
  ['tesouro-ipca', 'Tesouro IPCA+ (IPCA + 7%)'],
  ['poupanca', 'Poupança'],
  ['acoes', 'Ações'],
  ['fiis', 'FIIs'],
] as const)('nomeia %s pelo produto e pela taxa', (product, label) => {
  expect(choiceLabel(defaultSide(product))).toBe(label)
})

test('renda variável mostra a valorização informada', () => {
  expect(choiceLabel({ ...defaultSide('acoes'), appreciation: '8' })).toBe('Ações (8% ao ano)')
  expect(choiceLabel({ ...defaultSide('fiis'), appreciation: '-5' })).toBe('FIIs (-5% ao ano)')
})

test('usa a taxa digitada no lado', () => {
  const side = defaultSide('cdb')
  expect(choiceLabel({ ...side, cdiPercents: { ...side.cdiPercents, cdb: '120' } })).toBe('CDB 120% do CDI')
})

test('nomes diferentes ficam como estão', () => {
  expect(itemLabels([defaultSide('cdb'), defaultSide('lci-lca')])).toEqual(['CDB 100% do CDI', 'LCI/LCA 90% do CDI'])
})

test('só os nomes repetidos ganham a ordem', () => {
  expect(itemLabels([defaultSide('poupanca'), defaultSide('poupanca')])).toEqual(['Poupança (1º)', 'Poupança (2º)'])
  expect(itemLabels([defaultSide('cdb'), defaultSide('lci-lca'), defaultSide('cdb')])).toEqual([
    'CDB 100% do CDI (1º)',
    'LCI/LCA 90% do CDI',
    'CDB 100% do CDI (3º)',
  ])
})

test('o próximo investimento usa um produto que ainda não está na comparação', () => {
  const items = [defaultSide('cdb'), defaultSide('lci-lca')]
  expect(nextItem(items).product).toBe('tesouro-selic')
  expect(nextItem([...items, defaultSide('tesouro-selic')]).product).toBe('poupanca')
})

test('cada investimento tem um id próprio', () => {
  const items = [defaultSide('cdb'), defaultSide('lci-lca')]
  expect(new Set([...items, nextItem(items)].map((item) => item.id)).size).toBe(3)
})
