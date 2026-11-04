# Simulador de Investimentos

Site para iniciantes que simula investimentos e mostra quanto sobra no fim, já descontado o imposto. É uma simulação educativa, não uma recomendação de investimento.

## Páginas

- **Por onde começar** (`/`, página inicial): guia em seis passos, como reserva de emergência, objetivos, risco, liquidez e garantia, com botões que abrem simulações prontas.
- **Simulador** (`/simulador`): exemplos prontos no topo e abas de renda fixa (CDB, LCI/LCA, caixinha, Tesouro Selic, Tesouro IPCA+ e poupança) e renda variável (ações e FIIs), cada uma com uma explicação no início.
- **Comparar** (`/comparar`): de 2 a 4 investimentos lado a lado, com o mesmo valor inicial, aporte e prazo. Mostra qual deixa mais dinheiro, uma tabela com o mais vantajoso em destaque e o gráfico de todos.

## O que o simulador mostra

- Total investido, ganho bruto, imposto, valor líquido e o valor líquido **em dinheiro de hoje**, descontada a inflação.
- Gráfico da evolução do patrimônio.
- Botões **?** com explicações. A do imposto mostra as fórmulas com os números da simulação.
- **Premissas**: modal para alterar CDI, Selic, IPCA e as regras de imposto e da poupança. As alterações ficam salvas só no navegador de quem as fez.
- **Copiar link**: gera um endereço que reabre a mesma simulação.
- Os dados digitados continuam ao trocar de página, até a página ser recarregada.

## Como rodar

```bash
npm install
npm run dev
```

## Comandos

```bash
npm test          # testes
npm run lint      # lint
npm run build     # build de produção
```

## Deploy

O site é publicado na Cloudflare em `investimento.mundstock.dev.br`, conforme `wrangler.jsonc`.

```bash
npx wrangler login   # só na primeira vez
npm run deploy
```

## Atualizar taxas e regras

Os valores iniciais das taxas e das regras de imposto ficam em `src/config/rates.ts`. Depois de cada reunião do Copom, confira a Selic e o CDI e publique de novo. Os textos dos botões **?** ficam em `src/content/explanations.ts`.

## Estrutura de pastas

```bash
src/
  ├── components/         # Layout, abas, campos, cartões, gráfico, explicações e modal de premissas
  ├── config/             # Taxas, regras e limites dos campos
  ├── content/            # Textos das explicações e exemplos prontos
  ├── lib/                # Cálculos, impostos, inflação, comparação e validação, sem React
  ├── pages/
  │   ├── guide/          # Página inicial: guia "Por onde começar"
  │   ├── simulator/      # Página do simulador e suas abas
  │   └── compare/        # Página de comparação
  └── utils/              # Tema, premissas, estado entre páginas e link compartilhado
```
