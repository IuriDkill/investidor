import { useState } from 'react';
import AssumptionsModal from '@/components/AssumptionsModal';
import Tabs from '@/components/Tabs';
import ThemeToggle from '@/components/ThemeToggle';
import { useAssumptions } from '@/utils/useAssumptions';
import FixedIncomeTab from './FixedIncomeTab';
import styles from './style.module.css';
import VariableIncomeTab from './VariableIncomeTab';

export default function SimulatorPage() {
  const { values, assumptions, update, reset } = useAssumptions();
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);

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
            {
              id: 'renda-fixa',
              label: 'Renda fixa',
              content: <FixedIncomeTab assumptions={assumptions} onOpenAssumptions={openModal} />,
            },
            {
              id: 'renda-variavel',
              label: 'Renda variável',
              content: <VariableIncomeTab assumptions={assumptions} onOpenAssumptions={openModal} />,
            },
          ]}
        />
      </main>

      <AssumptionsModal
        open={modalOpen}
        values={values}
        onChange={update}
        onReset={reset}
        onClose={() => setModalOpen(false)}
      />

      <footer className={styles.footer}>
        Simulação educativa. Não é recomendação de investimento, e resultado passado ou esperado não é garantia.
      </footer>
    </div>
  );
}
