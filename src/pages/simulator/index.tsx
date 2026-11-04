import { useEffect } from 'react';
import { useLayoutContext } from '@/components/Layout/useLayoutContext';
import PresetList from '@/components/PresetList';
import Tabs from '@/components/Tabs';
import FixedIncomeTab from './FixedIncomeTab';
import VariableIncomeTab from './VariableIncomeTab';

export default function SimulatorPage() {
  const { assumptions, openAssumptions } = useLayoutContext();

  useEffect(() => {
    document.title = 'Simulador · Simulador de Investimentos';
  }, []);

  return (
    <>
      <PresetList
        path="/simulador"
        title="Exemplos prontos"
        lead="Comece por um caso comum e ajuste os valores depois. Os valores são só exemplos."
        kind="Exemplo"
      />
      <Tabs
        persistKey="simulator.tab"
        tabs={[
          {
            id: 'renda-fixa',
            label: 'Renda fixa',
            content: <FixedIncomeTab assumptions={assumptions} onOpenAssumptions={openAssumptions} />,
          },
          {
            id: 'renda-variavel',
            label: 'Renda variável',
            content: <VariableIncomeTab assumptions={assumptions} onOpenAssumptions={openAssumptions} />,
          },
        ]}
      />
    </>
  );
}
