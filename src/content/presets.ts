import type { ProductId } from '@/lib/compare';
import { defaultSide } from '@/pages/compare/sideValues';

// Exemplos e cenários prontos: cada um grava valores no guarda de estado das páginas, com as mesmas
// chaves usadas pelas abas e pela comparação, e abre a página correspondente. Os valores passam pela
// mesma conferência dos links compartilhados. Taxas, valorização e dividendos são só exemplos.
export type Preset = {
  id: string;
  title: string;
  description: string;
  path: '/simulador' | '/comparar';
  entries: Record<string, unknown>;
};

const cdiPercents = { cdb: '100', 'lci-lca': '90', caixinha: '120' };
const withCdi = (changes: Partial<typeof cdiPercents>) => ({ ...cdiPercents, ...changes });
const years = (initial: string, monthly: string, term: string) => ({ initial, monthly, term, unit: 'years' });
const months = (initial: string, monthly: string, term: string) => ({ initial, monthly, term, unit: 'months' });

// Exemplos de renda fixa do simulador.
const fixed = (
  id: string,
  title: string,
  description: string,
  product: string,
  common: ReturnType<typeof years>,
  extra: Record<string, unknown> = {},
): Preset => ({
  id,
  title,
  description,
  path: '/simulador',
  entries: { 'simulator.tab': 0, 'fixed.product': product, 'fixed.common': common, ...extra },
});

// Exemplos de renda variável do simulador.
const variable = (
  id: string,
  title: string,
  description: string,
  asset: 'acoes' | 'fiis',
  common: ReturnType<typeof years>,
  scenario: { appreciation: string; dividends: string; reinvest: boolean },
): Preset => ({
  id,
  title,
  description,
  path: '/simulador',
  entries: {
    'simulator.tab': 1,
    'variable.asset': asset,
    'variable.common': common,
    'variable.appreciation': scenario.appreciation,
    'variable.dividends': scenario.dividends,
    'variable.reinvest': scenario.reinvest,
  },
});

// Um investimento de um cenário da comparação.
const side = (product: ProductId, id: string, changes: Record<string, unknown> = {}) => ({
  ...defaultSide(product, id),
  ...changes,
});

const compare = (
  id: string,
  title: string,
  description: string,
  common: ReturnType<typeof years>,
  items: ReturnType<typeof side>[],
): Preset => ({
  id,
  title,
  description,
  path: '/comparar',
  entries: { 'compare.common': common, 'compare.items': items },
});

export const PRESETS: Preset[] = [
  // Simulador
  fixed('reserva', 'Reserva de emergência', 'R$ 500 por mês no Tesouro Selic durante 1 ano.', 'tesouro-selic', years('1.000', '500', '1')),
  fixed('primeiro-investimento', 'Primeiro investimento', 'R$ 100 para começar e mais R$ 100 por mês num CDB de 100% do CDI, por 1 ano.', 'cdb', years('100', '100', '1'), {
    'fixed.cdiPercents': cdiPercents,
  }),
  fixed('reserva-caixinha', 'Reserva numa caixinha', 'R$ 2.000 e mais R$ 300 por mês numa caixinha de 100% do CDI, por 1 ano.', 'caixinha', years('2.000', '300', '1'), {
    'fixed.cdiPercents': withCdi({ caixinha: '100' }),
  }),
  fixed('viagem', 'Viagem dos sonhos', 'R$ 400 por mês num CDB de 100% do CDI, por 18 meses.', 'cdb', months('0', '400', '18'), {
    'fixed.cdiPercents': cdiPercents,
  }),
  fixed('decimo-terceiro', 'Guardar o 13º salário', 'R$ 3.000 de uma vez num CDB de 100% do CDI, por 1 ano.', 'cdb', years('3.000', '0', '1'), {
    'fixed.cdiPercents': cdiPercents,
  }),
  fixed('casamento', 'Casamento', 'R$ 3.000 e mais R$ 800 por mês num CDB de 110% do CDI, por 2 anos.', 'cdb', years('3.000', '800', '2'), {
    'fixed.cdiPercents': withCdi({ cdb: '110' }),
  }),
  fixed('carro', 'Troca de carro', 'R$ 10.000 e mais R$ 1.000 por mês em LCI/LCA, por 3 anos.', 'lci-lca', years('10.000', '1.000', '3'), {
    'fixed.cdiPercents': cdiPercents,
  }),
  fixed('entrada', 'Entrada de um apartamento', 'R$ 1.500 por mês em LCI/LCA durante 4 anos.', 'lci-lca', years('5.000', '1.500', '4'), {
    'fixed.cdiPercents': cdiPercents,
  }),
  fixed('poupanca-parada', 'Dinheiro parado na poupança', 'R$ 10.000 esquecidos na poupança por 5 anos.', 'poupanca', years('10.000', '0', '5')),
  fixed('faculdade', 'Faculdade dos filhos', 'R$ 300 por mês no Tesouro IPCA+ durante 15 anos.', 'tesouro-ipca', years('1.000', '300', '15'), {
    'fixed.realAnnual': '6',
  }),
  fixed('independencia', 'Independência financeira', 'R$ 10.000 e mais R$ 2.000 por mês no Tesouro IPCA+, por 20 anos.', 'tesouro-ipca', years('10.000', '2.000', '20'), {
    'fixed.realAnnual': '6',
  }),
  fixed('aposentadoria', 'Aposentadoria', 'R$ 500 por mês no Tesouro IPCA+ durante 30 anos.', 'tesouro-ipca', years('0', '500', '30'), {
    'fixed.realAnnual': '6',
  }),
  variable('comecar-bolsa', 'Começar na bolsa', 'R$ 200 por mês em ações por 10 anos, com 8% de valorização e 4% de dividendos.', 'acoes', years('500', '200', '10'), {
    appreciation: '8',
    dividends: '4',
    reinvest: true,
  }),
  variable('dividendos-aposentadoria', 'Dividendos para a aposentadoria', 'R$ 500 por mês em ações por 25 anos, reinvestindo 6% de dividendos.', 'acoes', years('1.000', '500', '25'), {
    appreciation: '6',
    dividends: '6',
    reinvest: true,
  }),
  variable('ano-ruim', 'Um ano ruim na bolsa', 'R$ 10.000 em ações num ano com queda de 15%.', 'acoes', years('10.000', '0', '1'), {
    appreciation: '-15',
    dividends: '3',
    reinvest: true,
  }),
  variable('fiis', 'Renda com FIIs', 'R$ 300 por mês em FIIs durante 10 anos, reinvestindo os rendimentos.', 'fiis', years('1.000', '300', '10'), {
    appreciation: '3',
    dividends: '8',
    reinvest: true,
  }),
  variable('renda-mensal-fiis', 'Renda mensal com FIIs', 'R$ 50.000 em FIIs por 5 anos, recebendo os rendimentos sem reinvestir.', 'fiis', years('50.000', '0', '5'), {
    appreciation: '2',
    dividends: '9',
    reinvest: false,
  }),

  // Comparação
  compare('onde-guardar-reserva', 'Onde guardar a reserva', 'R$ 10.000 por 1 ano na poupança, no Tesouro Selic e numa caixinha de 100% do CDI.', years('10.000', '0', '1'), [
    side('poupanca', 'exemplo-poupanca'),
    side('tesouro-selic', 'exemplo-tesouro-selic'),
    side('caixinha', 'exemplo-caixinha', { cdiPercents: withCdi({ caixinha: '100' }) }),
  ]),
  compare('cdb-ou-lci', 'CDB ou LCI/LCA?', 'R$ 10.000 e mais R$ 500 por mês, por 3 anos: CDB 110% contra LCI/LCA 90% do CDI.', years('10.000', '500', '3'), [
    side('cdb', 'cenario-cdb', { cdiPercents: withCdi({ cdb: '110' }) }),
    side('lci-lca', 'cenario-lci'),
  ]),
  compare('poupanca-ou-selic', 'Poupança ou Tesouro Selic?', 'R$ 5.000 e mais R$ 300 por mês, por 5 anos.', years('5.000', '300', '5'), [
    side('poupanca', 'cenario-poupanca'),
    side('tesouro-selic', 'cenario-selic'),
  ]),
  compare('proteger-inflacao', 'Proteger da inflação', 'R$ 1.000 por mês por 10 anos no Tesouro IPCA+, no Tesouro Selic e num CDB.', years('0', '1.000', '10'), [
    side('tesouro-ipca', 'cenario-ipca', { realAnnual: '6' }),
    side('tesouro-selic', 'cenario-selic'),
    side('cdb', 'cenario-cdb'),
  ]),
  compare('fixa-ou-variavel', 'Renda fixa ou renda variável?', 'R$ 500 por mês por 10 anos em CDB, ações e FIIs, com valorização e dividendos de exemplo.', years('1.000', '500', '10'), [
    side('cdb', 'cenario-cdb'),
    side('acoes', 'cenario-acoes', { appreciation: '10', dividends: '4' }),
    side('fiis', 'cenario-fiis', { appreciation: '3', dividends: '8' }),
  ]),
  compare('caixinha-ou-cdb', 'Caixinha ou CDB?', 'R$ 5.000 e mais R$ 500 por mês, por 2 anos: caixinha 100% contra CDB 110% do CDI.', years('5.000', '500', '2'), [
    side('caixinha', 'cenario-caixinha', { cdiPercents: withCdi({ caixinha: '100' }) }),
    side('cdb', 'cenario-cdb', { cdiPercents: withCdi({ cdb: '110' }) }),
  ]),
  compare('prazo-curto', 'Prazo curto de 6 meses', 'R$ 10.000 por 6 meses: o imposto de 22,5% pesa e a LCI/LCA isenta pode ganhar.', months('10.000', '0', '6'), [
    side('lci-lca', 'cenario-lci'),
    side('tesouro-selic', 'cenario-selic'),
    side('cdb', 'cenario-cdb'),
  ]),
  compare('prazo-longo', 'Prazo longo de 20 anos', 'R$ 500 por mês por 20 anos no Tesouro IPCA+ e num CDB.', years('0', '500', '20'), [
    side('tesouro-ipca', 'cenario-ipca', { realAnnual: '6' }),
    side('cdb', 'cenario-cdb'),
  ]),
  compare('banco-medio', 'CDB de banco médio', 'R$ 20.000 por 2 anos: CDB de 100% e de 120% do CDI contra LCI/LCA de 95%.', years('20.000', '0', '2'), [
    side('cdb', 'cenario-cdb-100'),
    side('cdb', 'cenario-cdb-120', { cdiPercents: withCdi({ cdb: '120' }) }),
    side('lci-lca', 'cenario-lci', { cdiPercents: withCdi({ 'lci-lca': '95' }) }),
  ]),
  compare('acoes-ou-fiis', 'Ações ou FIIs?', 'R$ 5.000 e mais R$ 500 por mês, por 10 anos, com valorização e dividendos de exemplo.', years('5.000', '500', '10'), [
    side('acoes', 'cenario-acoes', { appreciation: '9', dividends: '4' }),
    side('fiis', 'cenario-fiis', { appreciation: '3', dividends: '8' }),
  ]),
  compare('onde-investir-13', 'Onde investir o 13º', 'R$ 3.000 por 1 ano na poupança, num CDB, no Tesouro Selic e em LCI/LCA.', years('3.000', '0', '1'), [
    side('poupanca', 'cenario-poupanca'),
    side('cdb', 'cenario-cdb'),
    side('tesouro-selic', 'cenario-selic'),
    side('lci-lca', 'cenario-lci'),
  ]),
];

export const presetById = (id: string) => PRESETS.find((preset) => preset.id === id)!;
