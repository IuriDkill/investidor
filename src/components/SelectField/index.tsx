import { useId } from 'react';
import InfoButton, { InfoBox } from '@/components/InfoButton';
import { useInfo } from '@/components/InfoButton/useInfo';
import styles from './style.module.css';

type SelectFieldProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  info?: string;
};

export default function SelectField({ label, value, options, onChange, info }: SelectFieldProps) {
  const id = useId();
  const explanation = useInfo();

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {info && <InfoButton label={label} info={explanation} />}
        {info && <InfoBox info={explanation}>{info}</InfoBox>}
      </div>
      <select id={id} className={styles.select} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
