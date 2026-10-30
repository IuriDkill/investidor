# Simulador de investimentos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um site para iniciantes que simula renda fixa e renda variável em abas, com explicação no início de cada aba e a paleta do Mundstock.

**Architecture:** App React sem backend. Funções puras em `src/lib/` fazem validação e cálculo; componentes em `src/components/` só exibem; cada aba guarda os campos como texto, valida e chama a simulação a cada alteração.

**Tech Stack:** React 19, Vite 6, TypeScript 5.8, CSS Modules, Vitest 3, Testing Library, jsdom.

**Spec:** `docs/superpowers/specs/2026-10-30-simulador-investimentos-design.md`

## Global Constraints

- Texto da interface só em português do Brasil.
- Sem biblioteca de gráficos, backend, API de taxas ou login. `localStorage` só guarda o tema.
- Tokens de cor, raios, sombras e fontes copiados de `../mundstock/src/index.css`.
- Tema escuro como padrão, com o mesmo script anti-flash de `../mundstock/index.html`.
- Sem rolagem horizontal da página até 320 px; respeitar `prefers-reduced-motion`.
- `src/lib/` não importa React; componentes não fazem cálculo financeiro.
- Dentro de `src/lib/`, taxas são decimais (`0.1365` = 13,65%). A conversão de % para decimal acontece nas abas.
- 1 mês = 30 dias. Arredondamento só na exibição.

## Review Focus

- Digitação em pt-BR, como `1.000,50`, `13,65` e `1000.5`: interpretar o número certo, sem multiplicar por mil (teste na Task 1).
- Campo no meio da digitação, como vazio, `-` ou `13,`: nunca mostrar `NaN` ou derrubar a tela (testes nas Tasks 1, 6 e 7).
- Prazo em anos com fração ou acima do limite, como `1,5` anos ou `51` anos: virar 18 meses ou erro no campo (teste na Task 1).
- Gráfico sem variação, ou com valores enormes (R$ 1 bilhão por 600 meses a 100% a.a.): sem divisão por zero, `Infinity` ou `NaN` no SVG (teste na Task 5).
- Troca de produto ou de aba com campos preenchidos: nada se perde (testes nas Tasks 6 e 7).

---

### Task 1: Base do projeto, taxas e validação

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `.gitignore`, `.npmrc`, `eslint.config.js`, `public/favicon.svg`
- Create: `src/main.tsx`, `src/vite-env.d.ts`, `src/index.css`, `src/test/setup.ts`
- Create: `src/lib/finance.ts`, `src/lib/validate.ts`, `src/lib/format.ts`, `src/config/rates.ts`
- Test: `src/lib/finance.test.ts`, `src/lib/validate.test.ts`, `src/lib/format.test.ts`

**Interfaces:**
- Produces:
  - `monthlyRate(annual: number): number`
  - `incomeTaxRate(days: number): number`
  - `parseDecimal(text: string): number | null`
  - `parseInRange(text: string, min: number, max: number): number | null`
  - `type TermUnit = 'months' | 'years'`
  - `toMonths(text: string, unit: TermUnit): number | null`
  - `formatCurrency(value: number): string`
  - `formatPercent(value: number): string` (recebe decimal)
  - `RATE_DEFAULTS` com strings para os campos: `cdiAnnual: '13,65'`, `cdbCdiPercent: '100'`, `lciCdiPercent: '90'`, `selicAnnual: '13,75'`, `ipcaAnnual: '5,2'`, `realAnnual: '7'`, `reference: 'outubro de 2026'`
  - `FIELD_LIMITS = { amountMax: 1_000_000_000, monthsMax: 600, appreciationMin: -99, percentMax: 100 }`

- [ ] **Step 1: Criar o branch e a base**

Rode `git checkout -b feat/simulador`. Copie de `../mundstock` as dependências e scripts `dev`, `build`, `lint` e `preview`, sem `three`, `framer-motion`, `i18next`, `react-router-dom`, `wrangler` e `vite-plugin-svgr`. Adicione o script `test: vitest run` e as dependências de desenvolvimento `vitest@^3`, `jsdom@^26`, `@testing-library/react@^16`, `@testing-library/user-event@^14` e `@testing-library/jest-dom@^6`. Configure Vitest com `environment: 'jsdom'`, `globals: true`, `setupFiles: './src/test/setup.ts'` e `css: { modules: { classNameStrategy: 'non-scoped' } }`. Mantenha o alias `@`. Copie `.gitignore`, `.npmrc`, `eslint.config.js` e o `tsconfig*`. Copie `index.css` sem as variáveis `--scene-*`, trocando o título do `index.html` por `Simulador de Investimentos` e removendo as metas pessoais de autor.

- [ ] **Step 2: Instalar**

Run: `npm install`
Expected: termina sem erro.

- [ ] **Step 3: Escrever os testes**

```ts
// finance.test.ts
expect(monthlyRate(0.12)).toBeCloseTo(0.0094888, 6)
expect(incomeTaxRate(180)).toBe(0.225)
expect(incomeTaxRate(181)).toBe(0.2)
expect(incomeTaxRate(360)).toBe(0.2)
expect(incomeTaxRate(361)).toBe(0.175)
expect(incomeTaxRate(720)).toBe(0.175)
expect(incomeTaxRate(721)).toBe(0.15)

// validate.test.ts
expect(parseDecimal('1.000,50')).toBe(1000.5)
expect(parseDecimal('1.000')).toBe(1000)
expect(parseDecimal('1.000.000')).toBe(1000000)
expect(parseDecimal('13,65')).toBe(13.65)
expect(parseDecimal('13.65')).toBe(13.65)
expect(parseDecimal('1000.5')).toBe(1000.5)
expect(parseDecimal('13,')).toBe(13)
expect(parseDecimal(' 200 ')).toBe(200)
expect(parseDecimal('-5')).toBe(-5)
expect(parseDecimal('')).toBeNull()
expect(parseDecimal('-')).toBeNull()
expect(parseDecimal('abc')).toBeNull()
expect(parseDecimal('1,2,3')).toBeNull()
expect(parseInRange('101', 0, 100)).toBeNull()
expect(parseInRange('100', 0, 100)).toBe(100)
expect(toMonths('1,5', 'years')).toBe(18)
expect(toMonths('5', 'years')).toBe(60)
expect(toMonths('50', 'years')).toBe(600)
expect(toMonths('51', 'years')).toBeNull()
expect(toMonths('601', 'months')).toBeNull()
expect(toMonths('0', 'months')).toBeNull()
expect(toMonths('1,5', 'months')).toBeNull()
expect(toMonths('0,01', 'years')).toBeNull()

// format.test.ts: normalize o espaço não separável antes de comparar
expect(formatCurrency(1096)).toBe('R$ 1.096,00')
expect(formatCurrency(-2000)).toBe('-R$ 2.000,00')
expect(formatPercent(0.1365)).toBe('13,65%')
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx vitest run src/lib`
Expected: FAIL porque os módulos não existem.

- [ ] **Step 5: Implementar `finance.ts`, `validate.ts`, `format.ts` e `rates.ts`**

Em `parseDecimal`: com vírgula, remova pontos e troque a vírgula por ponto; sem vírgula, trate pontos como milhar só se casar com `^-?\d{1,3}(\.\d{3})+$`. Depois exija `^-?\d+(\.\d*)?$`. Em `toMonths`, meses precisam ser inteiros; anos viram `Math.round(valor * 12)` e o resultado precisa ficar entre 1 e 600. `format.ts` usa `Intl.NumberFormat('pt-BR')`. `main.tsx` renderiza um placeholder até a Task 4.

- [ ] **Step 6: Rodar e ver passar**

Run: `npm test` e depois `npm run build`
Expected: testes em PASS e build sem erro.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: base do projeto, taxas e validação"
```

### Task 2: Simulação de renda fixa

**Files:**
- Create: `src/lib/fixedIncome.ts`
- Test: `src/lib/fixedIncome.test.ts`

**Interfaces:**
- Consumes: `monthlyRate`, `incomeTaxRate`
- Produces:
  - `type SimulationPoint = { month: number; invested: number; gross: number }`
  - `type FixedIncomeProduct = 'cdb' | 'lci-lca' | 'tesouro-selic' | 'tesouro-ipca' | 'poupanca'`
  - `type FixedIncomeInput = { product: FixedIncomeProduct; initial: number; monthly: number; months: number; cdiAnnual: number; cdiPercent: number; selicAnnual: number; ipcaAnnual: number; realAnnual: number }` (`cdiPercent: 1` = 100% do CDI)
  - `type FixedIncomeResult = { invested: number; grossGain: number; tax: number; net: number; series: SimulationPoint[] }`
  - `simulateFixedIncome(input: FixedIncomeInput): FixedIncomeResult`

- [ ] **Step 1: Escrever os testes**

Use `base = { product: 'cdb', initial: 1000, monthly: 0, months: 12, cdiAnnual: 0.12, cdiPercent: 1, selicAnnual: 0.12, ipcaAnnual: 0.05, realAnnual: 0.07 }`.

```ts
test('exemplo da spec', () => {
  const r = simulateFixedIncome(base)
  expect(r.invested).toBe(1000)
  expect(r.grossGain).toBeCloseTo(120, 6)
  expect(r.tax).toBeCloseTo(24, 6)
  expect(r.net).toBeCloseTo(1096, 6)
})
test.each([[6, 0.225], [7, 0.2], [12, 0.2], [13, 0.175], [24, 0.175], [25, 0.15]])(
  'fronteira do IR em %i meses', (months, rate) => {
    const r = simulateFixedIncome({ ...base, months })
    expect(r.tax).toBeCloseTo(r.grossGain * rate, 6)
  })
test('cada lote tem a própria alíquota', () => {
  const r = simulateFixedIncome({ ...base, monthly: 1000, months: 7 })
  const i = 1.12 ** (1 / 12) - 1
  let expected = 1000 * ((1 + i) ** 7 - 1) * 0.2
  for (let age = 1; age <= 6; age++) expected += 1000 * ((1 + i) ** age - 1) * 0.225
  expect(r.tax).toBeCloseTo(expected, 6)
  expect(r.invested).toBe(8000)
})
```

Inclua também:
- LCI/LCA com `cdiPercent: 0.9`: `tax === 0`, `net` ≈ `1000 * (1 + 0.12 * 0.9)`.
- Poupança com Selic `0.1375`: `net` ≈ `1000 * 1.005 ** 12`, `tax === 0`.
- Poupança com Selic `0.06`: `net` ≈ `1000 * 1.0035 ** 12`.
- Poupança com Selic exatamente `0.085`: usa `0.7 * 0.085 / 12`.
- Tesouro IPCA+ com IPCA `0.05` e real `0.07`: `grossGain` ≈ `123.5` em 12 meses.
- Tesouro Selic usa `selicAnnual` e paga IR.
- Prazo de 1 mês: alíquota de 22,5%.
- Prazo de 600 meses com aporte: `Number.isFinite(r.net)` e `series.length === 601`.
- Série: `series[0]` é `{ month: 0, invested: 1000, gross: 1000 }`; último `gross` ≈ `invested + grossGain`.
- O último aporte não rende: `monthly: 100`, `initial: 0`, `months: 1` dá `grossGain` ≈ 0.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/fixedIncome.test.ts`
Expected: FAIL porque `simulateFixedIncome` não existe.

- [ ] **Step 3: Implementar `simulateFixedIncome`**

Um lote tem o valor inicial com idade `months`, e cada aporte `k` tem idade `months - k`. O bruto do lote é `valor × (1 + i)^idade`, e a alíquota vem de `incomeTaxRate(idade × 30)`, ou zero em `lci-lca` e `poupanca`. Taxa mensal da poupança: `0.005` se `selicAnnual > 0.085`, senão `0.7 × selicAnnual / 12`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/fixedIncome.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fixedIncome.ts src/lib/fixedIncome.test.ts
git commit -m "feat: simulação de renda fixa"
```

### Task 3: Simulação de renda variável

**Files:**
- Create: `src/lib/variableIncome.ts`
- Test: `src/lib/variableIncome.test.ts`

**Interfaces:**
- Consumes: `monthlyRate`, `SimulationPoint`
- Produces:
  - `type VariableAsset = 'acoes' | 'fiis'`
  - `type VariableIncomeInput = { asset: VariableAsset; initial: number; monthly: number; months: number; appreciationAnnual: number; dividendAnnual: number; reinvestDividends: boolean }`
  - `type VariableIncomeResult = { invested: number; grossGain: number; tax: number; net: number; appreciationGain: number; dividends: number; series: SimulationPoint[] }`
  - `saleTax(asset: VariableAsset, position: number, cost: number): number`
  - `simulateVariableIncome(input: VariableIncomeInput): VariableIncomeResult`

- [ ] **Step 1: Escrever os testes**

```ts
expect(saleTax('acoes', 20000, 15000)).toBe(0)
expect(saleTax('acoes', 20000.01, 15000)).toBeCloseTo(750.0015, 4)
expect(saleTax('fiis', 1000, 500)).toBeCloseTo(100, 6)
expect(saleTax('acoes', 30000, 40000)).toBe(0)
expect(saleTax('fiis', 900, 1000)).toBe(0)
```

Com `base = { asset: 'acoes', initial: 12000, monthly: 0, months: 12, appreciationAnnual: 0, dividendAnnual: 0.12, reinvestDividends: false }`:
- Sem reinvestimento: `dividends` ≈ 1440, `grossGain` ≈ 1440, `tax === 0`, `net` ≈ 13440.
- Com reinvestimento: `net` ≈ `12000 * 1.01 ** 12`, `tax === 0`, pois o dividendo entra no custo.
- Perda em FIIs com `initial: 10000`, `dividendAnnual: 0`, `appreciationAnnual: -0.2`: `net` ≈ 8000, `grossGain` ≈ -2000, `appreciationGain` ≈ -2000, `tax === 0`.
- Ganho em ações acima do limite com `initial: 30000`, `dividendAnnual: 0`, `appreciationAnnual: 0.1`: `tax` ≈ 450.
- Ordem do mês com `initial: 0`, `monthly: 100`, `months: 1`, `appreciationAnnual: 0.12`, `dividendAnnual: 0.12`: `net` ≈ 100 e `grossGain` ≈ 0.
- Ordem com `initial: 1000`, `months: 1`, `appreciationAnnual: 0.12`, `dividendAnnual: 0.12`, `reinvestDividends: false`: `dividends` ≈ `1000 * 1.12 ** (1 / 12) * 0.01`.
- Série: em cada ponto, `gross` é `posição + caixa`; `series.length === months + 1`.
- Prazo de 600 meses com `appreciationAnnual: 1`: `Number.isFinite(r.net)`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/variableIncome.test.ts`
Expected: FAIL porque os módulos não existem.

- [ ] **Step 3: Implementar**

Siga a ordem mensal da spec: valorização, dividendos (`posição × dividendAnnual / 12`), destino dos dividendos, aporte. `net = posição + caixa − saleTax(asset, posição, custo)`. `grossGain = posição + caixa − invested`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/variableIncome.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/variableIncome.ts src/lib/variableIncome.test.ts
git commit -m "feat: simulação de renda variável"
```

### Task 4: Página, tema e abas

**Files:**
- Create: `src/utils/useTheme.ts`
- Create: `src/components/ThemeToggle/index.tsx`, `src/components/ThemeToggle/style.module.css`
- Create: `src/components/Tabs/index.tsx`, `src/components/Tabs/style.module.css`
- Create: `src/components/Field/index.tsx`, `src/components/Field/style.module.css`
- Create: `src/components/Disclaimer/index.tsx`, `src/components/Disclaimer/style.module.css`
- Create: `src/pages/simulator/index.tsx`, `src/pages/simulator/style.module.css`
- Modify: `src/main.tsx`
- Test: `src/components/Tabs/Tabs.test.tsx`

**Interfaces:**
- Produces:
  - `<Tabs tabs={{ id: string; label: string; content: ReactNode }[]} />`, que mantém todos os painéis montados e oculta os inativos com `hidden`
  - `<Field label hint? error? value onChange suffix? />`, com `value: string`, `onChange: (value: string) => void`, `inputMode="decimal"` e `aria-invalid` + `aria-describedby` quando há `error`
  - `<Disclaimer items={string[]} />`
  - `useTheme(): { theme: 'dark' | 'light'; toggle: () => void }`

- [ ] **Step 1: Escrever os testes das abas**

Teste com dois painéis:
- `getAllByRole('tab')` tem 2; o primeiro tem `aria-selected="true"`.
- Clicar no segundo mostra o painel dele.
- Com o foco na aba, `{ArrowRight}` seleciona a próxima, com retorno ao início ao passar do fim, e `{ArrowLeft}` a anterior.
- Um `<input>` no primeiro painel mantém o valor digitado depois de ir e voltar.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/Tabs`
Expected: FAIL porque `Tabs` não existe.

- [ ] **Step 3: Implementar componentes e página**

Copie `useTheme` de `../mundstock/src/utils/useTheme.ts`, ajustando o que depender de arquivos ausentes. A página tem cabeçalho com o título "Simulador de Investimentos", uma frase de apresentação, `ThemeToggle`, as abas "Renda fixa" e "Renda variável" com um conteúdo temporário, e rodapé com o aviso comum da spec: simulação educativa, não é recomendação de investimento, e resultado passado ou esperado não é garantia.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/Tabs` e depois `npm run build`
Expected: PASS e build sem erro.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: página, tema e abas"
```

### Task 5: Cartões de resultado e gráfico

**Files:**
- Create: `src/components/ResultCards/index.tsx`, `src/components/ResultCards/style.module.css`
- Create: `src/components/GrowthChart/index.tsx`, `src/components/GrowthChart/geometry.ts`, `src/components/GrowthChart/style.module.css`
- Test: `src/components/GrowthChart/geometry.test.ts`, `src/components/GrowthChart/GrowthChart.test.tsx`

**Interfaces:**
- Consumes: `SimulationPoint`, `formatCurrency`
- Produces:
  - `<ResultCards items={{ label: string; value: string; tone?: 'default' | 'accent' | 'negative' }[]} />`
  - `<GrowthChart series={SimulationPoint[]} />`
  - `yDomain(values: number[]): [number, number]`
  - `linePath(values: number[], width: number, height: number, domain: [number, number]): string`

- [ ] **Step 1: Carregar o skill `dataviz`**

Siga-o no gráfico, mantendo as cores do Mundstock: total investido em `--muted`, patrimônio bruto em `--accent-ink`.

- [ ] **Step 2: Escrever os testes**

```ts
expect(yDomain([0, 0, 0])).toEqual([0, 1])
expect(yDomain([1000, 1000])[1]).toBeGreaterThan(1000)
expect(yDomain([0, 1234])[0]).toBe(0)
expect(yDomain([0, 1234])[1]).toBeGreaterThanOrEqual(1234)
const huge = [1e9, 1e24]
expect(Number.isFinite(yDomain(huge)[1])).toBe(true)
expect(linePath([5, 5], 100, 50, [0, 10])).not.toMatch(/NaN|Infinity/)
expect(linePath([5], 100, 50, [0, 10])).not.toMatch(/NaN|Infinity/)
expect(linePath(huge, 100, 50, yDomain(huge))).not.toMatch(/NaN|Infinity/)
```

Em `GrowthChart.test.tsx`: uma série de 3 pontos gera uma tabela alternativa acessível com 3 linhas de dados e os valores formatados.

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/components/GrowthChart`
Expected: FAIL porque os módulos não existem.

- [ ] **Step 4: Implementar**

`yDomain` arredonda o máximo para cima, em passos de 1, 2 ou 5 × 10ⁿ. O gráfico tem eixos legíveis, legenda das duas séries, tooltip por mês e tabela só para leitores de tela. Valores longos nos cartões quebram linha, sem estourar a largura.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/components/GrowthChart`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components
git commit -m "feat: cartões de resultado e gráfico"
```

### Task 6: Aba de renda fixa

**Files:**
- Create: `src/pages/simulator/FixedIncomeTab.tsx`, `src/pages/simulator/CommonFields.tsx`, `src/pages/simulator/tabs.module.css`
- Modify: `src/pages/simulator/index.tsx`
- Test: `src/pages/simulator/FixedIncomeTab.test.tsx`

**Interfaces:**
- Consumes: `simulateFixedIncome`, `parseInRange`, `toMonths`, `RATE_DEFAULTS`, `FIELD_LIMITS`, `Field`, `ResultCards`, `GrowthChart`, `Disclaimer`
- Produces:
  - `type CommonValues = { initial: string; monthly: string; term: string; unit: TermUnit }`
  - `DEFAULT_COMMON_VALUES`: `initial: '1.000'`, `monthly: '200'`, `term: '5'`, `unit: 'years'`
  - `parseCommon(values: CommonValues): { initial: number; monthly: number; months: number } | null`
  - `commonErrors(values: CommonValues): { initial?: string; monthly?: string; term?: string }`
  - `<CommonFields values errors onChange />`
  - `<FixedIncomeTab />`

- [ ] **Step 1: Escrever os testes**

- Com os valores iniciais do campo, aparecem os títulos "Total investido", "Ganho bruto", "Imposto" e "Valor líquido", com total investido `R$ 13.000,00`.
- A explicação aparece antes do formulário no DOM.
- A tela mostra "outubro de 2026" e indica como exemplo os 90% da LCI/LCA e os 7% de juro real, nos tipos em que aparecem.
- O seletor mostra só as taxas do tipo escolhido, conforme a tabela da spec.
- Limpar "Valor inicial" e digitar `-` mostra erro no campo, oculta os resultados e não mostra `NaN`.
- Valor inicial e aporte iguais a zero mostram erro e ocultam os resultados.
- `13,` em uma taxa continua calculando.
- Trocar de CDB para Tesouro IPCA+ e voltar mantém o aporte digitado.
- Em LCI/LCA, os 90% de exemplo se mantêm, e o CDB começa com 100%.
- Tesouro IPCA+ não mostra CDI.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/pages/simulator/FixedIncomeTab.test.tsx`
Expected: FAIL porque a aba não existe.

- [ ] **Step 3: Implementar a aba**

Ordem: explicação, formulário, cartões, gráfico, avisos. A explicação, em linguagem simples, diz o que é renda fixa, como cada tipo rende e como o imposto funciona. Avisos específicos: use o texto de renda fixa da seção "Avisos na tela" da spec. Mantenha um `cdiPercent` por tipo, para CDB e LCI/LCA não se sobrescreverem. Taxas aceitam de 0 a 100, e `% do CDI` aceita de 0 a 200. Use `FIELD_LIMITS` e `useMemo` para calcular.

- [ ] **Step 4: Conectar a aba à página e rodar**

Run: `npx vitest run src/pages/simulator`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages
git commit -m "feat: aba de renda fixa"
```

### Task 7: Aba de renda variável

**Files:**
- Create: `src/pages/simulator/VariableIncomeTab.tsx`
- Modify: `src/pages/simulator/index.tsx`
- Test: `src/pages/simulator/VariableIncomeTab.test.tsx`

**Interfaces:**
- Consumes: `simulateVariableIncome`, `CommonFields`, `parseCommon`, `commonErrors`, `DEFAULT_COMMON_VALUES`, `parseInRange`, `FIELD_LIMITS`, `Field`, `ResultCards`, `GrowthChart`, `Disclaimer`
- Produces: `<VariableIncomeTab />`

- [ ] **Step 1: Escrever os testes**

- Valorização e dividendos começam vazios; a aba pede o preenchimento e não mostra resultados.
- Preencher `8` e `6` mostra os quatro cartões, mais o detalhe de valorização e de dividendos.
- `-20` em valorização com dividendos `0` mostra a perda como negativa.
- `-100` em valorização e `101` em dividendos mostram erro no campo.
- `-` em valorização não mostra `NaN`.
- Trocar de ações para FIIs mantém os campos preenchidos.
- "Reinvestir dividendos" começa ligado, e desligar muda o valor líquido em um cenário com valorização positiva.
- A explicação aparece antes do formulário no DOM.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/pages/simulator/VariableIncomeTab.test.tsx`
Expected: FAIL porque a aba não existe.

- [ ] **Step 3: Implementar a aba**

A explicação diz o que é renda variável, por que não há garantia, o que são dividendos e que os percentuais são a expectativa do próprio usuário. Limites: valorização de `FIELD_LIMITS.appreciationMin` a `FIELD_LIMITS.percentMax`, dividendos de 0 a `FIELD_LIMITS.percentMax`. Avisos específicos: use o texto de renda variável da seção "Avisos na tela" da spec. Prefira `grossGain` negativo com rótulo "Perda bruta" e `tone: 'negative'`.

- [ ] **Step 4: Conectar a aba à página e rodar**

Run: `npm test`
Expected: PASS em todos os testes.

- [ ] **Step 5: Commit**

```bash
git add src/pages
git commit -m "feat: aba de renda variável"
```

### Task 8: Verificação final e README

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: app completo

- [ ] **Step 1: Escrever o README**

Em português, com o que é o projeto, como instalar, rodar, testar e gerar o build, e onde atualizar as taxas (`src/config/rates.ts`).

- [ ] **Step 2: Rodar as verificações**

Run: `npm test`, `npm run lint`, `npm run build`
Expected: todos terminam sem erro.

- [ ] **Step 3: Verificar no navegador**

Rode `npm run dev` e confira, nos dois temas, em 1280 px e 320 px: as duas abas funcionam, não há rolagem horizontal da página, valores enormes não estouram os cartões, o console não mostra erros e a navegação por teclado funciona.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README do simulador"
```
