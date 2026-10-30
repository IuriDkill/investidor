import { useMemo, useState } from 'react';
import Disclaimer from '@/components/Disclaimer';
import Field from '@/components/Field';
import GrowthChart from '@/components/GrowthChart';
import ResultCards from '@/components/ResultCards';
import SelectField from '@/components/SelectField';
import { FIELD_LIMITS } from '@/config/rates';
import { formatCurrency } from '@/lib/format';
import { parseInRange } from '@/lib/validate';
import { simulateVariableIncome, type VariableAsset } from '@/lib/variableIncome';
import CommonFields from './CommonFields';
import { commonErrors, DEFAULT_COMMON_VALUES, parseCommon } from './commonValues';
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

export default function VariableIncomeTab() {
  const [common, setCommon] = useState(DEFAULT_COMMON_VALUES);
  const [asset, setAsset] = useState<VariableAsset>('acoes');
  const [appreciation, setAppreciation] = useState('');
  const [dividends, setDividends] = useState('');
  const [reinvestDividends, setReinvestDividends] = useState(true);

  const result = useMemo(() => {
    const base = parseCommon(common);
    const appreciationValue = parseAppreciation(appreciation);
    const dividendValue = parseDividends(dividends);

    if (!base || appreciationValue === null || dividendValue === null) return null;

    return simulateVariableIncome({
      ...base,
      asset,
      appreciationAnnual: appreciationValue / 100,
      dividendAnnual: dividendValue / 100,
      reinvestDividends,
    });
  }, [common, asset, appreciation, dividends, reinvestDividends]);

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
        <SelectField
          label="Ativo"
          value={asset}
          options={ASSETS}
          onChange={(value) => setAsset(value as VariableAsset)}
        />
        <CommonFields values={common} errors={commonErrors(common)} onChange={setCommon} />
        <Field
          label="Valorização anual esperada"
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
          suffix="%"
          placeholder="Ex.: 6"
          hint="Percentual sobre o valor da posição."
          value={dividends}
          error={dividends.trim() !== '' && parseDividends(dividends) === null ? 'Informe um valor de 0 a 100.' : undefined}
          onChange={setDividends}
        />
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={reinvestDividends}
            onChange={(event) => setReinvestDividends(event.target.checked)}
          />
          Reinvestir dividendos
        </label>
      </form>

      {result ? (
        <>
          <ResultCards
            items={[
              { label: 'Total investido', value: formatCurrency(result.invested) },
              {
                label: hasLoss ? 'Perda bruta' : 'Ganho bruto',
                value: formatCurrency(result.grossGain),
                tone: hasLoss ? 'negative' : 'default',
              },
              { label: 'Imposto', value: formatCurrency(result.tax) },
              { label: 'Valor líquido', value: formatCurrency(result.net), tone: 'accent' },
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
          {scenarioEmpty
            ? 'Preencha a valorização e os dividendos esperados para ver o resultado.'
            : 'Corrija os campos destacados para ver o resultado.'}
        </p>
      )}

      <Disclaimer items={NOT_INCLUDED} />
    </div>
  );
}
