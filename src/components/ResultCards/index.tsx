import InfoButton, { InfoBox } from '@/components/InfoButton';
import { useInfo } from '@/components/InfoButton/useInfo';
import styles from './style.module.css';

type ResultItem = { label: string; value: string; tone?: 'default' | 'accent' | 'negative'; info?: string };

function ResultCard({ label, value, tone = 'default', info }: ResultItem) {
  const explanation = useInfo();

  return (
    <div className={styles.card} data-tone={tone}>
      <dt className={styles.label}>
        {label}
        {info && <InfoButton label={label} info={explanation} />}
      </dt>
      <dd className={styles.value}>{value}</dd>
      {info && explanation.open && (
        <dd className={styles.info}>
          <InfoBox info={explanation}>{info}</InfoBox>
        </dd>
      )}
    </div>
  );
}

export default function ResultCards({ items }: { items: ResultItem[] }) {
  return (
    <dl className={styles.grid}>
      {items.map((item) => (
        <ResultCard key={item.label} {...item} />
      ))}
    </dl>
  );
}
