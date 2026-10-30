import styles from './style.module.css';

export default function Disclaimer({ items }: { items: string[] }) {
  return (
    <aside className={styles.disclaimer} aria-label="Avisos sobre a simulação">
      <h3 className={styles.title}>O que esta simulação não considera</h3>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}
