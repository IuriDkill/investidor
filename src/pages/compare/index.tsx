import { useEffect } from 'react';
import Disclaimer from '@/components/Disclaimer';
import GrowthChart, { type ChartLine } from '@/components/GrowthChart';
import InfoButton, { InfoBox } from '@/components/InfoButton';
import { useInfo } from '@/components/InfoButton/useInfo';
import { useLayoutContext } from '@/components/Layout/useLayoutContext';
import PresetList from '@/components/PresetList';
import { compareVerdict, simulateChoice, type Outcome } from '@/lib/compare';
import { formatCurrency, formatPercent } from '@/lib/format';
import { usePersistentState } from '@/utils/usePersistentState';
import CommonFields from '../simulator/CommonFields';
import { commonErrors, DEFAULT_COMMON_VALUES, isCommonValues, parseCommon } from '../simulator/commonValues';
import tabStyles from '../simulator/tabs.module.css';
import CompareSide from './CompareSide';
import {
  DEFAULT_ITEMS,
  isItemList,
  itemLabels,
  MAX_ITEMS,
  MIN_ITEMS,
  nextItem,
  parseSide,
  type SideValues,
} from './sideValues';
import styles from './style.module.css';

const NOT_INCLUDED = [
  'Taxa de custódia do Tesouro, TR da poupança, corretagem e emolumentos.',
  'Mudanças nas taxas e os sobe e desce do mercado: tudo fica constante durante o prazo.',
  'JCP e a retenção de 10% sobre dividendos acima de R$ 50 mil por mês da mesma empresa.',
];

// Cor de cada investimento no gráfico, pela ordem dele na comparação.
const LINE_VARIANTS: ChartLine['variant'][] = ['gross', 'second', 'third', 'fourth'];

// Diferenças abaixo de meio centavo contam como empate.
const CENT = 0.005;

type Row = { label: string; value: (outcome: Outcome) => number; info?: (outcome: Outcome) => string };

const ROWS: Row[] = [
  { label: 'Total investido', value: (outcome) => outcome.invested },
  { label: 'Ganho bruto', value: (outcome) => outcome.grossGain },
  { label: 'Imposto', value: (outcome) => outcome.tax, info: (outcome) => outcome.taxInfo },
  { label: 'Valor líquido', value: (outcome) => outcome.net },
  { label: 'Em dinheiro de hoje', value: (outcome) => outcome.today, info: (outcome) => outcome.todayInfo },
];

// Valor com o botão de explicação, como no imposto e no valor em dinheiro de hoje.
function InfoCell({ name, value, explanation }: { name: string; value: number; explanation: string }) {
  const info = useInfo();
  return (
    <div className={styles.cellRow}>
      <span key={value} className={styles.settle}>
        {formatCurrency(value)}
      </span>
      <InfoButton label={name} info={info} />
      <InfoBox info={info}>{explanation}</InfoBox>
    </div>
  );
}

const joinList = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;

// "do 1º investimento", "do 1º e do 3º investimento" ou "dos dois investimentos".
function missingScenarioText(missing: number[], total: number) {
  if (missing.length === 0) return '';
  if (total === 2 && missing.length === 2) return 'dos dois investimentos';
  return `${joinList(missing.map((index) => `do ${index + 1}º`))} investimento`;
}

export default function ComparePage() {
  const { assumptions, openAssumptions } = useLayoutContext();
  const [common, setCommon] = usePersistentState('compare.common', DEFAULT_COMMON_VALUES, isCommonValues);
  const [items, setItems] = usePersistentState<SideValues[]>('compare.items', DEFAULT_ITEMS, isItemList);

  useEffect(() => {
    document.title = 'Comparar investimentos · Simulador de Investimentos';
  }, []);

  const parsed = items.map(parseSide);
  const labels = itemLabels(items);
  const base = parseCommon(common);
  const choices = parsed.map((side) => side.choice);
  const outcomes =
    base && assumptions && choices.every((choice) => choice !== null)
      ? choices.map((choice) => simulateChoice(choice!, base, assumptions))
      : null;

  // O mais vantajoso é o de maior valor líquido; empate no topo não destaca ninguém.
  const ranking = outcomes ? outcomes.map((outcome, index) => ({ index, net: outcome.net })).sort((a, b) => b.net - a.net) : [];
  const lead = ranking.length > 1 ? ranking[0].net - ranking[1].net : 0;
  const winner = ranking.length > 1 && lead >= CENT ? ranking[0].index : null;

  const verdictText = outcomes
    ? compareVerdict(
        { label: labels[ranking[0].index], net: ranking[0].net },
        { label: labels[ranking[1].index], net: ranking[1].net },
      ) + (items.length > 2 && winner !== null ? ` É o mais vantajoso entre os ${items.length}.` : '')
    : '';

  const missing = missingScenarioText(
    parsed.flatMap((side, index) => (side.missingScenario ? [index] : [])),
    items.length,
  );
  const message = !assumptions
    ? 'Corrija os campos em Premissas para comparar.'
    : !base
      ? 'Corrija os campos destacados para comparar.'
      : missing
        ? `Preencha a valorização e os dividendos esperados ${missing} para comparar.`
        : 'Corrija os campos destacados para comparar.';

  const update = (index: number, values: SideValues) =>
    setItems((current) => current.map((item, position) => (position === index ? values : item)));
  const remove = (index: number) => setItems((current) => current.filter((_, position) => position !== index));
  const add = () => setItems((current) => [...current, nextItem(current)]);

  return (
    <div className={tabStyles.tab}>
      <PresetList
        path="/comparar"
        title="Cenários prontos"
        lead="Comece por uma dúvida comum e ajuste depois. Taxas, valorização e dividendos são só exemplos."
        kind="Cenário"
      />
      <section className={tabStyles.intro}>
        <h2 className={tabStyles.introTitle}>Comparar investimentos</h2>
        <p>
          Escolha os investimentos e veja qual deixa mais dinheiro no fim do mesmo prazo, já descontado o imposto. Todos
          usam o mesmo valor inicial, aporte e prazo, para a comparação ser justa.
        </p>
        <ul className={tabStyles.introList}>
          <li>
            <strong>Rende mais não é o mesmo que sobra mais:</strong> uma LCI pode render menos que um CDB e ainda
            assim deixar mais dinheiro, porque não paga imposto.
          </li>
          <li>
            <strong>Renda variável é uma expectativa:</strong> ao escolher ações ou FIIs, o resultado depende da
            valorização e dos dividendos que você informar.
          </li>
        </ul>
      </section>

      <form className={tabStyles.form} onSubmit={(event) => event.preventDefault()}>
        <button type="button" className={tabStyles.assumptionsButton} onClick={openAssumptions}>
          Premissas
        </button>
        <CommonFields values={common} errors={commonErrors(common)} onChange={setCommon} />
        <div className={styles.sides} data-count={items.length}>
          {items.map((item, index) => (
            <div key={item.id} className={styles.sideSlot}>
              {index > 0 && items.length === 2 && (
                <span className={styles.versus} aria-hidden="true">
                  vs
                </span>
              )}
              <CompareSide
                order={index + 1}
                label={labels[index]}
                values={item}
                errors={parsed[index].errors}
                onChange={(values) => update(index, values)}
                onRemove={items.length > MIN_ITEMS ? () => remove(index) : undefined}
              />
            </div>
          ))}
        </div>
        <div className={styles.addRow}>
          <button type="button" className={styles.add} onClick={add} disabled={items.length >= MAX_ITEMS}>
            + Adicionar investimento
          </button>
          <p className={tabStyles.formNote}>Compare até {MAX_ITEMS} investimentos, para o gráfico continuar legível.</p>
        </div>
      </form>

      {outcomes ? (
        <>
          <p className={styles.verdict} role="status">
            <span key={verdictText} className={styles.settle}>
              {verdictText}
            </span>
          </p>

          <div className={styles.tableWrap}>
            <table className={styles.table} data-count={items.length}>
              <caption className={styles.caption}>Comparação no fim do prazo</caption>
              <thead>
                <tr>
                  <td />
                  {labels.map((label, index) => (
                    <th key={items[index].id} scope="col" data-winner={index === winner || undefined}>
                      {label}
                      {index === winner && <span className={styles.badge}>Mais vantajoso</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} data-row={row.label === 'Valor líquido' ? 'net' : undefined}>
                    <th scope="row">{row.label}</th>
                    {outcomes.map((outcome, index) => {
                      const label = labels[index];
                      const value = row.value(outcome);
                      const isWinner = index === winner;
                      return (
                        <td
                          key={items[index].id}
                          data-label={label}
                          data-winner={isWinner || undefined}
                          data-negative={value < 0 || undefined}
                        >
                          {row.info ? (
                            <InfoCell name={`${row.label} de ${label}`} value={value} explanation={row.info(outcome)} />
                          ) : (
                            <span key={value} className={styles.settle}>
                              {formatCurrency(value)}
                            </span>
                          )}
                          {isWinner && row.label === 'Valor líquido' && (
                            <span className={styles.lead}>+{formatCurrency(lead)} a mais</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={tabStyles.breakdown}>
            Imposto sobre o ganho:{' '}
            {joinList(outcomes.map((outcome, index) => `${labels[index]} paga ${formatPercent(share(outcome))}`))}.
          </p>

          <GrowthChart
            lines={[
              ...outcomes.map((outcome, index) => ({
                label: labels[index],
                values: outcome.series.map((point) => point.gross),
                variant: LINE_VARIANTS[index],
              })),
              {
                label: 'Total investido',
                values: outcomes[0].series.map((point) => point.invested),
                variant: items.length > 2 ? 'reference' : 'invested',
              },
            ]}
          />
        </>
      ) : (
        <p className={tabStyles.empty}>{message}</p>
      )}

      <Disclaimer items={NOT_INCLUDED} />
    </div>
  );
}

const share = (outcome: Outcome) => (outcome.grossGain > 0 ? outcome.tax / outcome.grossGain : 0);
