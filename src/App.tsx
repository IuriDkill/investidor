import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '@/components/Layout';
import BudgetPage from '@/pages/budget';
import ComparePage from '@/pages/compare';
import GuidePage from '@/pages/guide';
import SimulatorPage from '@/pages/simulator';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<GuidePage />} />
        <Route path="orcamento" element={<BudgetPage />} />
        <Route path="simulador" element={<SimulatorPage />} />
        <Route path="comparar" element={<ComparePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
