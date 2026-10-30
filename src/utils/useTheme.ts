import { useState } from 'react';

export type Theme = 'light' | 'dark';

const readTheme = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Sem storage o tema só não fica salvo para a próxima visita.
    }
    setTheme(next);
  };

  return { theme, toggle };
}
