import { useMemo } from 'react';
import Disclaimer from '@/components/Disclaimer';
import Field from '@/components/Field';
import InfoButton, { InfoBox } from '@/components/InfoButton';
import { useInfo } from '@/components/InfoButton/useInfo';
import GrowthChart from '@/components/GrowthChart';
import ResultCards from '@/components/ResultCards';
import SelectField from '@/components/SelectField';
import { FIELD_LIMITS } from '@/config/rates';
import { EXPLANATIONS } from '@/content/explanations';
import { DEFAULT_ASSUMPTIONS, type Assumptions } from '@/lib/assumptions';
import { todayValue, todayValueExplanation } from '@/lib/inflation';
import { formatCurrency } from '@/lib/format';
import { parseInRange } from '@/lib/validate';
import { usePersistentState } from '@/utils/usePersistentState';
import { variableTaxExplanation } from '@/lib/taxExplanation';
import { simulateVariableIncome, type VariableAsset, type VariableIncomeInput } from '@/lib/variableIncome';
import CommonFields from './CommonFields';
import { commonErrors, DEFAULT_COMMON_VALUES, isCommonValues, parseCommon } from './commonValues';
import styles from './tabs.module.css';

const ASSETS: { value: VariableAsset; label: string }[] = [
  { value: 'acoes', label: 'Ações' },
  { value: 'fiis', label: 'FIIs' },
];

const NOT_INCLUDED = [
  'Os sobe e desce do mercado: as taxas ficam constantes durante todo o prazo.',
  'Corretagem e emolumentos.',
  'JCP (juros sobre capital próprio).',
  'A retenção de 10% sobre dividendos acima de R$ 50 mil por mês da mesma empresa.',
];

const parseAppreciation = (text: string) =>
  parseInRange(text, FIELD_LIMITS.appreciationMin, FIELD_LIMITS.percentMax);
const parseDividends = (text: string) => parseInRange(text, 0, FIELD_LIMITS.percentMax);

type VariableIncomeTabProps = {
  assumptions?: Assumptions | null;
  onOpenAssumptions?: () => void;
};

export default function VariableIncomeTab({
  assumptions = DEFAULT_ASSUMPTIONS,
  onOpenAssumptions,
}: VariableIncomeTabProps) {
  const [common, setCommon] = usePersistentState('variable.common', DEFAULT_COMMON_VALUES, isCommonValues);
  const [asset, setAsset] = usePersistentState<VariableAsset>('variable.asset', 'acoes', (value) =>
    ASSETS.some((option) => option.value === value),
  );
  const [appreciation, setAppreciation] = usePersistentState('variable.appreciation', '');
  const [dividends, setDividends] = usePersistentState('variable.dividends', '');
  const [reinvestDividends, setReinvestDividends] = usePersistentState('variable.reinvest', true);
  const reinvestInfo = useInfo();

  const result = useMemo(() => {
    const base = parseCommon(common);
    const appreciationValue = parseAppreciation(appreciation);
    const dividendValue = parseDividends(dividends);

    if (!base || !assumptions || appreciationValue === null || dividendValue === null) return null;

    const input: VariableIncomeInput = {
      ...base,
      asset,
      appreciationAnnual: appreciationValue / 100,
      dividendAnnual: dividendValue / 100,
      reinvestDividends,
      rules: assumptions.rules,
    };
    const output = simulateVariableIncome(input);
    return {
      ...output,
      taxInfo: variableTaxExplanation(input, output),
      today: todayValue(output.net, assumptions.ipcaAnnual, base.months),
      todayInfo: todayValueExplanation(output.net, assumptions.ipcaAnnual, base.months),
    };
  }, [common, asset, appreciation, dividends, reinvestDividends, assumptions]);

  const scenarioEmpty = appreciation.trim() === '' || dividends.trim() === '';
  const hasLoss = result !== null && result.grossGain < 0;

  return (
    <div className={styles.tab}>
      <section className={styles.intro}>
        <h2 className={styles.introTitle}>O que é renda variável?</h2>
        <p>
          Na renda variável, você vira sócio de empresas ou de imóveis comprando ações ou cotas de fundos imobiliários
          (FIIs). O preço muda todos os dias, então o resultado pode ser bem melhor ou bem pior do que o esperado.
        </p>
        <ul className={styles.introList}>
          <li>
            <strong>Sem garantia:</strong> ninguém sabe quanto um ativo vai render, e você pode perder parte do dinheiro.
          </li>
          <li>
            <strong>Valorização:</strong> é o quanto o preço do ativo sobe ou cai com o tempo.
          </li>
          <li>
            <strong>Dividendos:</strong> são a parte do lucro ou dos aluguéis paga a quem tem o ativo. Você pode gastar
            ou reinvestir esse dinheiro.
          </li>
        </ul>
        <p>
          <strong>Imposto:</strong> ao vender com lucro, você paga 15% em ações e 20% em FIIs. Em ações, vendas de até
          R$ 20 mil no mês são isentas.
        </p>
        <p>Abaixo, os percentuais são seus: informe o cenário que você espera.</p>
      </section>

      <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
        <button type="button" className={styles.assumptionsButton} onClick={onOpenAssumptions}>
          Premissas
        </button>
        <SelectField
          label="Ativo"
          info={EXPLANATIONS.asset}
          value={asset}
          options={ASSETS}
          onChange={(value) => setAsset(value as VariableAsset)}
        />
        <CommonFields values={common} errors={commonErrors(common)} onChange={setCommon} />
        <Field
          label="Valorização anual esperada"
          info={EXPLANATIONS.appreciation}
          suffix="%"
          placeholder="Ex.: 8"
          inputMode="text"
          hint="Sua expectativa. Pode ser negativa."
          value={appreciation}
          error={appreciation.trim() !== '' && parseAppreciation(appreciation) === null ? 'Informe um valor de -99 a 100.' : undefined}
          onChange={setAppreciation}
        />
        <Field
          label="Dividendos anuais esperados"
          info={EXPLANATIONS.dividends}
          suffix="%"
          placeholder="Ex.: 6"
          hint="Percentual sobre o valor da posição."
          value={dividends}
          error={dividends.trim() !== '' && parseDividends(dividends) === null ? 'Informe um valor de 0 a 100.' : undefined}
          onChange={setDividends}
        />
        <div className={styles.checkField}>
          <div className={styles.checkRow}>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={reinvestDividends}
                onChange={(event) => setReinvestDividends(event.target.checked)}
              />
              Reinvestir dividendos
            </label>
            <InfoButton label="Reinvestir dividendos" info={reinvestInfo} />
            <InfoBox info={reinvestInfo}>{EXPLANATIONS.reinvest}</InfoBox>
          </div>
        </div>
      </form>

      {result ? (
        <>
          <ResultCards
            items={[
              { label: 'Total investido', value: formatCurrency(result.invested), info: EXPLANATIONS.invested },
              {
                label: hasLoss ? 'Perda bruta' : 'Ganho bruto',
                value: formatCurrency(result.grossGain),
                tone: hasLoss ? 'negative' : 'default',
                info: hasLoss ? EXPLANATIONS.grossLoss : EXPLANATIONS.grossGain,
              },
              { label: 'Imposto', value: formatCurrency(result.tax), info: result.taxInfo },
              { label: 'Valor líquido', value: formatCurrency(result.net), tone: 'accent', info: EXPLANATIONS.net },
              {
                label: 'Em dinheiro de hoje',
                value: formatCurrency(result.today),
                info: result.todayInfo,
              },
            ]}
          />
          <p className={styles.breakdown}>
            O resultado bruto vem de {formatCurrency(result.appreciationGain)} de valorização e{' '}
            {formatCurrency(result.dividends)} de dividendos.
          </p>
          <GrowthChart series={result.series} />
        </>
      ) : (
        <p className={styles.empty}>
          {!assumptions
            ? 'Corrija os campos em Premissas para ver o resultado.'
            : scenarioEmpty
              ? 'Preencha a valorização e os dividendos esperados para ver o resultado.'
              : 'Corrija os campos destacados para ver o resultado.'}
        </p>
      )}

      <Disclaimer items={NOT_INCLUDED} />
    </div>
  );
}
