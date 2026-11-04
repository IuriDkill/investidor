import { createContext } from 'react';

// Guarda o estado das páginas enquanto o app está aberto, para ele sobreviver à troca de página.
// Fora do layout (como nos testes de uma aba isolada) não há guarda e cada componente usa o próprio estado.
export const PersistedStateContext = createContext<Map<string, unknown> | null>(null);
