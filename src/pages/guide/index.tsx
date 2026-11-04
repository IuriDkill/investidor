import { useEffect, type ReactNode } from 'react';
import { useLayoutContext } from '@/components/Layout/useLayoutContext';
import { presetById } from '@/content/presets';
import tabStyles from '../simulator/tabs.module.css';
import styles from './style.module.css';

const PRODUCTS: { name: string; guarantee: string; liquidity: string; risk: string }[] = [
  { name: 'CDB', guarantee: 'FGC', liquidity: 'Diária ou no vencimento, conforme o título', risk: 'Baixo' },
  { name: 'LCI/LCA', guarantee: 'FGC', liquidity: 'Costuma ter carência de alguns meses', risk: 'Baixo' },
  { name: 'Caixinha', guarantee: 'FGC, quando é CDB ou RDB', liquidity: 'Geralmente diária', risk: 'Baixo' },
  { name: 'Poupança', guarantee: 'FGC', liquidity: 'Diária, mas rende só no aniversário mensal', risk: 'Baixo' },
  { name: 'Tesouro Selic', guarantee: 'Governo federal', liquidity: 'Diária', risk: 'Baixo' },
  {
    name: 'Tesouro IPCA+',
    guarantee: 'Governo federal',
    liquidity: 'Diária, mas o preço oscila antes do vencimento',
    risk: 'Médio se vender antes',
  },
  { name: 'Ações', guarantee: 'Nenhuma', liquidity: 'Diária, pelo preço do momento', risk: 'Alto' },
  { name: 'FIIs', guarantee: 'Nenhuma', liquidity: 'Diária, pelo preço do momento', risk: 'Médio a alto' },
];

function Step({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className={styles.step}>
      <h3 className={styles.stepTitle}>{title}</h3>
      <div className={styles.stepBody}>{children}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  );
}

export default function GuidePage() {
  const { applyPreset } = useLayoutContext();

  useEffect(() => {
    document.title = 'Simulador de Investimentos · Por onde começar';
  }, []);

  const tryPreset = (id: string, label: string) => (
    <button type="button" className={styles.action} onClick={() => applyPreset(presetById(id))}>
      {label}
    </button>
  );

  return (
    <div className={tabStyles.tab}>
      <section className={tabStyles.intro}>
        <h2 className={tabStyles.introTitle}>Por onde começar</h2>
        <p>
          Investir não começa escolhendo o produto que rende mais. Começa com as contas em dia, uma reserva para
          imprevistos e objetivos claros. Siga os passos na ordem; cada um tem uma simulação pronta para você testar.
        </p>
      </section>

      <Step title="1. Organize as contas">
        <p>
          Antes de investir, gaste menos do que ganha e anote para onde vai o dinheiro. Se tiver dívidas caras, como
          rotativo do cartão ou cheque especial, quite-as primeiro: os juros delas costumam ser muito maiores do que
          qualquer investimento seguro rende.
        </p>
      </Step>

      <Step
        title="2. Monte a reserva de emergência"
        actions={
          <>
            {tryPreset('reserva', 'Simular uma reserva de emergência')}
            {tryPreset('onde-guardar-reserva', 'Comparar onde guardar a reserva')}
          </>
        }
      >
        <p>
          A reserva cobre imprevistos, como perder o emprego ou um conserto urgente. Uma referência comum é guardar de 6
          a 12 meses dos seus gastos mensais.
        </p>
        <p>
          Ela precisa estar num lugar seguro e com resgate no mesmo dia, como o Tesouro Selic, um CDB com liquidez
          diária ou uma caixinha. Aqui, render pouco a mais importa menos do que poder sacar quando precisar.
        </p>
      </Step>

      <Step
        title="3. Defina objetivos e prazos"
        actions={
          <>
            {tryPreset('entrada', 'Simular a entrada de um apartamento')}
            {tryPreset('aposentadoria', 'Simular uma aposentadoria')}
          </>
        }
      >
        <p>Com a reserva pronta, separe o que você quer conquistar pelo tempo até precisar do dinheiro:</p>
        <ul className={styles.list}>
          <li>
            <strong>Curto prazo, até 2 anos:</strong> viagem ou troca do celular. Prefira renda fixa com liquidez.
          </li>
          <li>
            <strong>Médio prazo, de 2 a 5 anos:</strong> entrada de um imóvel ou um carro. CDB, LCI/LCA e Tesouro
            costumam servir bem.
          </li>
          <li>
            <strong>Longo prazo, mais de 5 anos:</strong> aposentadoria. Há tempo para atravessar oscilações, e o
            Tesouro IPCA+ protege da inflação.
          </li>
        </ul>
      </Step>

      <Step title="4. Entenda risco, liquidez e garantia">
        <p>
          Todo investimento tem três perguntas: quem garante o dinheiro, quando dá para resgatar e quanto o valor pode
          variar no caminho.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.caption}>Garantia, liquidez e risco de cada produto</caption>
            <thead>
              <tr>
                <th scope="col">Produto</th>
                <th scope="col">Garantia</th>
                <th scope="col">Liquidez</th>
                <th scope="col">Risco</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((product) => (
                <tr key={product.name}>
                  <th scope="row">{product.name}</th>
                  <td data-label="Garantia">{product.guarantee}</td>
                  <td data-label="Liquidez">{product.liquidity}</td>
                  <td data-label="Risco">{product.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          O FGC (Fundo Garantidor de Créditos) devolve até R$ 250 mil por CPF em cada instituição ou conglomerado, se ela
          quebrar, com teto de R$ 1 milhão a cada 4 anos. Confira as regras atualizadas em fgc.org.br.
        </p>
      </Step>

      <Step title="5. Invista com regularidade" actions={tryPreset('fiis', 'Simular renda com FIIs')}>
        <p>
          Investir um pouco todo mês costuma pesar mais no resultado do que acertar o melhor produto. Com o tempo, os
          rendimentos passam a render também: são os juros compostos. Comece com o valor que cabe no orçamento e
          aumente quando puder.
        </p>
        <p>
          Renda variável, como ações e FIIs, pode render mais no longo prazo, mas oscila. Ela faz mais sentido depois
          da reserva pronta e com dinheiro que você não vai precisar tão cedo.
        </p>
      </Step>

      <Step title="6. Desconfie de promessas fáceis">
        <ul className={styles.list}>
          <li>Rendimento garantido muito acima do CDI costuma ser golpe.</li>
          <li>Ninguém sério pede pagamento por Pix para uma pessoa física para você "investir".</li>
          <li>Confira se a instituição é autorizada pelo Banco Central ou pela CVM antes de investir.</li>
        </ul>
      </Step>
    </div>
  );
}
