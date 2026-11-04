import Field from '@/components/Field';
import SelectField from '@/components/SelectField';
import { EXPLANATIONS } from '@/content/explanations';
import type { TermUnit } from '@/lib/validate';
import type { CommonErrors, CommonValues } from './commonValues';
import styles from './tabs.module.css';

type CommonFieldsProps = {
  values: CommonValues;
  errors: CommonErrors;
  onChange: (values: CommonValues) => void;
};

const UNIT_OPTIONS = [
  { value: 'years', label: 'Anos' },
  { value: 'months', label: 'Meses' },
];

export default function CommonFields({ values, errors, onChange }: CommonFieldsProps) {
  const update = (changes: Partial<CommonValues>) => onChange({ ...values, ...changes });

  return (
    <>
      <Field
        label="Valor inicial"
        info={EXPLANATIONS.initial}
        suffix="R$"
        value={values.initial}
        error={errors.initial}
        onChange={(initial) => update({ initial })}
      />
      <Field
        label="Aporte mensal"
        info={EXPLANATIONS.monthly}
        suffix="R$"
        value={values.monthly}
        error={errors.monthly}
        onChange={(monthly) => update({ monthly })}
      />
      <div className={styles.term}>
        <Field label="Prazo" info={EXPLANATIONS.term} value={values.term} error={errors.term} onChange={(term) => update({ term })} />
        <SelectField
          label="Unidade"
          value={values.unit}
          options={UNIT_OPTIONS}
          onChange={(unit) => update({ unit: unit as TermUnit })}
        />
      </div>
    </>
  );
}
