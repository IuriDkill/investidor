import { formatCurrency, formatPercent } from './format';

// Aconselhamento de orçamento a partir do salário líquido, numa regra 50/30/20 adaptada:
// essenciais e parcelas vêm primeiro, depois ao menos 20% para investir, e o resto para desejos.

const ESSENTIALS_SHARE = 0.5;
const WANTS_SHARE = 0.3;
const INVEST_SHARE = 0.2;
const DEBT_LOAD_LIMIT = 0.3;
const RESERVE_MONTHS = 6;

export type BudgetInput = {
  salary: number;
  essentials?: number | null;
  debtPayments?: number | null;
  expensiveDebt: boolean;
  reserve?: number | null;
};

export type Advice = {
  id: 'expensive-debt' | 'deficit' | 'debt-load' | 'essentials-high' | 'reserve-building' | 'reserve-complete';
  tone: 'alert' | 'warning' | 'ok';
  title: string;
  text: string;
};

export type BudgetResult = {
  salary: number;
  essentialsKnown: boolean;
  essentials: number;
  debtPayments: number;
  wants: number;
  invest: number;
  // Com dívida cara, o valor que iria para investimentos vai para quitá-la.
  toDebt: number;
  deficit: number;
  reserve: {
    target: number;
    current: number;
    monthsCovered: number;
    // Meses para completar no ritmo sugerido, sem contar rendimentos; null se não sobra para investir.
    monthsToComplete: number | null;
    complete: boolean;
  };
  advice: Advice[];
};

const formatMonths = (months: number) =>
  `${months.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${months === 1 ? 'mês' : 'meses'}`;

export function adviseBudget(input: BudgetInput): BudgetResult {
  const { salary, expensiveDebt } = input;
  const essentialsKnown = input.essentials !== undefined && input.essentials !== null;
  const essentials = essentialsKnown ? (input.essentials as number) : salary * ESSENTIALS_SHARE;
  const debtPayments = input.debtPayments ?? 0;

  const leftover = salary - essentials - debtPayments;
  const available = Math.max(leftover, 0);
  const capacity = Math.min(Math.max(salary * INVEST_SHARE, leftover - salary * WANTS_SHARE), available);
  const investable = Math.max(capacity, 0);
  const invest = expensiveDebt ? 0 : investable;
  const toDebt = expensiveDebt ? investable : 0;
  const wants = available - investable;
  const deficit = Math.max(-leftover, 0);

  const current = input.reserve ?? 0;
  const target = essentials * RESERVE_MONTHS;
  const complete = current >= target;
  const reserve = {
    target,
    current,
    monthsCovered: essentials > 0 ? current / essentials : 0,
    monthsToComplete: complete ? 0 : invest > 0 ? Math.ceil((target - current) / invest) : null,
    complete,
  };

  const advice: Advice[] = [];
  if (expensiveDebt) {
    advice.push({
      id: 'expensive-debt',
      tone: 'alert',
      title: 'Quite a dívida cara primeiro',
      text:
        `Os juros do rotativo e do cheque especial costumam passar de 100% ao ano, muito acima de qualquer investimento. ` +
        `Use os ${formatCurrency(toDebt)} por mês que iriam para investimentos para quitá-la e só depois volte a investir.`,
    });
  }
  if (deficit > 0) {
    advice.push({
      id: 'deficit',
      tone: 'alert',
      title: 'Seus gastos passam do salário',
      text: `Faltam ${formatCurrency(deficit)} por mês. Antes de investir, corte gastos ou renegocie as parcelas.`,
    });
  }
  if (debtPayments > salary * DEBT_LOAD_LIMIT) {
    advice.push({
      id: 'debt-load',
      tone: 'warning',
      title: `Parcelas comprometem ${formatPercent(debtPayments / salary)} do salário`,
      text: 'O recomendado é até 30%. Evite novas parcelas até esse valor baixar.',
    });
  }
  if (essentialsKnown && essentials > salary * ESSENTIALS_SHARE) {
    advice.push({
      id: 'essentials-high',
      tone: 'warning',
      title: `Gastos essenciais em ${formatPercent(essentials / salary)} do salário`,
      text: 'A referência é até 50%. Moradia, contas e transporte costumam ser os que mais pesam; vale rever planos e contratos.',
    });
  }
  if (!expensiveDebt && deficit === 0) {
    if (complete) {
      advice.push({
        id: 'reserve-complete',
        tone: 'ok',
        title: 'Reserva completa: hora dos objetivos',
        text:
          `Sua reserva cobre ${formatMonths(reserve.monthsCovered)} de gastos essenciais. ` +
          `Invista ${formatCurrency(invest)} por mês nos seus objetivos, como aposentadoria ou a entrada de um imóvel.`,
      });
    } else {
      const missing = formatCurrency(target - current);
      advice.push({
        id: 'reserve-building',
        tone: 'ok',
        title: 'Comece pela reserva de emergência',
        text:
          invest > 0
            ? `Invista ${formatCurrency(invest)} por mês com liquidez diária, como Tesouro Selic ou caixinha. ` +
              `Faltam ${missing} para chegar a ${RESERVE_MONTHS} meses de gastos; no ritmo sugerido, leva cerca de ` +
              `${formatMonths(reserve.monthsToComplete as number)}, sem contar os rendimentos.`
            : `Faltam ${missing} para chegar a ${RESERVE_MONTHS} meses de gastos. Comece assim que sobrar dinheiro no mês.`,
      });
    }
  }

  return { salary, essentialsKnown, essentials, debtPayments, wants, invest, toDebt, deficit, reserve, advice };
}
