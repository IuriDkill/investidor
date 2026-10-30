import { useMemo, useState } from 'react';
import { ASSUMPTION_DEFAULTS, type AssumptionKey, type AssumptionValues } from '@/config/rates';
import { parseAssumptions } from '@/lib/assumptions';

const STORAGE_KEY = 'assumptions';
const KEYS = Object.keys(ASSUMPTION_DEFAULTS) as AssumptionKey[];

function readStored(): AssumptionValues {
  const values = { ...ASSUMPTION_DEFAULTS };
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof stored !== 'object' || stored === null) return values;

    for (const key of KEYS) {
      const value = (stored as Record<string, unknown>)[key];
      if (typeof value === 'string') values[key] = value;
    }
  } catch {
    // Dado salvo ilegível ou storage indisponível: seguem os padrões.
  }
  return values;
}

// Só o que difere do padrão é salvo, para novos padrões chegarem a quem não alterou o campo.
function writeStored(values: AssumptionValues) {
  const changed = KEYS.filter((key) => values[key] !== ASSUMPTION_DEFAULTS[key]);
  try {
    if (changed.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(changed.map((key) => [key, values[key]]))));
    }
  } catch {
    // Sem storage as alterações só não ficam salvas para a próxima visita.
  }
}

export function useAssumptions() {
  const [values, setValues] = useState(readStored);

  const change = (next: AssumptionValues) => {
    setValues(next);
    writeStored(next);
  };

  return {
    values,
    assumptions: useMemo(() => parseAssumptions(values), [values]),
    update: (key: AssumptionKey, text: string) => change({ ...values, [key]: text }),
    reset: () => change({ ...ASSUMPTION_DEFAULTS }),
  };
}
