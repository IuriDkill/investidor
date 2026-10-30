import { useId } from 'react';
import styles from './style.module.css';

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  suffix?: string;
  placeholder?: string;
  inputMode?: 'decimal' | 'text';
};

export default function Field({
  label,
  value,
  onChange,
  hint,
  error,
  suffix,
  placeholder,
  inputMode = 'decimal',
}: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.control} data-invalid={error ? 'true' : undefined}>
        <input
          id={id}
          className={styles.input}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      {message && (
        <p id={messageId} className={error ? styles.error : styles.hint}>
          {message}
        </p>
      )}
    </div>
  );
}
