import { useMemo, useState } from 'react';
import Disclaimer from '@/components/Disclaimer';
import Field from '@/components/Field';
import GrowthChart from '@/components/GrowthChart';
import ResultCards from '@/components/ResultCards';
import SelectField from '@/components/SelectField';
import { FIELD_LIMITS, RATE_DEFAULTS } from '@/config/rates';
import { simulateFixedIncome, type FixedIncomeProduct } from '@/lib/fixedIncome';
import { formatCurrency } from '@/lib/format';
import { parseInRange } from '@/lib/validate';
import CommonFields from './CommonFields';
import { commonErrors, DEFAULT_COMMON_VALUES, parseCommon } from './commonValues';
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

export default function FixedIncomeTab() {
  const [common, setCommon] = useState(DEFAULT_COMMON_VALUES);
  const [product, setProduct] = useState<FixedIncomeProduct>('cdb');
  const [cdiPercents, setCdiPercents] = useState({
    cdb: RATE_DEFAULTS.cdbCdiPercent,
    'lci-lca': RATE_DEFAULTS.lciCdiPercent,
    caixinha: RATE_DEFAULTS.caixinhaCdiPercent,
  });
  const [cdiAnnual, setCdiAnnual] = useState(RATE_DEFAULTS.cdiAnnual);
  const [selicAnnual, setSelicAnnual] = useState(RATE_DEFAULTS.selicAnnual);
  const [ipcaAnnual, setIpcaAnnual] = useState(RATE_DEFAULTS.ipcaAnnual);
  const [realAnnual, setRealAnnual] = useState(RATE_DEFAULTS.realAnnual);

  const usesCdi = product === 'cdb' || product === 'lci-lca' || product === 'caixinha';
  const usesSelic = product === 'tesouro-selic' || product === 'poupanca';
  const usesIpca = product === 'tesouro-ipca';
  const cdiPercent = usesCdi ? cdiPercents[product] : '';

  const result = useMemo(() => {
    const base = parseCommon(common);
    const cdi = parseRate(cdiAnnual);
    const percent = parseCdiPercent(cdiPercent);
    const selic = parseRate(selicAnnual);
    const ipca = parseRate(ipcaAnnual);
    const real = parseRate(realAnnual);

    if (!base) return null;
    if (usesCdi && (cdi === null || percent === null)) return null;
    if (usesSelic && selic === null) return null;
    if (usesIpca && (ipca === null || real === null)) return null;

    return simulateFixedIncome({
      ...base,
      product,
      cdiAnnual: (cdi ?? 0) / 100,
      cdiPercent: (percent ?? 0) / 100,
      selicAnnual: (selic ?? 0) / 100,
      ipcaAnnual: (ipca ?? 0) / 100,
      realAnnual: (real ?? 0) / 100,
    });
  }, [common, product, cdiAnnual, cdiPercent, selicAnnual, ipcaAnnual, realAnnual, usesCdi, usesSelic, usesIpca]);

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
        <SelectField
          label="Produto"
          value={product}
          options={PRODUCTS}
          onChange={(value) => setProduct(value as FixedIncomeProduct)}
        />
        <CommonFields values={common} errors={commonErrors(common)} onChange={setCommon} />

        {usesCdi && (
          <>
            <Field
              label="Percentual do CDI"
              suffix="%"
              value={cdiPercent}
              hint={CDI_PERCENT_HINTS[product]}
              error={parseCdiPercent(cdiPercent) === null ? CDI_PERCENT_ERROR : undefined}
              onChange={(value) => setCdiPercents((current) => ({ ...current, [product]: value }))}
            />
            <Field
              label="CDI anual"
              suffix="%"
              value={cdiAnnual}
              error={parseRate(cdiAnnual) === null ? RATE_ERROR : undefined}
              onChange={setCdiAnnual}
            />
          </>
        )}

        {usesSelic && (
          <Field
            label="Selic anual"
            suffix="%"
            value={selicAnnual}
            error={parseRate(selicAnnual) === null ? RATE_ERROR : undefined}
            onChange={setSelicAnnual}
          />
        )}

        {usesIpca && (
          <>
            <Field
              label="IPCA anual"
              suffix="%"
              value={ipcaAnnual}
              error={parseRate(ipcaAnnual) === null ? RATE_ERROR : undefined}
              onChange={setIpcaAnnual}
            />
            <Field
              label="Juro real anual"
              suffix="%"
              value={realAnnual}
              hint="7% é só um exemplo. Use a taxa oferecida."
              error={parseRate(realAnnual) === null ? RATE_ERROR : undefined}
              onChange={setRealAnnual}
            />
          </>
        )}

        <p className={styles.formNote}>Taxas de referência de {RATE_DEFAULTS.reference}. Você pode alterá-las.</p>
      </form>

      {result ? (
        <>
          <ResultCards
            items={[
              { label: 'Total investido', value: formatCurrency(result.invested) },
              { label: 'Ganho bruto', value: formatCurrency(result.grossGain) },
              { label: 'Imposto', value: formatCurrency(result.tax) },
              { label: 'Valor líquido', value: formatCurrency(result.net), tone: 'accent' },
            ]}
          />
          <GrowthChart series={result.series} />
        </>
      ) : (
        <p className={styles.empty}>Corrija os campos destacados para ver o resultado.</p>
      )}

      <Disclaimer items={NOT_INCLUDED} />
    </div>
  );
}
