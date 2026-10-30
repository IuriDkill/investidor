const NICE_STEPS = [1, 1.5, 2, 3, 5, 7.5, 10];
const MONTH_STEPS = [1, 3, 6, 12, 24, 60, 120];
const MAX_MONTH_TICKS = 6;
const NARROW_MONTH_TICKS = 3;
const TINY_PLOT_WIDTH = 120;
const NARROW_PLOT_WIDTH = 260;
const HEADROOM = 1.05;
const LABEL_CHAR_WIDTH = 6.7;
const LABEL_GAP = 12;
const TOOLTIP_GAP = 12;

function niceCeil(value: number) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const step = NICE_STEPS.find((candidate) => candidate * magnitude >= value);
  return (step ?? 10) * magnitude;
}

export function yDomain(values: number[]): [number, number] {
  const max = Math.max(...values);
  return [0, max > 0 ? niceCeil(max * HEADROOM) : 1];
}

export function linePath(values: number[], width: number, height: number, domain: [number, number]) {
  const [min, max] = domain;
  const lastIndex = Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = (index / lastIndex) * width;
      const y = height - ((value - min) / (max - min)) * height;
      return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
    })
    .join('');
}

export function axisMargin(labels: string[]) {
  const longest = Math.max(...labels.map((label) => label.length));
  return Math.ceil(longest * LABEL_CHAR_WIDTH + LABEL_GAP);
}

export function monthTicks(months: number, maxTicks = MAX_MONTH_TICKS) {
  const step = MONTH_STEPS.find((candidate) => months / candidate <= maxTicks - 1) ?? months;
  const ticks = [];
  for (let month = 0; month <= months; month += step) ticks.push(month);
  return ticks;
}

export function ticksForWidth(months: number, plotWidth: number) {
  if (plotWidth < TINY_PLOT_WIDTH) return [months];
  return plotWidth < NARROW_PLOT_WIDTH ? monthTicks(months, NARROW_MONTH_TICKS) : monthTicks(months);
}

export function tooltipLeft(anchor: number, tooltipWidth: number, containerWidth: number) {
  const fitsRight = anchor + TOOLTIP_GAP + tooltipWidth <= containerWidth;
  const left = fitsRight ? anchor + TOOLTIP_GAP : anchor - TOOLTIP_GAP - tooltipWidth;
  return Math.max(Math.min(left, containerWidth - tooltipWidth), 0);
}
