import { useEffect, useId, useRef, useState } from 'react';
import { useLayoutContext } from '@/components/Layout/useLayoutContext';
import { PRESETS, type Preset } from '@/content/presets';
import styles from './style.module.css';

type PresetListProps = {
  path: Preset['path'];
  title: string;
  lead: string;
  // Como chamar o que foi aplicado na mensagem de confirmação: "Exemplo" ou "Cenário".
  kind: string;
};

// Quanto cada clique nas setas rola: quase uma tela de cartões.
const PAGE_SHARE = 0.85;

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.arrowIcon}>
      <path d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  );
}

// Exemplos e cenários prontos do topo de uma página, numa faixa com rolagem: um clique preenche os campos.
export default function PresetList({ path, title, lead, kind }: PresetListProps) {
  const { applyPreset, appliedPreset } = useLayoutContext();
  const titleId = useId();
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const presets = PRESETS.filter((preset) => preset.path === path);

  const updateEdges = () => {
    const element = track.current;
    if (!element) return;
    const max = element.scrollWidth - element.clientWidth;
    setEdges({ start: element.scrollLeft <= 1, end: max <= 1 || element.scrollLeft >= max - 1 });
  };

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, []);

  const scroll = (direction: 1 | -1) => {
    const element = track.current;
    element?.scrollBy?.({ left: direction * element.clientWidth * PAGE_SHARE, behavior: 'smooth' });
  };

  const applied = appliedPreset?.path === path ? appliedPreset : null;
  // Título que já termina em "?" não ganha outro ponto.
  const appliedText = applied && `${kind} aplicado: ${applied.title}${/[?!.]$/.test(applied.title) ? '' : '.'}`;

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <div className={styles.header}>
        <div>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <p className={styles.lead}>{lead}</p>
        </div>
        <div className={styles.arrows}>
          <button type="button" className={styles.arrow} aria-label="Anteriores" disabled={edges.start} onClick={() => scroll(-1)}>
            <ArrowIcon direction="left" />
          </button>
          <button type="button" className={styles.arrow} aria-label="Próximos" disabled={edges.end} onClick={() => scroll(1)}>
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>
      <div ref={track} className={styles.track} onScroll={updateEdges}>
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={styles.preset}
            data-active={appliedPreset?.id === preset.id || undefined}
            onClick={() => applyPreset(preset)}
          >
            <span className={styles.presetTitle}>{preset.title}</span>
            <span className={styles.presetDescription}>{preset.description}</span>
          </button>
        ))}
      </div>
      <p className={styles.status} aria-live="polite">
        {appliedText && `${appliedText} Ajuste os valores como quiser.`}
      </p>
    </section>
  );
}
