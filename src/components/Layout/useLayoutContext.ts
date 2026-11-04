import { useOutletContext } from 'react-router-dom';
import type { Preset } from '@/content/presets';
import type { Assumptions } from '@/lib/assumptions';

// O que o layout compartilha com as páginas: as premissas, o botão que abre o modal delas
// e a aplicação dos exemplos prontos.
export type LayoutContext = {
  assumptions: Assumptions | null;
  openAssumptions: () => void;
  applyPreset: (preset: Preset) => void;
  appliedPreset: Preset | null;
};

export const useLayoutContext = () => useOutletContext<LayoutContext>();
