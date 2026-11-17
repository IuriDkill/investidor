// Textos das caixas de explicação, em linguagem para iniciantes.
export const EXPLANATIONS = {
  product:
    'O tipo de aplicação. Cada um rende e paga imposto de um jeito diferente; a explicação no topo da aba resume cada um.',
  initial: 'Quanto você aplica no primeiro dia.',
  monthly: 'Quanto você acrescenta todo mês. O simulador considera cada aporte no fim do mês.',
  term: 'Por quanto tempo o dinheiro fica aplicado até o resgate ou a venda. Na renda fixa, quanto maior o prazo, menor o imposto.',
  cdiPercent:
    'Quanto do CDI o investimento paga. Com CDI de 10% ao ano, 100% do CDI rende 10% e 120% do CDI rende 12% ao ano.',
  realAnnual:
    'Quanto o título paga acima da inflação. O rendimento total é a inflação (IPCA) mais esse juro, o que protege o poder de compra.',
  asset:
    'Ações são pedaços de empresas. FIIs são cotas de fundos que investem em imóveis e repassam os aluguéis aos cotistas.',
  appreciation:
    'Quanto você espera que o preço suba por ano. Use um número negativo para simular queda. É só uma expectativa: ninguém garante esse valor.',
  dividends:
    'Quanto você espera receber por ano em dividendos, como percentual do valor investido. Por exemplo, 6% sobre R$ 10.000 dá R$ 600 por ano.',
  reinvest:
    'Ligado, os dividendos compram mais ações ou cotas e passam a render também. Desligado, ficam guardados sem render.',
  invested: 'A soma do valor inicial com todos os aportes mensais.',
  grossGain: 'Quanto o dinheiro rendeu, antes de descontar o imposto.',
  grossLoss: 'Quanto o investimento perdeu em relação ao total investido. Com prejuízo, não há imposto a pagar.',
  net: 'O que fica com você no fim, já descontado o imposto.',
  cdi: 'Taxa de juros que os bancos cobram entre si. Fica muito perto da Selic e serve de referência para CDBs, LCIs e caixinhas.',
  selic: 'A taxa básica de juros do país, definida pelo Banco Central nas reuniões do Copom.',
  ipca: 'A inflação oficial do Brasil, medida pelo IBGE.',
  stockExemptionLimit:
    'Em ações, quem vende até esse valor no mês não paga imposto sobre o lucro. O simulador considera uma única venda no fim do prazo.',
  savingsThreshold:
    'A poupança tem duas regras: com a Selic acima desse corte, rende um valor fixo ao mês; até o corte, rende um percentual da Selic.',
  salary: 'O que cai na sua conta por mês, já com os descontos de INSS, imposto de renda e benefícios.',
  essentials:
    'Gastos que não dá para cortar no curto prazo: moradia, contas de luz, água e internet, mercado, transporte e saúde. Sem esse valor, o cálculo considera metade do salário.',
  debtPayments: 'Soma das parcelas que você paga todo mês: empréstimos, financiamentos e compras parceladas.',
  expensiveDebt:
    'O rotativo do cartão e o cheque especial cobram alguns dos juros mais altos do mercado. Enquanto existirem, quitá-los rende mais do que investir.',
  reserveCurrent: 'Quanto você já tem guardado para emergências, num lugar que dá para resgatar no mesmo dia.',
  budgetEssentials: 'Gastos essenciais informados ou, sem eles, 50% do salário, como na regra 50/30/20.',
  budgetWants:
    'O que sobra para lazer, compras e outros desejos depois dos essenciais, das parcelas e do investimento.',
  budgetInvest:
    'Pelo menos 20% do salário, como na regra 50/30/20. Se os essenciais forem baixos, o que passar de 30% de desejos também vai para investir.',
};
