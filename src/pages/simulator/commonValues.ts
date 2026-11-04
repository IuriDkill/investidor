import { FIELD_LIMITS } from '@/config/rates';
import { parseInRange, toMonths, type TermUnit } from '@/lib/validate';

export type CommonValues = { initial: string; monthly: string; term: string; unit: TermUnit };
export type CommonErrors = { initial?: string; monthly?: string; term?: string };

export const DEFAULT_COMMON_VALUES: CommonValues = { initial: '2.000', monthly: '200', term: '5', unit: 'years' };

export const isCommonValues = (values: CommonValues) => values.unit === 'months' || values.unit === 'years';

const parseAmount = (text: string) => parseInRange(text, 0, FIELD_LIMITS.amountMax);

export function parseCommon(values: CommonValues) {
  const initial = parseAmount(values.initial);
  const monthly = parseAmount(values.monthly);
  const months = toMonths(values.term, values.unit);

  if (initial === null || monthly === null || months === null || initial + monthly === 0) return null;
  return { initial, monthly, months };
}

export function commonErrors(values: CommonValues): CommonErrors {
  const errors: CommonErrors = {};
  const initial = parseAmount(values.initial);
  const monthly = parseAmount(values.monthly);

  if (initial === null) errors.initial = 'Informe um valor entre R$ 0 e R$ 1 bilhão.';
  if (monthly === null) errors.monthly = 'Informe um valor entre R$ 0 e R$ 1 bilhão.';
  if (initial === 0 && monthly === 0) errors.initial = 'Informe um valor inicial ou um aporte mensal.';
  if (toMonths(values.term, values.unit) === null) errors.term = 'Informe um prazo de 1 mês a 50 anos.';

  return errors;
}
