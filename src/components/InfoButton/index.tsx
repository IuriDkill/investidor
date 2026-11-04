import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { clampShift } from './position';
import type { useInfo } from './useInfo';
import styles from './style.module.css';

const EDGE_GAP = 8;
const MAX_WIDTH = '18rem';

type Info = ReturnType<typeof useInfo>;

export default function InfoButton({ label, info }: { label: string; info: Info }) {
  return (
    <button
      type="button"
      className={styles.button}
      aria-label={`Explicação sobre ${label}`}
      aria-expanded={info.open}
      aria-controls={info.boxId}
      onClick={info.toggle}
      // Só o mouse conta como hover: o toque também emite esses eventos e deixaria a caixa presa aberta.
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') info.hover(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') info.hover(false);
      }}
      onKeyDown={(event) => {
        // Dentro do modal, o Esc fecha só a explicação, sem fechar o modal junto.
        if (event.key === 'Escape' && info.open) {
          event.preventDefault();
          info.close();
        }
      }}
    />
  );
}

function FloatingBox({ id, children }: { id: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);

  // Perto da borda da tela ou do modal, a caixa desliza para dentro em vez de ser cortada.
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const frame = element.closest('dialog')?.getBoundingClientRect();
    const bounds = {
      left: Math.max(frame?.left ?? 0, 0) + EDGE_GAP,
      right: Math.min(frame?.right ?? Infinity, document.documentElement.clientWidth) - EDGE_GAP,
    };
    // Primeiro a largura cabe no espaço disponível; depois a caixa desliza para dentro dele.
    if (bounds.right > bounds.left) element.style.maxWidth = `min(${MAX_WIDTH}, ${bounds.right - bounds.left}px)`;
    element.style.translate = `${clampShift(element.getBoundingClientRect(), bounds)}px 0`;
  }, []);

  return (
    <div ref={box} id={id} className={styles.box} role="note">
      {children}
    </div>
  );
}

export function InfoBox({ info, children }: { info: Info; children: ReactNode }) {
  return info.open ? <FloatingBox id={info.boxId}>{children}</FloatingBox> : null;
}
