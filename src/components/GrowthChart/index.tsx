import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import type { SimulationPoint } from '@/lib/fixedIncome';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';
import { axisMargin, linePath, ticksForWidth, tooltipLeft, yDomain } from './geometry';
import styles from './style.module.css';

const HEIGHT = 300;
const MARGIN = { top: 12, right: 16, bottom: 28 };
const Y_TICKS = 4;

// Cada variante tem cor e traço próprios; a ordem da legenda é a ordem das linhas.
export type ChartLine = {
  label: string;
  values: number[];
  variant: 'gross' | 'second' | 'third' | 'fourth' | 'invested' | 'reference';
};

const LINE_CLASS = {
  gross: styles.lineGross,
  second: styles.lineSecond,
  third: styles.lineThird,
  fourth: styles.lineFourth,
  invested: styles.lineInvested,
  reference: styles.lineReference,
};
const DOT_CLASS = {
  gross: styles.dotGross,
  second: styles.dotSecond,
  third: styles.dotThird,
  fourth: styles.dotFourth,
  invested: styles.dotInvested,
  reference: styles.dotReference,
};
const SWATCH_CLASS = {
  gross: styles.swatchGross,
  second: styles.swatchSecond,
  third: styles.swatchThird,
  fourth: styles.swatchFourth,
  invested: styles.swatchInvested,
  reference: styles.swatchReference,
};

const monthLabel = (month: number) => {
  if (month === 0) return 'Início';
  if (month % 12 !== 0) return `${month} ${month === 1 ? 'mês' : 'meses'}`;
  return `${month / 12} ${month === 12 ? 'ano' : 'anos'}`;
};

const linesFromSeries = (series: SimulationPoint[]): ChartLine[] => [
  { label: 'Patrimônio bruto', values: series.map((point) => point.gross), variant: 'gross' },
  { label: 'Total investido', values: series.map((point) => point.invested), variant: 'invested' },
];

type GrowthChartProps = { series: SimulationPoint[] } | { lines: ChartLine[] };

export default function GrowthChart(props: GrowthChartProps) {
  const lines = 'lines' in props ? props.lines : linesFromSeries(props.series);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const tooltip = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltipWidth, setTooltipWidth] = useState(0);

  useLayoutEffect(() => {
    if (tooltip.current) setTooltipWidth(tooltip.current.offsetWidth);
  }, [hovered, width]);

  useEffect(() => {
    if (!container.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  const domain = yDomain(lines.flatMap((line) => line.values));
  const months = lines[0].values.length - 1;
  // Linhas tracejadas por baixo, para as cheias ficarem visíveis onde se cruzam.
  const dashed = (line: ChartLine) => Number(line.variant === 'invested' || line.variant === 'reference');
  const drawOrder = [...lines].sort((a, b) => dashed(b) - dashed(a));

  const yTicks = Array.from({ length: Y_TICKS + 1 }, (_, index) => (domain[1] / Y_TICKS) * index);
  const yLabels = yTicks.map(formatCompactCurrency);
  const marginLeft = axisMargin(yLabels);
  const plotWidth = Math.max(width - marginLeft - MARGIN.right, 1);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const xTicks = ticksForWidth(months, plotWidth);

  const xOf = (month: number) => (months === 0 ? 0 : (month / months) * plotWidth);
  const yOf = (value: number) => plotHeight - (value / domain[1]) * plotHeight;

  const onPointerMove = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
    setHovered(Math.round(ratio * months));
  };

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>
        <h3 className={styles.title}>Evolução do patrimônio</h3>
        <ul className={styles.legend} aria-label="Legenda">
          {lines.map((line) => (
            <li key={line.label}>
              <span className={`${styles.swatch} ${SWATCH_CLASS[line.variant]}`} />
              {line.label}
            </li>
          ))}
        </ul>
      </figcaption>

      <div ref={container} className={styles.plot}>
        <svg width={width} height={HEIGHT} aria-hidden="true">
          <g transform={`translate(${marginLeft} ${MARGIN.top})`}>
            {yTicks.map((value, index) => (
              <g key={index}>
                <line className={styles.grid} x1={0} x2={plotWidth} y1={yOf(value)} y2={yOf(value)} />
                <text className={styles.axis} x={-10} y={yOf(value)} dy="0.32em" textAnchor="end">
                  {yLabels[index]}
                </text>
              </g>
            ))}

            {xTicks.map((month) => (
              <text
                key={month}
                className={styles.axis}
                x={xOf(month)}
                y={plotHeight + 20}
                textAnchor={month === 0 ? 'start' : month === months ? 'end' : 'middle'}
              >
                {monthLabel(month)}
              </text>
            ))}

            <g className={styles.lines}>
              {drawOrder.map((line) => (
                <path
                  key={line.label}
                  className={LINE_CLASS[line.variant]}
                  d={linePath(line.values, plotWidth, plotHeight, domain)}
                />
              ))}
            </g>

            {hovered !== null && (
              <>
                <line className={styles.crosshair} x1={xOf(hovered)} x2={xOf(hovered)} y1={0} y2={plotHeight} />
                {drawOrder.map((line) => (
                  <circle
                    key={line.label}
                    className={DOT_CLASS[line.variant]}
                    cx={xOf(hovered)}
                    cy={yOf(line.values[hovered])}
                    r={4}
                  />
                ))}
              </>
            )}

            <rect
              className={styles.hitArea}
              width={plotWidth}
              height={plotHeight}
              onPointerMove={onPointerMove}
              onPointerDown={onPointerMove}
              onPointerLeave={() => setHovered(null)}
            />
          </g>
        </svg>

        {hovered !== null && (
          <div
            ref={tooltip}
            className={styles.tooltip}
            style={{
              left: tooltipLeft(marginLeft + xOf(hovered), tooltipWidth, width),
              top: MARGIN.top,
            }}
          >
            <strong>{monthLabel(hovered)}</strong>
            {lines.map((line) => (
              <span key={line.label}>
                {line.label}: {formatCurrency(line.values[hovered])}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.srOnly}>
        <table>
          <caption>Evolução do patrimônio mês a mês</caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              {lines.map((line) => (
                <th key={line.label} scope="col">
                  {line.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines[0].values.map((_, month) => (
              <tr key={month}>
                <td>{month}</td>
                {lines.map((line) => (
                  <td key={line.label}>{formatCurrency(line.values[month])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
