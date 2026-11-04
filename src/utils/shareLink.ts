// O link compartilhado leva, no parâmetro `s`, só os dados que mudaram na página atual.

const PAGE_PREFIXES: Record<string, string[]> = {
  '/simulador': ['fixed.', 'variable.', 'simulator.'],
  '/comparar': ['compare.'],
};

export function shareLink(origin: string, pathname: string, store: Map<string, unknown>) {
  const prefixes = PAGE_PREFIXES[pathname] ?? [];
  const entries = [...store].filter(([key]) => prefixes.some((prefix) => key.startsWith(prefix)));
  const query = entries.length > 0 ? `?s=${encodeURIComponent(JSON.stringify(Object.fromEntries(entries)))}` : '';
  return `${origin}${pathname}${query}`;
}

// Lê os dados de um link; qualquer coisa ilegível vira um guarda vazio.
export function storeFromSearch(search: string) {
  const raw = new URLSearchParams(search).get('s');
  if (!raw) return new Map<string, unknown>();
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return new Map<string, unknown>();
    return new Map(Object.entries(data));
  } catch {
    return new Map<string, unknown>();
  }
}
