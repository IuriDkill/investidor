import Tabs from '@/components/Tabs';
import ThemeToggle from '@/components/ThemeToggle';
import FixedIncomeTab from './FixedIncomeTab';
import styles from './style.module.css';
import VariableIncomeTab from './VariableIncomeTab';

export default function SimulatorPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Simulador de Investimentos</h1>
          <p className={styles.subtitle}>Veja quanto seu dinheiro pode render, já descontando o imposto.</p>
        </div>
        <ThemeToggle />
      </header>

      <main>
        <Tabs
          tabs={[
            { id: 'renda-fixa', label: 'Renda fixa', content: <FixedIncomeTab /> },
            { id: 'renda-variavel', label: 'Renda variável', content: <VariableIncomeTab /> },
          ]}
        />
      </main>

      <footer className={styles.footer}>
        Simulação educativa. Não é recomendação de investimento, e resultado passado ou esperado não é garantia.
      </footer>
    </div>
  );
}
