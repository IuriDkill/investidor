import { FIELD_LIMITS, RATE_DEFAULTS } from '@/config/rates';
import { isVariableProduct, PRODUCT_LABELS, type ProductChoice, type ProductId } from '@/lib/compare';
import { parseInRange } from '@/lib/validate';

type CdiProduct = 'cdb' | 'lci-lca' | 'caixinha';

// A comparação vai até 4 investimentos: é o máximo de cores que continuam distinguíveis no gráfico.
export const MAX_ITEMS = 4;
export const MIN_ITEMS = 2;

// Os campos de um investimento da comparação, como texto digitado.
export type SideValues = {
  id: string;
  product: ProductId;
  cdiPercents: Record<CdiProduct, string>;
  realAnnual: string;
  appreciation: string;
  dividends: string;
  reinvest: boolean;
};

export type SideErrors = { cdiPercent?: string; realAnnual?: string; appreciation?: string; dividends?: string };

export type ParsedSide = { choice: ProductChoice | null; missingScenario: boolean; errors: SideErrors };

const CDI_PERCENT_MAX = 200;

export const usesCdi = (product: ProductId): product is CdiProduct =>
  product === 'cdb' || product === 'lci-lca' || product === 'caixinha';

let lastId = 0;
const newId = () => `investimento-${++lastId}`;

export const defaultSide = (product: ProductId, id = newId()): SideValues => ({
  id,
  product,
  cdiPercents: {
    cdb: RATE_DEFAULTS.cdbCdiPercent,
    'lci-lca': RATE_DEFAULTS.lciCdiPercent,
    caixinha: RATE_DEFAULTS.caixinhaCdiPercent,
  },
  realAnnual: RATE_DEFAULTS.realAnnual,
  appreciation: '',
  dividends: '',
  reinvest: true,
});

export const isSideValues = (values: SideValues) => Object.hasOwn(PRODUCT_LABELS, values.product);

// Lista vinda de um link ou do guarda: tamanho permitido, produtos que existem e ids sem repetição.
export const isItemList = (items: SideValues[]) =>
  items.length >= MIN_ITEMS &&
  items.length <= MAX_ITEMS &&
  items.every(isSideValues) &&
  new Set(items.map((item) => item.id)).size === items.length;

export const DEFAULT_ITEMS = () => [defaultSide('cdb'), defaultSide('lci-lca')];

// Ordem em que novos investimentos são sugeridos: o primeiro que ainda não está na comparação.
const SUGGESTION_ORDER: ProductId[] = ['cdb', 'lci-lca', 'tesouro-selic', 'poupanca', 'caixinha', 'tesouro-ipca', 'acoes', 'fiis'];

export function nextItem(items: SideValues[]) {
  const used = new Set(items.map((item) => item.product));
  const product = SUGGESTION_ORDER.find((candidate) => !used.has(candidate)) ?? 'cdb';
  const ids = new Set(items.map((item) => item.id));
  let id = newId();
  while (ids.has(id)) id = newId();
  return defaultSide(product, id);
}

// Nome do investimento pelo produto e pela taxa que o diferencia, como "CDB 100% do CDI".
export function choiceLabel(values: SideValues) {
  const { product } = values;
  const name = PRODUCT_LABELS[product];
  if (usesCdi(product)) return `${name} ${values.cdiPercents[product].trim() || '?'}% do CDI`;
  if (product === 'tesouro-ipca') return `${name} (IPCA + ${values.realAnnual.trim() || '?'}%)`;
  if (isVariableProduct(product) && values.appreciation.trim() !== '') {
    return `${name} (${values.appreciation.trim()}% ao ano)`;
  }
  return name;
}

// Nomes repetidos ganham a ordem, para a tabela e o veredito não ficarem ambíguos.
export function itemLabels(items: SideValues[]) {
  const labels = items.map(choiceLabel);
  return labels.map((label, index) =>
    labels.filter((other) => other === label).length > 1 ? `${label} (${index + 1}º)` : label,
  );
}

// Mesmas regras de validação das abas do simulador.
export function parseSide(values: SideValues): ParsedSide {
  const { product } = values;
  const errors: SideErrors = {};
  let cdiPercent = 0;
  let realAnnual = 0;
  let appreciationAnnual = 0;
  let dividendAnnual = 0;
  let missingScenario = false;

  if (usesCdi(product)) {
    const parsed = parseInRange(values.cdiPercents[product], 0, CDI_PERCENT_MAX);
    if (parsed === null) errors.cdiPercent = 'Informe um valor de 0 a 200.';
    cdiPercent = (parsed ?? 0) / 100;
  }

  if (product === 'tesouro-ipca') {
    const parsed = parseInRange(values.realAnnual, 0, FIELD_LIMITS.percentMax);
    if (parsed === null) errors.realAnnual = 'Informe um valor de 0 a 100.';
    realAnnual = (parsed ?? 0) / 100;
  }

  if (isVariableProduct(product)) {
    missingScenario = values.appreciation.trim() === '' || values.dividends.trim() === '';
    const appreciation = parseInRange(values.appreciation, FIELD_LIMITS.appreciationMin, FIELD_LIMITS.percentMax);
    const dividends = parseInRange(values.dividends, 0, FIELD_LIMITS.percentMax);
    if (values.appreciation.trim() !== '' && appreciation === null) errors.appreciation = 'Informe um valor de -99 a 100.';
    if (values.dividends.trim() !== '' && dividends === null) errors.dividends = 'Informe um valor de 0 a 100.';
    appreciationAnnual = (appreciation ?? 0) / 100;
    dividendAnnual = (dividends ?? 0) / 100;
  }

  const valid = !missingScenario && Object.keys(errors).length === 0;
  return {
    choice: valid
      ? { product, cdiPercent, realAnnual, appreciationAnnual, dividendAnnual, reinvestDividends: values.reinvest }
      : null,
    missingScenario,
    errors,
  };
}
