import { useMemo } from 'react';
import Disclaimer from '@/components/Disclaimer';
import Field from '@/components/Field';
import GrowthChart from '@/components/GrowthChart';
import ResultCards from '@/components/ResultCards';
import SelectField from '@/components/SelectField';
import { FIELD_LIMITS, RATE_DEFAULTS } from '@/config/rates';
import { EXPLANATIONS } from '@/content/explanations';
import { DEFAULT_ASSUMPTIONS, type Assumptions } from '@/lib/assumptions';
import { simulateFixedIncome, type FixedIncomeInput, type FixedIncomeProduct } from '@/lib/fixedIncome';
import { todayValue, todayValueExplanation } from '@/lib/inflation';
import { formatCurrency, formatPercent } from '@/lib/format';
import { fixedTaxExplanation } from '@/lib/taxExplanation';
import { parseInRange } from '@/lib/validate';
import { usePersistentState } from '@/utils/usePersistentState';
import CommonFields from './CommonFields';
import { commonErrors, DEFAULT_COMMON_VALUES, isCommonValues, parseCommon } from './commonValues';
import styles from './tabs.module.css';

const CDI_PERCENT_MAX = 200;
const RATE_ERROR = 'Informe um valor de 0 a 100.';
const CDI_PERCENT_ERROR = 'Informe um valor de 0 a 200.';

const PRODUCTS: { value: FixedIncomeProduct; label: string }[] = [
  { value: 'cdb', label: 'CDB' },
  { value: 'lci-lca', label: 'LCI/LCA' },
  { value: 'caixinha', label: 'Caixinha' },
  { value: 'tesouro-selic', label: 'Tesouro Selic' },
  { value: 'tesouro-ipca', label: 'Tesouro IPCA+' },
  { value: 'poupanca', label: 'Poupança' },
];

const CDI_PERCENT_HINTS: Partial<Record<FixedIncomeProduct, string>> = {
  'lci-lca': '90% é só um exemplo. Use a taxa oferecida.',
  caixinha: '120% é só um exemplo. Use a taxa da sua caixinha.',
};

const NOT_INCLUDED = [
  'Taxa de custódia do Tesouro.',
  'TR da poupança.',
  'Oscilações de preço em caso de venda antecipada.',
  'Mudanças nas taxas: elas ficam constantes durante todo o prazo.',
];

const parseRate = (text: string) => parseInRange(text, 0, FIELD_LIMITS.percentMax);
const parseCdiPercent = (text: string) => parseInRange(text, 0, CDI_PERCENT_MAX);

type FixedIncomeTabProps = {
  assumptions?: Assumptions | null;
  onOpenAssumptions?: () => void;
};

export default function FixedIncomeTab({ assumptions = DEFAULT_ASSUMPTIONS, onOpenAssumptions }: FixedIncomeTabProps) {
  const [common, setCommon] = usePersistentState('fixed.common', DEFAULT_COMMON_VALUES, isCommonValues);
  const [product, setProduct] = usePersistentState<FixedIncomeProduct>('fixed.product', 'cdb', (value) =>
    PRODUCTS.some((option) => option.value === value),
  );
  const [cdiPercents, setCdiPercents] = usePersistentState('fixed.cdiPercents', {
    cdb: RATE_DEFAULTS.cdbCdiPercent,
    'lci-lca': RATE_DEFAULTS.lciCdiPercent,
    caixinha: RATE_DEFAULTS.caixinhaCdiPercent,
  });
  const [realAnnual, setRealAnnual] = usePersistentState('fixed.realAnnual', RATE_DEFAULTS.realAnnual);

  const usesCdi = product === 'cdb' || product === 'lci-lca' || product === 'caixinha';
  const usesIpca = product === 'tesouro-ipca';
  const cdiPercent = usesCdi ? cdiPercents[product] : '';

  const result = useMemo(() => {
    const base = parseCommon(common);
    const percent = parseCdiPercent(cdiPercent);
    const real = parseRate(realAnnual);

    if (!base || !assumptions) return null;
    if (usesCdi && percent === null) return null;
    if (usesIpca && real === null) return null;

    const input: FixedIncomeInput = {
      ...base,
      product,
      cdiAnnual: assumptions.cdiAnnual,
      cdiPercent: (percent ?? 0) / 100,
      selicAnnual: assumptions.selicAnnual,
      ipcaAnnual: assumptions.ipcaAnnual,
      realAnnual: (real ?? 0) / 100,
      rules: assumptions.rules,
    };
    const output = simulateFixedIncome(input);
    return {
      ...output,
      taxInfo: fixedTaxExplanation(input, output),
      today: todayValue(output.net, assumptions.ipcaAnnual, base.months),
      todayInfo: todayValueExplanation(output.net, assumptions.ipcaAnnual, base.months),
    };
  }, [common, product, cdiPercent, realAnnual, usesCdi, usesIpca, assumptions]);

  const marketRate = () => {
    if (!assumptions) return null;
    if (usesCdi) return `CDI de ${formatPercent(assumptions.cdiAnnual)}`;
    return usesIpca
      ? `IPCA de ${formatPercent(assumptions.ipcaAnnual)}`
      : `Selic de ${formatPercent(assumptions.selicAnnual)}`;
  };

  return (
    <div className={styles.tab}>
      <section className={styles.intro}>
        <h2 className={styles.introTitle}>O que é renda fixa?</h2>
        <p>
          Na renda fixa, você empresta dinheiro a um banco ou ao governo e recebe juros em troca. A regra de
          remuneração é conhecida no momento da aplicação, por isso o resultado costuma ser mais previsível.
        </p>
        <ul className={styles.introList}>
          <li>
            <strong>CDB:</strong> empréstimo a um banco. Costuma render um percentual do CDI, taxa que acompanha de
            perto a Selic.
          </li>
          <li>
            <strong>LCI/LCA:</strong> parecidas com o CDB, mas ligadas aos setores imobiliário e agrícola e isentas de
            imposto de renda para pessoa física.
          </li>
          <li>
            <strong>Caixinha:</strong> reserva de bancos digitais que costuma render um percentual do CDI, às vezes
            acima de 100%. Em geral é um CDB ou RDB, com o mesmo imposto, mas vale conferir as regras da sua.
          </li>
          <li>
            <strong>Tesouro Selic:</strong> título do governo que acompanha a taxa básica de juros.
          </li>
          <li>
            <strong>Tesouro IPCA+:</strong> título do governo que paga a inflação mais um juro real, protegendo seu
            poder de compra.
          </li>
          <li>
            <strong>Poupança:</strong> simples e isenta de imposto de renda, mas costuma render menos.
          </li>
        </ul>
        <p>
          <strong>Imposto:</strong> em CDB, caixinhas e Tesouro, quanto mais tempo o dinheiro fica aplicado, menor o
          imposto sobre o rendimento. A alíquota vai de 22,5% (até 180 dias) a 15% (acima de 720 dias).
        </p>
      </section>

      <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
        <button type="button" className={styles.assumptionsButton} onClick={onOpenAssumptions}>
          Premissas
        </button>
        <SelectField
          label="Produto"
          info={EXPLANATIONS.product}
          value={product}
          options={PRODUCTS}
          onChange={(value) => setProduct(value as FixedIncomeProduct)}
        />
        <CommonFields values={common} errors={commonErrors(common)} onChange={setCommon} />

        {usesCdi && (
          <>
            <Field
              label="Percentual do CDI"
              info={EXPLANATIONS.cdiPercent}
              suffix="%"
              value={cdiPercent}
              hint={CDI_PERCENT_HINTS[product]}
              error={parseCdiPercent(cdiPercent) === null ? CDI_PERCENT_ERROR : undefined}
              onChange={(value) => setCdiPercents((current) => ({ ...current, [product]: value }))}
            />
          </>
        )}

        {usesIpca && (
          <Field
            label="Juro real anual"
            info={EXPLANATIONS.realAnnual}
            suffix="%"
            value={realAnnual}
            hint="7% é só um exemplo. Use a taxa oferecida."
            error={parseRate(realAnnual) === null ? RATE_ERROR : undefined}
            onChange={setRealAnnual}
          />
        )}

        <p className={styles.formNote}>
          {assumptions && `Calculando com ${marketRate()} ao ano. `}
          Padrões de {RATE_DEFAULTS.reference}. Para alterar taxas e regras de imposto, use o botão Premissas.
        </p>
      </form>

      {result ? (
        <>
          <ResultCards
            items={[
              { label: 'Total investido', value: formatCurrency(result.invested), info: EXPLANATIONS.invested },
              { label: 'Ganho bruto', value: formatCurrency(result.grossGain), info: EXPLANATIONS.grossGain },
              { label: 'Imposto', value: formatCurrency(result.tax), info: result.taxInfo },
              { label: 'Valor líquido', value: formatCurrency(result.net), tone: 'accent', info: EXPLANATIONS.net },
              {
                label: 'Em dinheiro de hoje',
                value: formatCurrency(result.today),
                info: result.todayInfo,
              },
            ]}
          />
          <GrowthChart series={result.series} />
        </>
      ) : (
        <p className={styles.empty}>
          {assumptions
            ? 'Corrija os campos destacados para ver o resultado.'
            : 'Corrija os campos em Premissas para ver o resultado.'}
        </p>
      )}

      <Disclaimer items={NOT_INCLUDED} />
    </div>
  );
}
