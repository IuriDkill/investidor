import Field from '@/components/Field';
import InfoButton, { InfoBox } from '@/components/InfoButton';
import { useInfo } from '@/components/InfoButton/useInfo';
import SelectField from '@/components/SelectField';
import { EXPLANATIONS } from '@/content/explanations';
import { isVariableProduct, PRODUCT_LABELS, type ProductId } from '@/lib/compare';
import { usesCdi, type SideErrors, type SideValues } from './sideValues';
import tabStyles from '../simulator/tabs.module.css';
import styles from './style.module.css';

const PRODUCT_OPTIONS = (Object.keys(PRODUCT_LABELS) as ProductId[]).map((value) => ({
  value,
  label: PRODUCT_LABELS[value],
}));

const CDI_HINTS: Partial<Record<ProductId, string>> = {
  'lci-lca': '90% é só um exemplo. Use a taxa oferecida.',
  caixinha: '120% é só um exemplo. Use a taxa da sua caixinha.',
};

type CompareSideProps = {
  order: number;
  label: string;
  values: SideValues;
  errors: SideErrors;
  onChange: (values: SideValues) => void;
  onRemove?: () => void;
};

export default function CompareSide({ order, label, values, errors, onChange, onRemove }: CompareSideProps) {
  const { product } = values;
  const reinvestInfo = useInfo();
  const update = (changes: Partial<SideValues>) => onChange({ ...values, ...changes });

  return (
    <fieldset className={styles.side} data-side={order}>
      <legend className={styles.sideLegend}>
        <span className={styles.order}>{order}º</span> <span className={styles.sideTitle}>{label}</span>
      </legend>
      {onRemove && (
        <button type="button" className={styles.remove} aria-label={`Remover ${label}`} title="Remover" onClick={onRemove}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.removeIcon}>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
      <div className={styles.sideFields}>
        <SelectField
          label="Produto"
          info={EXPLANATIONS.product}
          value={product}
          options={PRODUCT_OPTIONS}
          onChange={(value) => update({ product: value as ProductId })}
        />

        {usesCdi(product) && (
          <Field
            label="Percentual do CDI"
            info={EXPLANATIONS.cdiPercent}
            suffix="%"
            hint={CDI_HINTS[product]}
            value={values.cdiPercents[product]}
            error={errors.cdiPercent}
            onChange={(text) => update({ cdiPercents: { ...values.cdiPercents, [product]: text } })}
          />
        )}

        {product === 'tesouro-ipca' && (
          <Field
            label="Juro real anual"
            info={EXPLANATIONS.realAnnual}
            suffix="%"
            hint="7% é só um exemplo. Use a taxa oferecida."
            value={values.realAnnual}
            error={errors.realAnnual}
            onChange={(realAnnual) => update({ realAnnual })}
          />
        )}

        {isVariableProduct(product) && (
          <>
            <Field
              label="Valorização anual esperada"
              info={EXPLANATIONS.appreciation}
              suffix="%"
              placeholder="Ex.: 8"
              inputMode="text"
              value={values.appreciation}
              error={errors.appreciation}
              onChange={(appreciation) => update({ appreciation })}
            />
            <Field
              label="Dividendos anuais esperados"
              info={EXPLANATIONS.dividends}
              suffix="%"
              placeholder="Ex.: 6"
              value={values.dividends}
              error={errors.dividends}
              onChange={(dividends) => update({ dividends })}
            />
            <div className={tabStyles.checkRow}>
              <label className={tabStyles.check}>
                <input
                  type="checkbox"
                  checked={values.reinvest}
                  onChange={(event) => update({ reinvest: event.target.checked })}
                />
                Reinvestir dividendos
              </label>
              <InfoButton label="Reinvestir dividendos" info={reinvestInfo} />
              <InfoBox info={reinvestInfo}>{EXPLANATIONS.reinvest}</InfoBox>
            </div>
          </>
        )}
      </div>
    </fieldset>
  );
}
