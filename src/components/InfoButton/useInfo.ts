import { useEffect, useId, useState } from 'react';

// Estado de uma caixa de explicação: o botão e a caixa compartilham o id.
// A caixa abre com o mouse por cima ou fica fixa depois de um clique ou toque.
export function useInfo() {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const boxId = `${useId()}-info`;

  // A caixa flutua sobre o conteúdo: fixada, fecha com um clique fora dela ou nela mesma,
  // para nunca travar o campo que ela cobre. O próprio botão alterna pelo clique.
  useEffect(() => {
    if (!pinned) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      const onButton = target.closest('button')?.getAttribute('aria-controls') === boxId;
      if (!onButton) {
        setPinned(false);
        setHovered(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [pinned, boxId]);

  return {
    open: pinned || hovered,
    boxId,
    toggle: () => setPinned((current) => !current),
    hover: (value: boolean) => setHovered(value),
    close: () => {
      setPinned(false);
      setHovered(false);
    },
  };
}
