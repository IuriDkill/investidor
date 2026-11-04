type Span = { left: number; right: number };

// Quanto deslocar a caixa na horizontal para ela caber entre as bordas.
// Se não couber inteira, prende à borda esquerda.
export function clampShift(box: Span, bounds: Span) {
  const shift = box.right > bounds.right ? bounds.right - box.right : 0;
  return box.left + shift < bounds.left ? bounds.left - box.left : shift;
}
