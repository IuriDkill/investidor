# Simulador de investimentos: design

Data: 2026-10-30

## Objetivo

Site público para iniciantes que simula quanto um investimento pode render, em uma aba de renda fixa e uma de renda variável. Cada aba começa com uma explicação simples do tema. O visual usa a paleta do projeto Mundstock.

Sucesso significa que um iniciante entende a explicação, preenche poucos campos e vê quanto investiu, quanto ganhou, quanto pagou de imposto e quanto sobra.

## Fora do escopo

- Login, contas ou dados salvos (exceto a preferência de tema e as alterações em Premissas).
- Taxas atualizadas por API.
- Inglês ou outros idiomas.
- Deploy.
- Comparação entre produtos, cenários pré-definidos e Monte Carlo.

## Stack

Projeto próprio em React 19, Vite 6, TypeScript e CSS Modules, igual ao Mundstock, com Vitest para os testes. O gráfico é SVG feito à mão, sem biblioteca.

## Estrutura

```
src/
  config/rates.ts           # taxas iniciais e data de referência
  lib/
    finance.ts              # conversão de taxas e alíquotas
    fixedIncome.ts          # simulação de renda fixa (função pura)
    variableIncome.ts       # simulação de renda variável (função pura)
    format.ts               # moeda e percentual em pt-BR
  components/
    Tabs/ Field/ ResultCards/ GrowthChart/ Disclaimer/ ThemeToggle/
  pages/simulator/
    index.tsx               # cabeçalho, abas e rodapé
    FixedIncomeTab.tsx
    VariableIncomeTab.tsx
  utils/useTheme.ts
  index.css                 # tokens copiados do Mundstock
```

`lib/` não importa React, e os componentes não fazem cálculo financeiro.

## Visual

- Tokens de `mundstock/src/index.css`, incluindo os dois temas, raios e sombras.
- Tema escuro como padrão, com alternância e preferência salva em `localStorage`, usando o mesmo script anti-flash do `index.html` do Mundstock.
- Space Grotesk no texto e JetBrains Mono nos valores.
- Layout responsivo até 320 px de largura, sem rolagem horizontal da página.
- Respeita `prefers-reduced-motion`.

## Interface

Cada aba tem, nesta ordem: explicação, formulário, cartões de resultado, gráfico e avisos. O resultado recalcula a cada alteração, sem botão.

As abas usam `role="tablist"`, `tab` e `tabpanel`, com navegação pelas setas do teclado. Trocar de aba não apaga o que foi preenchido.

### Premissas

Modal aberto pelo botão "Premissas", que fica no início do formulário de cada aba, acima de Produto e de Ativo. O conteúdo é o mesmo nas duas abas. Fecha pelo botão de fechar, pela tecla Esc ou com um clique fora dele. Permite editar CDI, Selic, IPCA, as quatro alíquotas de IR da renda fixa, os percentuais de IR de ações e FIIs, o limite de isenção em ações e os três valores da regra da poupança. CDI, Selic e IPCA ficam só neste modal; as tabelas de campos abaixo indicam de onde cada taxa vem.

As alterações valem só no navegador do visitante e ficam em `localStorage`. Apenas os campos diferentes do padrão são salvos, para novos padrões chegarem a quem não os alterou. O botão "Restaurar padrões" volta a todos os valores. Uma premissa inválida mostra erro no campo e oculta os resultados das duas abas. As faixas de dias do IR não são editáveis, e os textos explicativos continuam descrevendo as regras padrão.

### Campos comuns

| Campo | Regra | Valor inicial do campo |
|---|---|---|
| Valor inicial (R$) | 0 a 1.000.000.000 | 2.000 |
| Aporte mensal (R$) | 0 a 1.000.000.000 | 200 |
| Prazo | 1 a 600 meses, informado em meses ou anos | 5 anos |

Valor inicial e aporte não podem ser ambos zero.

### Renda fixa

- Tipo: CDB, LCI/LCA, Caixinha, Tesouro Selic, Tesouro IPCA+ ou poupança.
- Taxas editáveis exibidas conforme o tipo:

| Tipo | Campos | Valor inicial do campo |
|---|---|---|
| CDB | % do CDI, CDI anual | 100%, 13,65% |
| LCI/LCA | % do CDI, CDI anual | 90%, 13,65% |
| Caixinha | % do CDI, CDI anual | 120%, 13,65% |
| Tesouro Selic | Selic anual | 13,75% |
| Tesouro IPCA+ | IPCA anual, juro real anual | 5,2%, 7% |
| Poupança | Selic anual | 13,75% |

A tela mostra "taxas de referência de outubro de 2026". Selic e CDI vêm do Copom de 16/09/2026 (CDI estimado), IPCA do Focus de 26/10/2026. Os 90% da LCI/LCA, os 120% da caixinha e os 7% de juro real são valores ilustrativos e a tela os indica como exemplo.

### Renda variável

- Tipo: ações ou FIIs.
- Valorização anual esperada (%): aceita negativo, de -99 a 100.
- Dividendos anuais esperados (%): de 0 a 100.
- Reinvestir dividendos: sim ou não; começa em sim.

Valorização e dividendos começam vazios, porque o cenário é do usuário e um número sugerido pareceria previsão. Enquanto estiverem vazios, a aba pede que sejam preenchidos e não mostra resultado.

## Cálculo

### Convenções

- 1 mês = 30 dias, logo o prazo tem `30 × meses` dias.
- Taxa mensal equivalente: `i = (1 + a)^(1/12) − 1`, onde `a` é a taxa anual.
- O valor inicial entra no mês 0. Cada aporte entra no fim dos meses 1 a `n`, então o último não rende.
- Total investido: `inicial + n × aporte`.
- Os cálculos usam ponto flutuante, e o arredondamento ocorre só na exibição.

### Renda fixa

Taxa anual por tipo:

- CDB, LCI/LCA e caixinha: `CDI × % do CDI`. A caixinha segue a tabela regressiva, como o CDB.
- Tesouro Selic: Selic.
- Tesouro IPCA+: `(1 + IPCA) × (1 + juro real) − 1`.
- Poupança: 0,5% ao mês se a Selic for maior que 8,5%; caso contrário, `70% da Selic / 12` ao mês.

Cada aplicação (inicial e aportes) é um lote com rendimento e imposto próprios. O imposto de um lote é `rendimento × alíquota`, segundo o número de dias dele:

| Dias | Alíquota |
|---|---|
| até 180 | 22,5% |
| 181 a 360 | 20% |
| 361 a 720 | 17,5% |
| acima de 720 | 15% |

LCI/LCA e poupança têm alíquota zero. Não há IOF na conta: todo lote com rendimento fica aplicado por 30 dias ou mais, e o último aporte não rende.

### Renda variável

A cada mês, nesta ordem:

1. A posição valoriza pela taxa mensal equivalente.
2. Dividendos do mês: `posição × dividendos anuais / 12`.
3. Com reinvestimento, os dividendos entram na posição e no custo. Sem reinvestimento, vão para um saldo em caixa sem rendimento.
4. O aporte entra na posição e no custo.

No fim do prazo, a venda é total:

- Lucro: `posição − custo`.
- Sem lucro, não há imposto.
- Ações: 15% do lucro, ou isento se a posição vendida for de até R$ 20.000.
- FIIs: 20% do lucro, sem isenção.
- Valor líquido: `posição + caixa − imposto`.

Dividendos são tratados como isentos.

## Resultados

Quatro cartões: total investido, ganho bruto, imposto e valor líquido.

Na renda variável, o ganho bruto pode ser negativo e aparece como perda. Abaixo dos cartões, a aba detalha quanto veio de valorização e quanto de dividendos.

O gráfico tem duas séries por mês: total investido e patrimônio bruto (antes do imposto). Oferece eixo legível, tooltip por mês e tabela alternativa para leitores de tela.

## Avisos na tela

Em todas as abas: simulação educativa, não é recomendação de investimento, e resultado passado ou esperado não é garantia.

**Renda fixa:** não inclui taxa de custódia do Tesouro, TR da poupança ou oscilações de preço em caso de venda antecipada; as taxas ficam constantes durante todo o prazo.

**Renda variável:** usa taxas constantes, sem os sobe e desce do mercado, e não inclui corretagem, emolumentos, JCP ou a retenção de 10% sobre dividendos acima de R$ 50 mil por mês da mesma empresa.

## Validação e erros

- Campo vazio ou fora dos limites mostra uma mensagem no próprio campo, e os resultados ficam ocultos até a correção.
- Vírgula decimal é aceita.
- As funções de `lib/` recebem apenas valores já validados.

## Testes

Vitest cobre `lib/`:

- R$ 1.000 a 12% a.a. por 12 meses em CDB, sem aporte: bruto R$ 1.120, imposto R$ 24, líquido R$ 1.096.
- Fronteiras do IR: 6, 7, 12, 13, 24 e 25 meses.
- Lotes com alíquotas diferentes quando há aportes.
- LCI/LCA e poupança sem imposto.
- Poupança nas duas regras (Selic acima e até 8,5%).
- Tesouro IPCA+ com a composição das taxas.
- Ações com posição final de exatamente R$ 20.000 (isenta) e pouco acima (tributada).
- FIIs tributados em qualquer valor.
- Perda sem imposto.
- Dividendos com e sem reinvestimento, conferindo custo e caixa.
- Prazo de 1 mês e de 600 meses.

A interface é verificada rodando o app nos dois temas, no desktop e em largura de celular.

## Pontos a confirmar antes de publicar

Taxas e regras tributárias vieram de sites financeiros e guias, e devem ser conferidas na Receita Federal e no Banco Central.
