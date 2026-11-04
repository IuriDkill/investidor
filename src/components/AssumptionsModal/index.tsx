import { useEffect, useId, useRef } from 'react';
import Field from '@/components/Field';
import { RATE_DEFAULTS, type AssumptionKey, type AssumptionValues } from '@/config/rates';
import { EXPLANATIONS } from '@/content/explanations';
import { isAssumptionValid } from '@/lib/assumptions';
import styles from './style.module.css';

type AssumptionsModalProps = {
  open: boolean;
  values: AssumptionValues;
  onChange: (key: AssumptionKey, text: string) => void;
  onReset: () => void;
  onClose: () => void;
};

type Group = { title: string; fields: { key: AssumptionKey; label: string; suffix: string; info?: string }[] };

const GROUPS: Group[] = [
  {
    title: 'Taxas de mercado (ao ano)',
    fields: [
      { key: 'cdiAnnual', label: 'CDI anual', suffix: '%', info: EXPLANATIONS.cdi },
      { key: 'selicAnnual', label: 'Selic anual', suffix: '%', info: EXPLANATIONS.selic },
      { key: 'ipcaAnnual', label: 'IPCA anual', suffix: '%', info: EXPLANATIONS.ipca },
    ],
  },
  {
    title: 'IR da renda fixa, por tempo aplicado',
    fields: [
      { key: 'irUpTo180', label: 'Até 180 dias', suffix: '%' },
      { key: 'irUpTo360', label: '181 a 360 dias', suffix: '%' },
      { key: 'irUpTo720', label: '361 a 720 dias', suffix: '%' },
      { key: 'irAbove720', label: 'Acima de 720 dias', suffix: '%' },
    ],
  },
  {
    title: 'IR da renda variável, na venda',
    fields: [
      { key: 'stockTaxRate', label: 'Lucro em ações', suffix: '%' },
      { key: 'fiiTaxRate', label: 'Lucro em FIIs', suffix: '%' },
      { key: 'stockExemptionLimit', label: 'Limite de isenção em ações', suffix: 'R$', info: EXPLANATIONS.stockExemptionLimit },
    ],
  },
  {
    title: 'Regra da poupança',
    fields: [
      { key: 'savingsSelicThreshold', label: 'Selic de corte', suffix: '%', info: EXPLANATIONS.savingsThreshold },
      { key: 'savingsMonthlyAbove', label: 'Rendimento acima do corte', suffix: '% ao mês' },
      { key: 'savingsSelicShare', label: 'Percentual da Selic até o corte', suffix: '%' },
    ],
  },
];

const errorFor = (key: AssumptionKey) =>
  key === 'stockExemptionLimit' ? 'Informe um valor de R$ 0 a R$ 1 bilhão.' : 'Informe um valor de 0 a 100.';

export default function AssumptionsModal({ open, values, onChange, onReset, onClose }: AssumptionsModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // O conteúdo cobre todo o <dialog>: um clique nele próprio veio do fundo escurecido.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            Premissas
          </h2>
          <button type="button" className={styles.close} aria-label="Fechar" title="Fechar" onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.closeIcon}>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <p className={styles.note}>
          Os padrões são de {RATE_DEFAULTS.reference}. O que você mudar vale nas duas abas e fica salvo só neste
          navegador.
        </p>

        {GROUPS.map((group) => (
          <fieldset key={group.title} className={styles.group}>
            <legend className={styles.legend}>{group.title}</legend>
            <div className={styles.fields}>
              {group.fields.map(({ key, label, suffix, info }) => (
                <Field
                  key={key}
                  label={label}
                  suffix={suffix}
                  info={info}
                  value={values[key]}
                  error={isAssumptionValid(key, values[key]) ? undefined : errorFor(key)}
                  onChange={(text) => onChange(key, text)}
                />
              ))}
            </div>
          </fieldset>
        ))}

        <button type="button" className={styles.reset} onClick={onReset}>
          Restaurar padrões
        </button>
      </div>
    </dialog>
  );
}
