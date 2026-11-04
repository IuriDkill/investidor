import { useCallback, useContext, useState, type SetStateAction } from 'react';
import { PersistedStateContext } from './persistedStateContext';

// Mesmo formato do valor inicial: mesmos tipos e, em objetos, as mesmas chaves.
// O valor guardado pode ter vindo de um link compartilhado, então nada é confiado sem conferir.
function matchesShape(value: unknown, sample: unknown): boolean {
  if (sample === null || typeof sample !== 'object') return typeof value === typeof sample;
  // Listas: todo item precisa ter o formato do primeiro item do valor inicial.
  if (Array.isArray(sample)) {
    return Array.isArray(value) && (sample.length === 0 || value.every((item) => matchesShape(item, sample[0])));
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.keys(sample).every((key) =>
    matchesShape((value as Record<string, unknown>)[key], (sample as Record<string, unknown>)[key]),
  );
}

// Igual a useState, mas o valor fica guardado pela chave e volta quando a página é montada de novo.
// `isValid` confere o que o formato não garante, como um produto que existe.
export function usePersistentState<T>(key: string, initial: T | (() => T), isValid?: (value: T) => boolean) {
  const store = useContext(PersistedStateContext);
  const [value, setValue] = useState<T>(() => {
    const fallback = initial instanceof Function ? initial() : initial;
    const stored = store?.get(key);
    const usable = store?.has(key) && matchesShape(stored, fallback) && (!isValid || isValid(stored as T));
    return usable ? (stored as T) : fallback;
  });

  const update = useCallback(
    (next: SetStateAction<T>) =>
      setValue((previous) => {
        const resolved = next instanceof Function ? next(previous) : next;
        store?.set(key, resolved);
        return resolved;
      }),
    [store, key],
  );

  return [value, update] as const;
}
