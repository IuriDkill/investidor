# Simulador de Investimentos

Site para iniciantes que simula investimentos em renda fixa e renda variável, com uma explicação no início de cada aba e o imposto já descontado. É uma simulação educativa, não uma recomendação de investimento.

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

## Atualizar as taxas

As taxas iniciais dos campos e o mês de referência ficam em `src/config/rates.ts`.

## Estrutura de pastas

```bash
src/
  ├── components/         # Abas, campos, cartões, gráfico e avisos
  ├── config/             # Taxas iniciais e limites dos campos
  ├── lib/                # Cálculos e validação, sem React
  ├── pages/simulator/    # Página e abas de renda fixa e variável
  └── utils/              # useTheme
```
