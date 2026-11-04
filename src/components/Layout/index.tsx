import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AssumptionsModal from '@/components/AssumptionsModal';
import ThemeToggle from '@/components/ThemeToggle';
import type { Preset } from '@/content/presets';
import { PersistedStateContext } from '@/utils/persistedStateContext';
import { storeFromSearch } from '@/utils/shareLink';
import { useAssumptions } from '@/utils/useAssumptions';
import ShareButton from './ShareButton';
import type { LayoutContext } from './useLayoutContext';
import styles from './style.module.css';

const PAGES = [
  { to: '/', label: 'Por onde começar' },
  { to: '/simulador', label: 'Simulador' },
  { to: '/comparar', label: 'Comparar' },
];

export default function Layout() {
  const { values, assumptions, update, reset } = useAssumptions();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  // Começa com os dados de um link compartilhado, se houver; cada página confere o que lê.
  const [pageState] = useState(() => storeFromSearch(search));
  // Trocar a versão remonta a página, que então relê o guarda com os valores do exemplo.
  const [version, setVersion] = useState(0);
  const [appliedPreset, setAppliedPreset] = useState<Preset | null>(null);

  const applyPreset = (preset: Preset) => {
    for (const [key, value] of Object.entries(preset.entries)) pageState.set(key, structuredClone(value));
    setAppliedPreset(preset);
    setVersion((current) => current + 1);
    if (preset.path !== pathname) {
      navigate(preset.path);
      document.documentElement.scrollTop = 0;
    }
  };

  const context: LayoutContext = {
    assumptions,
    openAssumptions: () => setModalOpen(true),
    applyPreset,
    appliedPreset,
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Simulador de Investimentos</h1>
          <p className={styles.subtitle}>Veja quanto seu dinheiro pode render, já descontando o imposto.</p>
        </div>
        <div className={styles.actions}>
          <nav className={styles.nav} aria-label="Páginas">
            {PAGES.map((page) => (
              <NavLink key={page.to} to={page.to} end className={styles.navLink}>
                {page.label}
              </NavLink>
            ))}
          </nav>
          <ShareButton pathname={pathname} store={pageState} />
          <ThemeToggle />
        </div>
      </header>

      <main>
        <PersistedStateContext.Provider value={pageState}>
          <div key={`${pathname}:${version}`} className={styles.route}>
            <Outlet context={context} />
          </div>
        </PersistedStateContext.Provider>
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
