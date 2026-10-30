import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import styles from './style.module.css';

type Tab = { id: string; label: string; content: ReactNode };

export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const baseId = useId();
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number) => {
    setActive(index);
    buttons.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') select((active + 1) % tabs.length);
    if (event.key === 'ArrowLeft') select((active - 1 + tabs.length) % tabs.length);
  };

  return (
    <>
      <div className={styles.list} role="tablist" aria-label="Tipo de investimento" onKeyDown={onKeyDown}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            id={`${baseId}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={index === active ? 0 : -1}
            className={styles.tab}
            onClick={() => select(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Todos os painéis ficam montados para a troca de aba não apagar os campos. */}
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          id={`${baseId}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={index !== active}
        >
          {tab.content}
        </div>
      ))}
    </>
  );
}
