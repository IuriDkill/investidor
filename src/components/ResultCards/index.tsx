import styles from './style.module.css';

type ResultItem = { label: string; value: string; tone?: 'default' | 'accent' | 'negative' };

export default function ResultCards({ items }: { items: ResultItem[] }) {
  return (
    <dl className={styles.grid}>
      {items.map(({ label, value, tone = 'default' }) => (
        <div key={label} className={styles.card} data-tone={tone}>
          <dt className={styles.label}>{label}</dt>
          <dd className={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
