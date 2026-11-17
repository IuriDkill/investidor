import { useEffect } from 'react';
import Disclaimer from '@/components/Disclaimer';
import Field from '@/components/Field';
import InfoButton, { InfoBox } from '@/components/InfoButton';
import { useInfo } from '@/components/InfoButton/useInfo';
import { useLayoutContext } from '@/components/Layout/useLayoutContext';
import ResultCards from '@/components/ResultCards';
import { FIELD_LIMITS } from '@/config/rates';
import { EXPLANATIONS } from '@/content/explanations';
import type { Preset } from '@/content/presets';
import { adviseBudget, type Advice, type BudgetResult } from '@/lib/budget';
import { formatCurrency, formatPercent } from '@/lib/format';
import { parseInRange } from '@/lib/validate';
import { usePersistentState } from '@/utils/usePersistentState';
import tabStyles from '../simulator/tabs.module.css';
import styles from './style.module.css';

const NOT_INCLUDED = [
  'Conselho educativo e simplificado: não substitui um planejador financeiro.',
  'A regra 50/30/20 é uma referência, não uma regra fixa. Ajuste ao seu momento de vida.',
  'Os prazos da reserva não contam os rendimentos, então tendem a ser um pouco menores na prática.',
];

const AMOUNT_ERROR = 'Informe um valor de R$ 0 a R$ 1 bilhão.';
const TONE_LABEL: Record<Advice['tone'], string> = { alert: 'Atenção', warning: 'Cuidado', ok: 'Próximo passo' };
const TONE_ICON: Record<Advice['tone'], string> = { alert: '!', warning: '!', ok: '✓' };
const MONTHS_MAX = 600;

// Campo opcional: vazio vale null; texto inválido vale undefined, que marca erro.
const parseOptional = (text: string) =>
  text.trim() === '' ? null : (parseInRange(text, 0, FIELD_LIMITS.amountMax) ?? undefined);

const money = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Leva o aporte sugerido ao simulador: reserva no Tesouro Selic ou, com ela completa, um objetivo longo.
function suggestedSimulation(result: BudgetResult): Preset {
  const { reserve, invest } = result;
  const entries = reserve.complete
    ? {
        'simulator.tab': 0,
        'fixed.product': 'tesouro-ipca',
        'fixed.realAnnual': '6',
        'fixed.common': { initial: '0', monthly: money(invest), term: '10', unit: 'years' },
      }
    : {
        'simulator.tab': 0,
        'fixed.product': 'tesouro-selic',
        'fixed.common': {
          initial: money(reserve.current),
          monthly: money(invest),
          term: String(Math.min(Math.max(reserve.monthsToComplete ?? 12, 1), MONTHS_MAX)),
          unit: 'months',
        },
      };
  return {
    id: 'orcamento',
    title: 'Valor sugerido pelo seu orçamento',
    description: '',
    path: '/simulador',
    entries,
  };
}

function SplitBar({ result }: { result: BudgetResult }) {
  const segments = [
    { key: 'essentials', label: 'Essenciais', value: result.essentials },
    { key: 'debts', label: 'Parcelas', value: result.debtPayments },
    { key: 'wants', label: 'Desejos', value: result.wants },
    result.toDebt > 0
      ? { key: 'toDebt', label: 'Quitar a dívida cara', value: result.toDebt }
      : { key: 'invest', label: 'Investir', value: result.invest },
  ].filter((segment) => segment.value > 0);
  // Com déficit, a barra mostra o total dos gastos, que passa do salário.
  const total = Math.max(result.salary, result.essentials + result.debtPayments);
  const summary = segments.map((segment) => `${segment.label} ${formatPercent(segment.value / result.salary)}`).join(', ');

  return (
    <div className={styles.split}>
      <div className={styles.bar} role="img" aria-label={`Divisão do salário: ${summary}`}>
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={styles.segment}
            data-segment={segment.key}
            style={{ flexGrow: segment.value / total }}
          />
        ))}
      </div>
      <ul className={styles.legend}>
        {segments.map((segment) => (
          <li key={segment.key}>
            <span className={styles.swatch} data-segment={segment.key} />
            <span>{segment.label}</span>
            <strong>{formatCurrency(segment.value)}</strong>
            <span className={styles.share}>{formatPercent(segment.value / result.salary)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReserveStatus({ result }: { result: BudgetResult }) {
  const info = useInfo();
  const { reserve } = result;
  const covered = Math.min(reserve.monthsCovered, 6);
  const months = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  return (
    <section className={styles.reserve}>
      <div className={styles.reserveHeader}>
        <h3 className={styles.sectionTitle}>Reserva de emergência</h3>
        <InfoButton label="Reserva de emergência" info={info} />
        <InfoBox info={info}>
          {`Meta = 6 × gastos essenciais por mês\n6 × ${formatCurrency(result.essentials)} = ${formatCurrency(reserve.target)}`}
        </InfoBox>
      </div>
      <progress className={styles.progress} aria-label="Reserva de emergência" value={covered} max={6} />
      <p className={styles.reserveText}>
        {reserve.complete
          ? `Completa: cobre ${months(reserve.monthsCovered)} meses de gastos essenciais.`
          : `Cobre ${months(reserve.monthsCovered)} de 6 meses (${formatCurrency(reserve.current)} de ${formatCurrency(reserve.target)}).` +
            (reserve.monthsToComplete !== null ? ` Completa em cerca de ${reserve.monthsToComplete} meses no ritmo sugerido.` : '')}
      </p>
    </section>
  );
}

export default function BudgetPage() {
  const { applyPreset } = useLayoutContext();
  const [salaryText, setSalaryText] = usePersistentState('budget.salary', '');
  const [essentialsText, setEssentialsText] = usePersistentState('budget.essentials', '');
  const [debtText, setDebtText] = usePersistentState('budget.debtPayments', '');
  const [reserveText, setReserveText] = usePersistentState('budget.reserve', '');
  const [expensiveDebt, setExpensiveDebt] = usePersistentState('budget.expensiveDebt', false);
  const debtInfo = useInfo();

  useEffect(() => {
    document.title = 'Meu orçamento · Simulador de Investimentos';
  }, []);

  const salaryValue = parseInRange(salaryText, 0, FIELD_LIMITS.amountMax);
  const salary = salaryValue !== null && salaryValue > 0 ? salaryValue : null;
  const salaryError = salaryText.trim() !== '' && salary === null ? 'Informe um salário acima de R$ 0.' : undefined;
  const essentials = parseOptional(essentialsText);
  const debtPayments = parseOptional(debtText);
  const reserve = parseOptional(reserveText);
  const optionalInvalid = [essentials, debtPayments, reserve].includes(undefined);

  const result =
    salary !== null && !optionalInvalid
      ? adviseBudget({ salary, essentials, debtPayments, reserve, expensiveDebt })
      : null;

  return (
    <div className={tabStyles.tab}>
      <section className={tabStyles.intro}>
        <h2 className={tabStyles.introTitle}>Meu orçamento</h2>
        <p>
          Informe seu salário líquido e veja quanto separar para gastos essenciais, para desejos e para investir, com
          conselhos para o seu momento. Os outros campos são opcionais, mas deixam a sugestão mais precisa.
        </p>
        <p className={styles.privacy}>
          O que você digitar fica só nesta aba do navegador: não é salvo e não vai no link compartilhado.
        </p>
      </section>

      <form className={tabStyles.form} onSubmit={(event) => event.preventDefault()}>
        <Field
          label="Salário líquido"
          info={EXPLANATIONS.salary}
          suffix="R$"
          placeholder="Ex.: 3.500"
          value={salaryText}
          error={salaryError}
          onChange={setSalaryText}
        />
        <Field
          label="Gastos essenciais por mês"
          info={EXPLANATIONS.essentials}
          suffix="R$"
          placeholder="Opcional"
          value={essentialsText}
          error={essentials === undefined ? AMOUNT_ERROR : undefined}
          onChange={setEssentialsText}
        />
        <Field
          label="Parcelas de dívidas por mês"
          info={EXPLANATIONS.debtPayments}
          suffix="R$"
          placeholder="Opcional"
          value={debtText}
          error={debtPayments === undefined ? AMOUNT_ERROR : undefined}
          onChange={setDebtText}
        />
        <Field
          label="Reserva que já tenho"
          info={EXPLANATIONS.reserveCurrent}
          suffix="R$"
          placeholder="Opcional"
          value={reserveText}
          error={reserve === undefined ? AMOUNT_ERROR : undefined}
          onChange={setReserveText}
        />
        <div className={tabStyles.checkField}>
          <div className={tabStyles.checkRow}>
            <label className={tabStyles.check}>
              <input
                type="checkbox"
                checked={expensiveDebt}
                onChange={(event) => setExpensiveDebt(event.target.checked)}
              />
              Tenho dívida no rotativo do cartão ou no cheque especial
            </label>
            <InfoButton label="Dívida cara" info={debtInfo} />
            <InfoBox info={debtInfo}>{EXPLANATIONS.expensiveDebt}</InfoBox>
          </div>
        </div>
      </form>

      {result ? (
        <>
          <section className={styles.panel}>
            <h3 className={styles.sectionTitle}>Divisão sugerida do salário</h3>
            <SplitBar result={result} />
          </section>

          <ResultCards
            items={[
              {
                label: 'Para essenciais',
                value: formatCurrency(result.essentials),
                info: EXPLANATIONS.budgetEssentials,
              },
              { label: 'Para desejos', value: formatCurrency(result.wants), info: EXPLANATIONS.budgetWants },
              result.toDebt > 0
                ? {
                    label: 'Para quitar a dívida',
                    value: formatCurrency(result.toDebt),
                    tone: 'negative' as const,
                    info: EXPLANATIONS.expensiveDebt,
                  }
                : {
                    label: 'Para investir',
                    value: formatCurrency(result.invest),
                    tone: 'accent' as const,
                    info: EXPLANATIONS.budgetInvest,
                  },
            ]}
          />

          <ReserveStatus result={result} />

          <section className={styles.panel}>
            <h3 className={styles.sectionTitle}>O que fazer agora</h3>
            <ul className={styles.advice} aria-label="Conselhos">
              {result.advice.map((item) => (
                <li key={item.id} className={styles.adviceItem} data-tone={item.tone}>
                  <span className={styles.adviceIcon} aria-hidden="true">
                    {TONE_ICON[item.tone]}
                  </span>
                  <div>
                    <p className={styles.adviceTone}>{TONE_LABEL[item.tone]}</p>
                    <h4 className={styles.adviceTitle}>{item.title}</h4>
                    <p className={styles.adviceText}>{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            {result.invest > 0 && (
              <button type="button" className={styles.simulate} onClick={() => applyPreset(suggestedSimulation(result))}>
                Simular esse valor
              </button>
            )}
          </section>
        </>
      ) : (
        <p className={tabStyles.empty}>
          {salary === null ? 'Informe seu salário líquido para ver a sugestão.' : 'Corrija os campos destacados.'}
        </p>
      )}

      <Disclaimer items={NOT_INCLUDED} />
    </div>
  );
}
